# UsefulWrong public release — acceptance record

Version: **1.0**, 10 November 2026. Source: the uploaded `usefulwrong_com-main.tar.gz` snapshot.

## Publication scope

**Eleven public HTML pages** in the deployment artifact:

- `/` — question-led home, two featured works and an invitation to challenge a claim.
- `/works/` — two complete publications.
- `/works/motion.html` — the full movement/routine essay.
- `/works/little-king.html` — the full illustrated Little King story.
- `/works/king-desk/` — the standalone interactive desk linked by the story.
- `/questions/`, `/about/`, `/contact/`, `/feedback/`, `/use/`, `/404.html`.

The old publicly linked Studio, old experimental images and scripts, internal design review drafts, and development-only landing pages were **intentionally not included** in `site/`. The Codex decision skill is development-only at `.agents/skills/uw-decision-loop/`.

## Content preservation

An HTML `article.essay` normalized-text comparison against the supplied source confirms that both articles have **exactly the same textual content and ordering** (including notes and citations):

- `works/motion.html` — 25,645 characters, matching source.
- `works/little-king.html` — 24,295 characters, matching source.

Only obsolete public navigation and an obsolete standalone-experiment link were adjusted. No original source figures, statistics, quotations, fictional scenes or claims were rewritten.

## Static integrity

- `python3 tools/verify_site.py site`: **PASS**.
- All checked local HTML references, anchors, stylesheets, images, CSS URLs and module imports resolve.
- English-language public HTML/CSS/JS checked for Cyrillic characters: **PASS**.
- Internal studio files excluded from the deployment artifact: **PASS**.
- `node --check` on selected public JavaScript: **PASS**.
- Node model tests: **12 passing** (`coat-cloth`, `court-desk-model`, `court-file-model`).
- Site files require no npm install, no backend, and no bundled font binaries.

## Visual testing and limitations

Chromium successfully rendered **9 page templates at both 1440 × 900 and 390 × 844** using embedded CSS and image resources. No horizontal overflow was detected in these 18 checks; feedback draft creation and download were exercised in the embedded review.

The sandbox browser returned `ERR_BLOCKED_BY_ADMINISTRATOR` when navigating to localhost, so this is **not** proof of a real network-loaded E2E experience. Embedded ES module execution was not tested in this round; model logic was tested with Node independently. A real browser inspection on the user's PC after deployment remains required.

No remote GitHub repository was modified and the custom domain is not configured by the archive. Deployment must be completed from the user's Git checkout and GitHub settings.

## Deliberate launch limitations

- No private contact inbox. Reader feedback is prepared locally, and public sharing happens through Reddit.
- No separate forum, newsletter, tracker, advertising, accounts or analytics.
- No dedicated PDF downloads in this release; print and Ctrl+P use the existing article print styles.
- No promises of the 3D artwork or other unfinished experiments on public pages.
- No blanket open license for original works.

The release is intended to be **publishable now** as a focused English journal, without waiting for a future interactive graphics milestone.
