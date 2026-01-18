# Code Simplifier - Post-Implementation Cleanup

Review recent changes and simplify the code following the principle: **"The right amount of complexity is the minimum needed for the current task."**

## Simplification Checklist

### 1. Remove Unnecessary Abstractions
- [ ] Are there helper functions used only once? Inline them.
- [ ] Are there utility classes with single methods? Consider removing.
- [ ] Are there wrapper components that just pass props through? Remove them.
- [ ] Are there interfaces/types defined but used only once? Inline them.

### 2. Consolidate Duplicate Code
- [ ] Are there similar code blocks that could be combined?
- [ ] Are there multiple files doing nearly the same thing?
- [ ] BUT: Don't create abstractions for 2-3 similar lines - that's fine.

### 3. Clean Up Imports
- [ ] Remove unused imports
- [ ] Remove unused variables (prefixed with `_` or completely unused)
- [ ] Sort imports (React first, then external, then internal)

### 4. Simplify Conditionals
- [ ] Can nested if/else be flattened with early returns?
- [ ] Can complex boolean logic be simplified?
- [ ] Are there unnecessary null checks for values that can't be null?

### 5. Remove Over-Engineering
- [ ] Are there feature flags for features that are always on?
- [ ] Are there backward-compatibility shims for removed code?
- [ ] Are there "just in case" error handlers for impossible scenarios?
- [ ] Are there unused props or parameters?

### 6. Comments & Documentation
- [ ] Remove commented-out code (use git history instead)
- [ ] Remove obvious comments that just restate the code
- [ ] Keep comments only where logic isn't self-evident

## What NOT to Simplify

- Don't remove error boundaries (they're essential)
- Don't remove security checks (RLS, auth validation)
- Don't inline complex business logic that benefits from naming
- Don't remove type annotations that aid understanding

## Output Format

For each simplification:
```
File: path/to/file.tsx
Issue: [Description of unnecessary complexity]
Change: [What was simplified]
Lines saved: [Number]
```

## Summary Template

After simplification:
- **Files modified:** X
- **Lines removed:** Y
- **Abstractions removed:** Z
- **Code clarity:** Improved/Unchanged

Remember: Three similar lines of code is better than a premature abstraction.
