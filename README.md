# UsefulWrong — the public website

This repository contains the release of **usefulwrong.com**, an independent English-language publication.

Two complete works are live in the static distribution: **What Happens When the Routine Breaks?** and **A Thousand Agents and One Little King**. The article texts, references, original illustrations and optional embedded interactions are preserved from the supplied project. The public UI is not a mockup or a design studio.

## Repository structure

- `site/` — **the only public website**; all links, CSS, JavaScript, images and the sitemap needed to publish.
- `.github/workflows/pages.yml` — checks and deploys exactly `site/` to GitHub Pages on pushes to `main`.
- `tools/verify_site.py` — offline validation with Python standard library.
- `.agents/skills/uw-decision-loop/` — optional Codex development workflow, never published.

There are no npm dependencies, backends, trackers, accounts, or production build steps.

## Preview locally

```bash
python3 tools/verify_site.py site
python3 -m http.server 4174 --directory site
```

Open `http://127.0.0.1:4174/`. Inspect the two works and their footnotes, navigation, contact path and mobile layout. The standalone royal-desk interaction lives under `/works/king-desk/` and the essay links to it.

## Publish on GitHub Pages

1. Merge this repository structure into your **existing Git checkout** so its history stays intact. See `PUBLISH_NOW.md` for safe replacement commands.
2. Commit the refactor, push `main`, then open GitHub **Settings → Pages → Build and deployment → GitHub Actions**. The included workflow uploads `site/` only.
3. In **Settings → Pages → Custom domain**, set `usefulwrong.com`. Verify domain ownership if needed. Configure your DNS records with your provider according to the official GitHub Pages guide. Enable **Enforce HTTPS** once the certificate is ready.
4. Check the live domain and each public link. The GitHub Pages deployment and DNS propagation are external operations, not performed by this archive.

## Reader feedback

Readers can draft a correction on `/feedback/` and then post it on [r/usefulwrong](https://www.reddit.com/r/usefulwrong/). The composer never sends anything automatically. No private inbox is presented as configured. Public discussion is governed by Reddit's settings.

## Rights and attribution

A public-site terms page describes how materials may be linked to or reused, without making an unsupported blanket open-license claim. The supplied works' source notes and AI disclosures remain with each article. The public release uses system-font fallbacks and ships no separate font files.

## Safe iteration

The internal decision-loop skill remains available to Codex, but its variants are never copied into the public site. Publishing can happen without running that skill or starting any local design studio.
