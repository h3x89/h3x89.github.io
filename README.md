# Robert Kubiś — Personal Website

This repository contains the static personal website and portfolio of Robert Kubiś, focused on platform engineering, observability, automation, AI-enabled operations and DevOps leadership.

## Overview

The site presents Robert's current professional focus, selected platform engineering work, public CV, contact links and the Agentic SRE portfolio case study.

The content is intentionally public-safe and concise. It should describe what is currently published, not act as a personal TODO list or a speculative architecture plan.

## Live site

- https://robertkubis.pl/
- https://h3x89.github.io/

## What is included

- main landing page and portfolio overview;
- Agentic SRE case study;
- public CV link;
- GitHub, LinkedIn and email contact links;
- static HTML, CSS, JavaScript and image assets.

## Repository structure

| Path | Purpose |
|---|---|
| `index.html` | Main landing page. |
| `css/` | Shared styling for the public site. |
| `js/` | Small interactive frontend modules. |
| `assets/` | Images and static assets. |
| `agentic-sre/` | Short redirect route to the Agentic SRE case study. |
| `case-studies/agentic-sre/` | Agentic SRE portfolio case study. |
| `RobertKubisResume.pdf` | Public CV linked from the homepage. |
| `CNAME` | GitHub Pages custom domain configuration for `robertkubis.pl`. |

## Local preview

Serve the site through a local HTTP server instead of opening files directly:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

A local HTTP server is preferred because browser behavior can differ when static assets and JavaScript modules are loaded from the local filesystem.

## Review checklist

Before publishing a change, check:

- the homepage loads on desktop and mobile widths;
- `/agentic-sre/` redirects to the case study;
- `/case-studies/agentic-sre/` loads correctly;
- CV, GitHub, LinkedIn and Mail links work;
- the browser console has no obvious errors;
- no private hostnames, credentials, real internal logs or sensitive infrastructure details are exposed.

## Deployment

This is a static GitHub Pages website. The primary public domain is `robertkubis.pl`, with `h3x89.github.io` available as the GitHub Pages fallback.