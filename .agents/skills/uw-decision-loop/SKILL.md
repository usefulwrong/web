---
name: uw-decision-loop
description: Escalate irreversible or high-impact UsefulWrong editorial/design decisions to a human with comparable, runnable alternatives; protect prior decisions.
---

# UsefulWrong decision loop (development only)

Do not let this skill run on the published site. It is a private development workflow, not a product feature.

## Baseline
- Two published essays are authored source material. Preserve their argument, order, citations, and voice unless the author explicitly requests editorial changes.
- The two approved mark variants are `site/assets/logo-paper.svg` and `site/assets/logo-dark.svg` (dark U on paper, light U on dark; orange W in both).
- Public architecture: question-led home, Works, Questions, About, Contact, Reading & reuse, and public-facing feedback. Do not add a public studio, dashboards, or gamification for its own sake.
- The current web release is in `site/`; the deployment workflow publishes only that directory.

## Escalate only meaningful uncertainty
Create a decision round for an issue that changes the public identity, reader comprehension, core navigation, authorial claim, or nontrivial interactive behavior. Do not ask about routine spacing, a trivial bug, or a standard accessibility fix.

1. Record the precise decision, constraints, current behavior, and plausible alternatives.
2. Prepare **2–3 genuinely different** preview implementations. Prefer a tiny isolated HTML comparison under a private temporary path such as `dev/decisions/<slug>/`; never copy it into `site/` or the deployment artifact.
3. Show each alternative at 1440px and 390px, with the same content; state one concrete tradeoff per alternative.
4. Accept structured feedback with `keep | maybe | drop`, notes, and a **single explicit winner**. Votes are not permission to publish.
5. Apply only after a separate authorization. Preserve the rejected versions in Git history or development notes, not in the deployed site.
6. Rerun `python3 tools/verify_site.py site`, browser checks, source-content checks, and review the new screenshots. Stop at the next substantial ambiguity.

## Conflict order
Explicit author decision > approved public-site constraints > factual and accessibility correctness > external design skill preferences > aesthetic guesses.

Do not interpret a missing answer as approval. Do not request the same choice twice. A new sketch cannot overrule an approved one without an explicit decision and visual comparison.
