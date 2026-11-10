# Launch checklist — usefulwrong.com

## 1. Apply the clean release to the existing Git repository

Use the actual local checkout for the repository with its `.git` history. Do not create an unrelated new Git repository if you want previous revisions preserved.

Create a safety branch or tag before replacing files:

```bash
git status --short
git branch backup/before-public-release
git switch main
```

Then, from the existing repository root (adjust the archive path as needed), preview the replacement:

```bash
rsync -avhn --delete --exclude='.git' /path/to/UW_PUBLISH_READY_v1/ ./
```

Review the file deletion list. To apply deliberately, remove `n` from `-avhn`:

```bash
rsync -avh --delete --exclude='.git' /path/to/UW_PUBLISH_READY_v1/ ./
python3 tools/verify_site.py site
git status --short
git add -A
git commit -m "refactor: publish UsefulWrong as a focused English journal"
git push origin main
```

**Do not run the destructive rsync command from the wrong directory.** It intentionally deletes abandoned files while retaining the real Git history.

## 2. GitHub settings

- Go to **Settings → Pages** in the actual repository.
- Under **Build and deployment**, choose **GitHub Actions** (not a branch folder).
- Confirm `Publish UsefulWrong` completed successfully under Actions.
- Under **Custom domain**, enter `usefulwrong.com` and save it before configuring public DNS.
- Verify domain ownership, enable **Enforce HTTPS** as soon as GitHub makes it available.

GitHub's current apex-domain A records (verify against their official docs before configuring):

```text
@ A 185.199.108.153
@ A 185.199.109.153
@ A 185.199.110.153
@ A 185.199.111.153
```

For `www`, use a CNAME to your GitHub Pages `<account>.github.io` host **without** the repository path. GitHub can redirect between www and the apex domain when both are configured.

## 3. Manual post-deploy acceptance

- `https://usefulwrong.com/` opens over HTTPS, with the chosen dark U and orange W on paper.
- Both complete articles open and their illustrations load.
- The table of contents, note links and reader menu work on desktop and mobile.
- The royal desk works where linked from Little King; its alternate no-JS explanation remains usable.
- About, Contact, Questions, Reading & reuse and Feedback all work.
- No navigation link leads to the removed design studio or a placeholder experiment.
- The feedback form does not claim it has sent anything; Reddit is the explicit next step.
- No unapproved email address, private contact, analytics script or draft manuscript is exposed.
- Check site metadata and previews with a social link debugger after publishing.

## 4. What is intentionally not included

- A promised 3D overhaul, rotating weekly-question personalization, external analytics, email subscription, author accounts, or a private comment backend.
- Any internal design studios or archived experimental image collections.

The first publication should be a real, reliable journal rather than a preview of future features.
