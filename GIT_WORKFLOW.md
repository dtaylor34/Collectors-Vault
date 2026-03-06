# The Collector's Vault — Git & Version Control Workflow

## Semantic Versioning

We use **semver** (MAJOR.MINOR.PATCH):

| Version | When to use | Example |
|---------|-------------|---------|
| **v1.0.0 → v2.0.0** | Breaking changes, major redesign, new architecture | New tab structure, Supabase migration |
| **v1.0.0 → v1.1.0** | New features, new screens, significant additions | Want List, AI Scan, Price Charts |
| **v1.0.0 → v1.0.1** | Bug fixes, copy changes, small UI tweaks | Fix CORS proxy, fix font loading |

---

## Branch Strategy

```
main              ← Production-ready, always works
  ├── develop     ← Integration branch, daily work
  ├── feature/*   ← New features (branch from develop)
  ├── fix/*       ← Bug fixes (branch from develop or main)
  └── release/*   ← Release prep (branch from develop)
```

### Creating a Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/want-list
# ... do your work ...
git add -A
git commit -m "feat: add want list with priority levels and matching"
git push origin feature/want-list
# Then merge to develop via PR or:
git checkout develop
git merge feature/want-list
git push origin develop
```

### Creating a Fix Branch
```bash
git checkout main
git pull origin main
git checkout -b fix/cors-proxy
# ... fix the bug ...
git add -A
git commit -m "fix: CORS proxy URL encoding for Comic Vine"
git push origin fix/cors-proxy
git checkout main
git merge fix/cors-proxy
git push origin main
```

---

## Commit Message Format

Use **conventional commits** for clean changelogs:

```
type(scope): short description

Optional longer body explaining what and why.
```

### Types

| Type | Use for | Example |
|------|---------|---------|
| `feat` | New feature | `feat(scan): add AI camera scan with 3 free tier` |
| `fix` | Bug fix | `fix(comicvine): correct issue IDs for Hulk 181` |
| `style` | UI/theme changes | `style(theme): add high contrast mode` |
| `refactor` | Code restructure, no behavior change | `refactor(data): split PricingEntry metadata` |
| `docs` | Documentation | `docs: add GIT_WORKFLOW.md` |
| `chore` | Dependencies, config, cleanup | `chore: remove hardcoded Firebase project name` |
| `perf` | Performance | `perf(scan): cache AI results by image hash` |
| `security` | Security fixes | `security: remove exposed API keys from source` |

### Examples — Small Updates (Patch)
```bash
git commit -m "fix(scan): add parens to nullish coalescing on line 221"
git commit -m "fix(theme): correct statusBar color reference"
git commit -m "style(tabs): update icon order to Search, Vault, Auction, Scan, Profile"
git commit -m "chore: clean .env.example, remove duplicate Comic Vine key"
```

### Examples — Feature Updates (Minor)
```bash
git commit -m "feat(scan): AI camera identification with multi-suggestion flow"
git commit -m "feat(browse): item detail view with lightbox zoom"
git commit -m "feat(charts): price trend chart with 1M/6M/1Y/5Y/ALL ranges"
git commit -m "feat(sharing): collection sharing with Owner/Editor/Viewer roles"
git commit -m "feat(wantlist): want list with priority, condition filter, and offer system"
```

### Examples — Major Updates
```bash
git commit -m "feat!: migrate from local state to Supabase backend"
git commit -m "feat!: v2.0 redesign with Material Design 3 theme system"
```

---

## Tagging Releases

After merging to `main`, tag the release:

```bash
# Tag a release
git tag -a v1.2.0 -m "v1.2.0 — AI Scan, Price Charts, Want List"
git push origin v1.2.0

# List all tags
git tag -l

# See what's in a release
git log v1.1.0..v1.2.0 --oneline
```

---

## Day-to-Day Workflow

### Starting Work
```bash
cd ~/collectors-vault
git checkout develop
git pull origin develop
```

### Small Fix (straight to develop)
```bash
# Fix a bug
git add -A
git commit -m "fix(browse): cover image not loading on web"
git push origin develop
```

### Bigger Feature (use a branch)
```bash
git checkout -b feature/auction-bidding
# Work for a few days...
git add -A
git commit -m "feat(auction): real-time bidding with Supabase Realtime"
git push origin feature/auction-bidding
# When done:
git checkout develop
git merge feature/auction-bidding
git branch -d feature/auction-bidding
git push origin develop
```

### Ready for Release
```bash
git checkout main
git merge develop
git tag -a v1.3.0 -m "v1.3.0 — Auction bidding, sharing improvements"
git push origin main --tags
```

---

## Quick Commands Reference

```bash
# Status check
git status                    # What's changed?
git log --oneline -10         # Recent commits
git diff                      # See uncommitted changes

# Daily push
git add -A                    # Stage everything
git commit -m "type: message" # Commit with message
git push                      # Push to remote

# Undo mistakes
git checkout -- filename      # Discard changes to a file
git reset HEAD~1              # Undo last commit (keep changes)
git stash                     # Temporarily shelve changes
git stash pop                 # Bring them back

# See what's different between branches
git log develop..main --oneline

# Check remote
git remote -v                 # See remote URL
git fetch origin              # Get latest without merging
```

---

## Release Checklist

Before tagging a new version:

- [ ] All features working locally (`npx expo start --clear`)
- [ ] No TypeScript errors (check terminal for red)
- [ ] No hardcoded API keys or secrets (`grep -rn "sk-ant" app/ lib/ hooks/`)
- [ ] `.env` is NOT committed (`git status` should not show .env)
- [ ] `.env.example` is up to date with any new env vars
- [ ] PLAN.md updated with current status
- [ ] Test on web + mobile (if possible)
- [ ] Commit message follows conventional format
- [ ] Tag with semver

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| v1.0.0 | 2026-03-05 | Initial commit — 5 tabs, 18 comics, seed data, theme system |
| v1.0.1 | 2026-03-05 | GIT_WORKFLOW, cursor rules, project plan, config updates |
| v1.1.0 | TBD | AI Scan, Want List, Price Charts, Item Detail, Collection Sharing |
| v1.2.0 | TBD | Edge Function, 3-free-scan tier, Haiku-first pricing |
| v2.0.0 | TBD | Supabase backend live, real auth, real-time auctions |

---

## Files You Should NEVER Commit

These are in `.gitignore` — if `git status` ever shows them, something is wrong:

```
.env              ← Your real API keys
.env.local        ← Local overrides
node_modules/     ← Dependencies (reinstall with npm install)
.expo/            ← Expo cache
dist/             ← Build output
web-build/        ← Web build output
*.jks             ← Android keystore
*.p8 / *.p12      ← iOS certificates
```

If you accidentally commit `.env`:
```bash
git rm --cached .env
git commit -m "security: remove .env from tracking"
git push
# Then rotate ALL keys that were exposed
```
