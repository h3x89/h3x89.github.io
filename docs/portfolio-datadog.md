# Portfolio Datadog RUM

This repository uses Datadog Real User Monitoring (RUM) to understand how the public portfolio at `robertkubis.pl` is used.

## Why this exists

The site is a low-traffic public portfolio, so the useful questions are not only technical performance questions. The important questions are:

- how many people visit the site;
- which public pages they open;
- which countries, devices and browsers the traffic comes from;
- whether visitors click CV, GitHub, LinkedIn, Mail or Agentic SRE links;
- whether the Agentic SRE case study gets engagement;
- whether there are frontend errors, long tasks, slow resources or frustration signals;
- whether some visits look like bots or AI crawlers.

## Current implementation

Datadog RUM is initialized from:

~~~text
/js/datadog.js
~~~

The browser SDK is loaded from:

~~~text
https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js
~~~

Current RUM identity:

~~~text
service: robertkubis.pl
env: production
site: datadoghq.com
~~~

The Datadog browser client token is public by design. Do not add Datadog API keys, app keys or other private credentials to this repository.

## Sampling and privacy

RUM session sampling is intentionally set to:

~~~text
sessionSampleRate: 100
~~~

Reason: this is a low-traffic personal portfolio, and the owner wants visibility into the full sampled browser traffic rather than losing most sessions at 10% sampling.

Session Replay remains disabled:

~~~text
sessionReplaySampleRate: 0
~~~

Reason: the current goal is analytics and performance visibility, not replaying visitor sessions. Keeping replay disabled is simpler and more privacy-conscious for a public portfolio.

The default privacy level remains:

~~~text
defaultPrivacyLevel: mask-user-input
~~~

## Page coverage

Meaningful public HTML pages should load Datadog RUM.

Known public entry points:

| Path | Purpose | RUM coverage expectation |
|---|---|---|
| `/` | Main portfolio homepage | Covered |
| `/index.html` | Main portfolio homepage | Covered |
| `/agentic-sre/` | Short redirect to the Agentic SRE case study | Not instrumented directly; final destination is more important |
| `/sreagent/` | Legacy redirect path to the Agentic SRE shortcut | Not instrumented directly; redirect-only route |
| `/case-studies/agentic-sre/` | Main Agentic SRE portfolio case study | Should be covered |
| `/RobertKubisResume.pdf` | Public CV PDF | Cannot execute RUM directly; track clicks leading to it |

Redirect-only routes are intentionally left without Datadog RUM. They immediately forward visitors to the canonical case-study URL, so instrumenting them would add noisy transient views while still failing to capture non-JavaScript traffic.

Static assets such as CSS, images, favicons and PDFs do not execute Datadog RUM. They can only be observed indirectly when loaded as resources by a RUM-covered page or when a click leading to them is tracked.

## Custom actions

`/js/datadog.js` emits portfolio-specific RUM actions.

Page-level action:

- `portfolio_page_view`

Click actions:

- `portfolio_click_cv`
- `portfolio_click_github`
- `portfolio_click_linkedin`
- `portfolio_click_mail`
- `portfolio_click_agentic_sre`

Agentic SRE graph actions, when the interactive graph is present:

- `agentic_sre_graph_mode_change`
- `agentic_sre_graph_node_click`

Common attributes include:

- `path`
- `page_type`
- `canonical_url`
- `referrer_domain`
- `likely_bot_or_ai`
- `bot_family`

## Bot and AI crawler classification

The implementation includes a lightweight browser-side user-agent heuristic:

~~~text
likely_bot_or_ai: true | false
bot_family: chatgpt | claude | perplexity | googlebot | bingbot | other_bot | unknown
~~~

This is best-effort only.

Important limitation: Datadog RUM only sees visitors that execute JavaScript and successfully send browser telemetry. Many crawlers, scrapers and AI agents do not execute JavaScript or block third-party telemetry. Therefore RUM should not be treated as complete crawler accounting.

## What Datadog can answer

Use Datadog RUM to answer:

- sessions and page views over time;
- top visited paths via `@view.url_path`;
- traffic by country via `@geo.country`;
- split by device and browser;
- clicks on CV, GitHub, LinkedIn, Mail and Agentic SRE;
- frontend errors;
- long tasks and resource timings;
- frustration signals;
- best-effort bot/AI classifications where JavaScript ran.

## Suggested Datadog views

In Datadog, start with:

~~~text
UX Monitoring > RUM Applications > robertkubis.pl
~~~

Useful RUM Explorer filters:

~~~text
service:robertkubis.pl env:production
~~~

Homepage and case study paths:

~~~text
@view.url_path:/
@view.url_path:/case-studies/agentic-sre/
~~~

Custom actions:

~~~text
@action.name:portfolio_click_cv
@action.name:portfolio_click_github
@action.name:portfolio_click_linkedin
@action.name:portfolio_click_mail
@action.name:portfolio_click_agentic_sre
@action.name:agentic_sre_graph_mode_change
@action.name:agentic_sre_graph_node_click
~~~

Best-effort bot/AI classification:

~~~text
@context.likely_bot_or_ai:true
@context.bot_family:chatgpt
@context.bot_family:claude
@context.bot_family:perplexity
~~~

Suggested dashboard widgets:

- sessions over time;
- page views by `@view.url_path`;
- countries by `@geo.country`;
- devices/browsers;
- custom action counts;
- Agentic SRE graph interaction counts;
- frontend errors;
- long tasks and slow resources;
- best-effort bot/AI classified actions.

## What RUM cannot answer completely

RUM cannot reliably answer:

- how many non-JavaScript crawlers scraped the site;
- how many direct PDF downloads happened without a tracked page click;
- full raw access-log traffic;
- all AI agent visits.

For complete crawler/scraper visibility, the site would need edge or request logs. GitHub Pages does not expose full access logs. A future improvement could place `robertkubis.pl` behind Cloudflare and forward edge/request logs to Datadog through an appropriate Cloudflare/Datadog integration, Worker or Logpush setup. That should be tracked separately from RUM coverage.

## Local validation

Serve the repository locally:

~~~bash
python3 -m http.server 8000
~~~

Then check:

~~~text
http://localhost:8000/
http://localhost:8000/agentic-sre/
http://localhost:8000/sreagent/
http://localhost:8000/case-studies/agentic-sre/
~~~

Validation checklist:

- no obvious browser console errors;
- `/js/datadog.js` is requested from RUM-covered pages;
- nested pages do not try to load `case-studies/agentic-sre/js/datadog.js`;
- existing homepage interactions still work;
- Agentic SRE graph interactions still work;
- RUM initialization failure does not break the site.
