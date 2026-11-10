# UsefulWrong repository rules

- Public site files live **only** under `site/`. Deployment uploads `site/`, not the repository root.
- All public UI, source comments, and project documentation must be in English.
- Do not alter the original voice, headings, paragraph order, citations or illustrative works without an explicit editorial task.
- Preserve the approved light/dark UW brand marks and the current paper/ink/orange identity.
- Read the source work before adding UI. Reading is primary; interactions are optional and local.
- No invented statistics, first-person experiences, quotes, testimonials, or hidden form submissions.
- Run `python3 tools/verify_site.py site` before committing.
- For high-impact design decisions, use `.agents/skills/uw-decision-loop/SKILL.md`. Keep the comparison studio outside `site/`.
