# Verify App - Wellth.ai Quality Gate

Run comprehensive verification checks before any PR or deployment.

## Verification Steps

### 1. Build Verification
Run the TypeScript build to catch type errors:
```bash
npm run build
```
This must pass with ZERO errors before proceeding.

### 2. Code Quality Checks
Scan for common issues in changed files:

- [ ] No `console.log` statements in production code (except error handlers)
- [ ] No `SELECT *` queries - all columns should be explicit
- [ ] No hardcoded secrets, API keys, or tokens
- [ ] No PHI (Protected Health Information) in error messages or logs
- [ ] No `localStorage` usage for auth tokens (use `sessionStorage`)

### 3. Security Verification
For any database-related changes:
- [ ] RLS (Row Level Security) policies exist for new tables
- [ ] User ownership is verified in queries (`.eq('user_id', user.id)`)
- [ ] Edge functions validate JWT tokens
- [ ] No service role key exposed to frontend

### 4. Component Verification
For UI changes:
- [ ] New pages wrapped in error boundaries
- [ ] Loading states handled (not just happy path)
- [ ] Error states handled with user-friendly messages
- [ ] Responsive design works on mobile (check with devtools)

### 5. Edge Function Verification
For Supabase function changes:
- [ ] CORS headers include environment-based origin
- [ ] Authentication check at start of function
- [ ] Error responses don't leak internal details
- [ ] PHI is redacted before any external API calls

## Quick Commands

```bash
# Full verification suite
npm run build && echo "Build passed!"

# Check for console.logs
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v "errorHandler"

# Check for SELECT *
grep -r "select\('\*'\)" src/ --include="*.ts" --include="*.tsx"
```

## Report Format

After running checks, report:
1. **Build Status:** PASS/FAIL
2. **Issues Found:** List any problems
3. **Recommendations:** Suggested fixes
4. **Ready for PR:** YES/NO

If any critical issues are found, do NOT proceed with commit/PR until resolved.
