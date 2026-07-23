# AWS CloudFront Preview — runbook

This documents the guarded AWS CloudFront preview deployment path added by
`.github/workflows/aws-cloudfront-preview.yml`, alongside the existing
Cloudflare Pages deployment. It does not replace Cloudflare Pages or GitHub
Pages — see [Relationship to existing deployments](#relationship-to-existing-deployments).

Related: [h3x89/home_lab#1008](https://github.com/h3x89/home_lab/issues/1008).

## 1. Required repository variables

Configure these as **repository variables** (Settings → Secrets and
variables → Actions → Variables), not secrets:

| Variable | Example shape | Purpose |
|---|---|---|
| `AWS_PREVIEW_ROLE_ARN` | `arn:aws:iam::<account-id>:role/<role-name>` | IAM role the workflow assumes via OIDC |
| `AWS_PREVIEW_REGION` | `eu-central-1` | AWS region for the S3 bucket / CLI calls |
| `AWS_PREVIEW_CONTENT_BUCKET` | `<bucket-name>` | Private S3 bucket serving CloudFront via OAC |
| `AWS_PREVIEW_DISTRIBUTION_ID` | `E1A2B3C4D5E6F7` | The one CloudFront distribution |

These are non-secret identifiers (an IAM role ARN, region, bucket name, and
distribution ID do not grant access on their own — the OIDC trust policy is
what restricts who can assume the role). They are intentionally repository
**variables**, not secrets, so they are visible in workflow run logs'
`vars` context without needing masking, while still never being committed to
the repository.

This PR does **not** create or set these variables. That is a separate,
explicit follow-up after this PR is reviewed.

## 2. Why no AWS secrets are required

Authentication uses GitHub's OIDC provider (`token.actions.githubusercontent.com`)
against a repository-specific IAM role already provisioned in
`home_lab` via OpenTofu (see
[h3x89/home_lab#1009](https://github.com/h3x89/home_lab/pull/1009)). The
workflow requests a short-lived STS session token at run time
(`aws-actions/configure-aws-credentials`); no long-lived `AWS_ACCESS_KEY_ID`
/ `AWS_SECRET_ACCESS_KEY` pair exists anywhere in this repository or its
Actions configuration. The PR-validation job in this workflow includes a
step that fails the run if any workflow file references
`secrets.AWS_ACCESS_KEY_ID`, `secrets.AWS_SECRET_ACCESS_KEY`, or
`secrets.AWS_SESSION_TOKEN`.

## 3. Trust is restricted to `main`

The IAM role's trust policy accepts only:

```
repo:h3x89/h3x89.github.io:ref:refs/heads/main
```

with OIDC audience `sts.amazonaws.com`. A workflow run triggered from a
pull request branch, a fork, or any ref other than `refs/heads/main` cannot
assume the role — `aws-actions/configure-aws-credentials` will fail the
OIDC exchange. This workflow additionally gates both `aws-readonly-check`
and `aws-deploy` on `github.ref == 'refs/heads/main'` as a fail-fast
convenience, so a manual dispatch from a non-`main` ref never even attempts
an OIDC exchange: those two jobs are skipped outright by workflow logic,
before the IAM trust policy would independently reject them anyway. The
trust policy remains the final, independent protection regardless of this
workflow's own conditions.

A `workflow_dispatch` from any ref other than `main` therefore only ever
runs `package-validate` (offline). Both `aws-readonly-check` and
`aws-deploy` are skipped — no OIDC token is requested, no repository
variable is read, and no AWS call occurs.

Every `aws-actions/configure-aws-credentials` step also sets
`mask-aws-account-id: true`, so the resolved AWS account ID is masked in
Actions logs in addition to never being explicitly printed by this
workflow's own scripts.

## 4. PR runs are offline only

The `package-validate` job runs on every pull request and never requests an
AWS token (job-level `permissions` omits `id-token: write`). It:

1. runs the staging-script test suite (`tests/test_stage_static_site.sh`);
2. stages the exact allowlisted package (`scripts/stage-static-site.sh`);
3. runs a dependency-free internal-link check against the staged HTML;
4. rejects any static AWS credential secret reference in workflow files;
5. validates workflow YAML syntax;
6. uploads the staged package as a short-lived (1-day) Actions artifact.

No AWS credentials, no AWS CLI calls, no network calls to AWS occur in this
job.

## 5. First post-merge run must use `mode=validate`

After this PR is merged and the repository variables above are configured,
the **first** manual run (`workflow_dispatch`) must use `mode: validate`
(the default). This performs read-only checks only:

- confirms the assumed OIDC role matches the expected role;
- confirms the target bucket is reachable;
- confirms the CloudFront distribution exists, is enabled, has status
  `Deployed`, has a domain name, and serves exactly the expected
  production aliases (`robertkubis.pl`, `www.robertkubis.pl`);
- reports the bucket's current object count (informational).

No object is uploaded, deleted, or invalidated during a `validate` run, and
the distribution's configuration (`Enabled`, aliases, or anything else) is
never changed.

## 6. Deploy requires the exact `DEPLOY` confirmation

The `aws-deploy` job runs only when **all** of the following hold:

- the event is `workflow_dispatch`;
- the selected ref is exactly `refs/heads/main`;
- `mode` is `deploy`;
- `confirm_deploy` is exactly the string `DEPLOY`.

Any other combination — including the default manual invocation, a push, or
a pull request — never uploads content. `aws-deploy` re-runs every
read-only preflight check before syncing content, then:

1. `aws s3 sync` with `--delete` (short-lived, non-immutable cache headers,
   since filenames are not content-addressed) followed by a targeted
   `aws s3 cp --metadata-directive REPLACE` pass to set `no-cache` on HTML
   entry points;
2. verifies the bucket's object count matches the staged file count;
3. verifies all required entry files (`index.html`,
   `agentic-sre/index.html`, `case-studies/agentic-sre/index.html`,
   `sreagent/index.html`) are present in the bucket;
4. creates a single CloudFront invalidation for `/*` and confirms it was
   accepted;
5. confirms the distribution is still enabled, still `Deployed`, and still
   serving the same production aliases after deployment.

The `aws-deploy` job carries a dedicated `concurrency` group
(`aws-cloudfront-preview-deploy`, `cancel-in-progress: false`) so two
deployments can never run concurrently, and an in-flight deployment is
never cancelled by a newer trigger.

The job's step summary reports `Invalidation | accepted` **only** when the
sync-and-invalidate step exits successfully — since `deploy-to-aws.sh` only
exits `0` after the S3 sync succeeds, required entry files are confirmed
present in the bucket, the invalidation was accepted, and the distribution
was reconfirmed enabled, `Deployed`, and serving the same production
aliases. If that step does not complete successfully, the summary instead
reports `failed` (the step ran and errored) or `not completed` (the step
never ran, e.g. an earlier preflight failed) — never a hardcoded,
unconditional "requested". The same outcome-derived status governs the
`Distribution enabled and deployed` summary line, so it is never reported
as confirmed unless the deploy step actually reached and passed that
check.

## 7. CloudFront remains enabled and deployed after deployment

`robertkubis.pl` / `www.robertkubis.pl` are served by this distribution in
production, so it is expected to already be enabled and `Deployed` before
any run starts, and to remain that way afterward. Every `validate` and
`deploy` run re-checks the distribution's `Enabled` flag, `Status`, and
alias list, and fails loudly if `Enabled` is anything other than `true`,
`Status` is anything other than `Deployed`, or the aliases don't exactly
match `robertkubis.pl` / `www.robertkubis.pl`. This workflow only ever
reads that state — there is no code path in `scripts/aws-readonly-
preflight.sh` or `scripts/deploy-to-aws.sh` that changes the distribution's
`Enabled` flag, aliases, or any other infrastructure configuration; content
sync (`aws s3 sync`) and cache invalidation (`aws cloudfront
create-invalidation`) are the only mutating AWS calls either script makes.
Any change to the distribution's own configuration (enabling/disabling it,
changing aliases, origins, or the attached CloudFront Function) stays in
`home_lab`'s OpenTofu `sites/robertkubis-preview` root, not in this
workflow.

## 8. Cloudflare Pages and GitHub Pages remain fallbacks

`.github/workflows/cloudflare-pages.yml` is unchanged in behavior (it now
calls the shared `scripts/stage-static-site.sh`, proven to produce an
identical staged manifest to its previous inline staging step) and
continues to deploy on every push/PR to `main` exactly as before. GitHub
Pages, if configured via repository settings and the `CNAME` file, is
untouched by this PR. The AWS path is additive and does not replace either.

## 9. Rollback procedure

Four distinct rollback scenarios, kept separate deliberately:

- **Roll back deployed content**: re-run this workflow with
  `mode=deploy`, `confirm_deploy=DEPLOY`, from `main` at the desired
  previous commit (e.g. by checking out that commit on a temporary branch
  merged to `main`, or reverting the offending commit on `main` first).
  The next deploy run syncs whatever is on `main` at run time.
- **Restore a specific S3 object version manually**: the bucket has S3
  versioning enabled (per the confirmed infrastructure state). If a single
  object needs restoring outside of a full redeploy, use
  `aws s3api list-object-versions` / `aws s3api copy-object` against the
  specific `VersionId` — this is a manual, human-run operation, not
  something this workflow automates.
- **CloudFront**: leave disabled, or disable again if it was ever manually
  enabled. This workflow never enables it, so no workflow-driven rollback
  is needed here.
- **Infrastructure rollback** (IAM role, OIDC provider, S3 bucket,
  CloudFront distribution, Web ACL): stays entirely in `home_lab`'s
  OpenTofu roots (see
  [h3x89/home_lab#1009](https://github.com/h3x89/home_lab/pull/1009)). This
  workflow has no ability to modify infrastructure and does not attempt to.
