# Commit, Push, and Create PR

Streamlined workflow for committing changes and opening a pull request.

## Pre-flight Checks

Before committing, run quick verification:
```bash
npm run build
```

If build fails, fix errors before proceeding.

## Workflow Steps

### 1. Gather Context
Run these commands to understand current state:
```bash
git status
git diff --staged
git diff
git log --oneline -5
```

### 2. Stage Changes
Stage relevant files (review each change):
```bash
git add <files>
```

Do NOT stage:
- `.env` or any files with secrets
- `node_modules/`
- Build artifacts
- Files with debugging console.logs

### 3. Create Commit
Use conventional commit format:

| Type | Use For |
|------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring (no behavior change) |
| `docs:` | Documentation only |
| `style:` | Formatting, whitespace |
| `test:` | Adding/updating tests |
| `chore:` | Maintenance, dependencies |

Example:
```bash
git commit -m "feat: add bill error detection for duplicate charges

- Implement duplicate charge detection algorithm
- Add UI warning for potential duplicates
- Update bill review card to show error count

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. Push to Remote
```bash
git push -u origin <branch-name>
```

If branch doesn't exist remotely, this creates it.

### 5. Create Pull Request
Use GitHub CLI:
```bash
gh pr create --title "feat: descriptive title" --body "## Summary
- Change 1
- Change 2

## Test Plan
- [ ] Verified build passes
- [ ] Tested in browser
- [ ] Checked mobile responsiveness

---
Generated with Claude Code"
```

## Quick One-Liner (After Staging)

```bash
git commit -m "message" && git push -u origin $(git branch --show-current) && gh pr create --fill
```

## PR Template

```markdown
## Summary
[2-3 bullet points describing what changed]

## Changes
- File 1: [what changed]
- File 2: [what changed]

## Test Plan
- [ ] Build passes (`npm run build`)
- [ ] Tested in browser
- [ ] No console errors
- [ ] Mobile responsive

## Screenshots (if UI change)
[Add screenshots here]

---
Generated with [Claude Code](https://claude.ai/code)
```

## Notes
- Always run `/verify-app` before creating PR for significant changes
- Link to issues with `Fixes #123` or `Closes #123`
- Request review from appropriate team members
