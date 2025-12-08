# Coding Standards

This guide outlines the coding standards and best practices for developing Wellth.ai. Following these standards ensures consistency, maintainability, and security across the codebase.

## Table of Contents

- [TypeScript Standards](#typescript-standards)
- [React Patterns](#react-patterns)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Styling Guidelines](#styling-guidelines)
- [Error Handling](#error-handling)
- [Security Requirements](#security-requirements)
- [Testing Standards](#testing-standards)
- [Code Review Checklist](#code-review-checklist)

---

## TypeScript Standards

### Strict Mode Required

All TypeScript must pass strict type checking:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### Type Definitions

**Interfaces over Types for Objects:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

// ❌ Avoid for objects
type User = {
  id: string;
  email: string;
  name: string;
}
```

**Use `type` for:**
- Unions: `type Status = 'pending' | 'approved' | 'rejected'`
- Intersections: `type Extended = Base & Additional`
- Mapped types: `type Readonly<T> = { readonly [P in keyof T]: T[P] }`

**Explicit Return Types:**
```typescript
// ✅ Good - explicit return type
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - inferred return type on exported function
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Runtime Validation with Zod

Use Zod for all user input validation:

```typescript
import { z } from 'zod';

// Define schema
const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1).max(50),
  date: z.string().datetime(),
  isHsaEligible: z.boolean().optional()
});

// Validate at runtime
function createExpense(data: unknown) {
  const validated = expenseSchema.parse(data); // Throws if invalid
  // validated is now typed as { amount: number, category: string, ... }
}
```

### Avoid `any`

```typescript
// ❌ Bad
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// ✅ Good
interface DataItem {
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}

// ✅ Also acceptable when type truly unknown
function processUnknown(data: unknown) {
  if (Array.isArray(data)) {
    // Type narrowing
  }
}
```

---

## React Patterns

### Function Components Only

```typescript
// ✅ Good
export function ExpenseList({ userId }: Props) {
  return <div>...</div>;
}

// ❌ Bad - no class components
export class ExpenseList extends React.Component {
  render() {
    return <div>...</div>;
  }
}
```

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface ExpenseListProps {
  userId: string;
  onExpenseClick?: (id: string) => void;
}

// 3. Component
export function ExpenseList({ userId, onExpenseClick }: ExpenseListProps) {
  // 4. Hooks (in order: state, queries, mutations, effects, refs)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => fetchExpenses(userId)
  });

  // 5. Event handlers
  const handleExpenseClick = (id: string) => {
    setSelectedId(id);
    onExpenseClick?.(id);
  };

  // 6. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 7. Early returns
  if (isLoading) return <Skeleton />;
  if (!expenses) return <EmptyState />;

  // 8. Render
  return (
    <div className="space-y-4">
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          isSelected={expense.id === selectedId}
          onClick={() => handleExpenseClick(expense.id)}
        />
      ))}
    </div>
  );
}
```

### Hooks Best Practices

**Custom Hooks:**
```typescript
// Prefix with 'use'
function useExpenses(userId: string) {
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => fetchExpenses(userId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

**Hook Dependencies:**
```typescript
// ✅ Good - all dependencies listed
useEffect(() => {
  fetchData(userId, filter);
}, [userId, filter]);

// ❌ Bad - missing dependencies
useEffect(() => {
  fetchData(userId, filter);
}, [userId]); // ESLint will warn
```

### State Management

**Server State (React Query):**
```typescript
// Use React Query for server data
const { data, isLoading, error } = useQuery({
  queryKey: ['expense', id],
  queryFn: () => fetchExpense(id)
});

const mutation = useMutation({
  mutationFn: createExpense,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  }
});
```

**Local State (useState):**
```typescript
// Use useState for component-local state
const [isOpen, setIsOpen] = useState(false);
const [filter, setFilter] = useState('');
```

**Global State (Context):**
```typescript
// Use Context sparingly (theme, auth session only)
const { theme, setTheme } = useTheme();
```

### Event Handler Naming

```typescript
// ✅ Good - handle prefix
const handleSubmit = () => {};
const handleClick = () => {};
const handleChange = (e: ChangeEvent) => {};

// ❌ Bad
const onSubmit = () => {};  // Reserve 'on' for props
const submit = () => {};
```

---

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ExpenseForm.tsx` |
| Hooks | camelCase with `use` | `useExpenses.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `types.ts` or `expense.types.ts` |
| Constants | SCREAMING_SNAKE_CASE file | `constants.ts` |

### Code Naming

```typescript
// Components: PascalCase
function ExpenseCard() {}
const BillReview = () => {};

// Hooks: camelCase with 'use'
function useSessionTimeout() {}
const useExpenses = () => {};

// Functions/Variables: camelCase
function calculateTotal() {}
const formatCurrency = () => {};
let expenseTotal = 0;

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_ENDPOINT = '/api/expenses';

// Types/Interfaces: PascalCase
interface Expense {}
type PaymentMethod = 'credit' | 'debit' | 'hsa';

// Private variables: prefix with underscore (if needed)
const _internalCache = new Map();
```

### Boolean Variables

```typescript
// ✅ Good - is/has/should prefix
const isLoading = true;
const hasErrors = false;
const shouldRefetch = true;

// ❌ Bad
const loading = true;
const errors = false;
```

---

## File Organization

### Project Structure

```
src/
├── components/
│   ├── bills/              # Feature-specific components
│   ├── dashboard/
│   ├── expense/
│   ├── hsa/
│   └── ui/                 # shadcn/ui base components
├── hooks/                  # Custom React hooks
├── integrations/
│   └── supabase/           # Supabase client setup
├── lib/                    # Third-party library configs
├── pages/                  # Route components
├── types/                  # Shared TypeScript types
└── utils/                  # Utility functions
```

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal modules (@ alias)
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/utils/formatCurrency';

// 4. Types
import type { Expense } from '@/types/expense';

// 5. Relative imports (avoid when possible, use @ alias)
import { ExpenseCard } from './ExpenseCard';
```

### Component File Structure

```typescript
// ExpenseForm.tsx

import { ... } from 'react';
import { ... } from 'external';
import { ... } from '@/internal';

// Types
interface ExpenseFormProps {
  onSubmit: (data: ExpenseData) => void;
}

interface ExpenseData {
  amount: number;
  category: string;
}

// Validation schema
const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1)
});

// Component
export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  // Implementation
}

// Helper functions (if not reusable, keep in same file)
function validateAmount(amount: number): boolean {
  return amount > 0 && amount < 1000000;
}
```

---

## Styling Guidelines

### Tailwind CSS

**Use Tailwind utility classes:**
```tsx
// ✅ Good
<div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
</div>

// ❌ Bad - inline styles
<div style={{ display: 'flex', padding: '8px 16px' }}>
  <h2 style={{ fontSize: '18px' }}>Title</h2>
</div>
```

### Design Tokens

**Use semantic CSS variables:**
```tsx
// ✅ Good - semantic colors from design system
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</button>

// ❌ Bad - hardcoded colors
<button className="bg-blue-600 text-white hover:bg-blue-700">
  Submit
</button>
```

### Responsive Design

**Mobile-first approach:**
```tsx
// ✅ Good - mobile first, then tablet/desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Bad - desktop first
<div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
```

### Class Organization

```tsx
// Order: layout → spacing → typography → colors → effects
<div className="
  flex items-center justify-between     // layout
  px-4 py-2 gap-2                      // spacing
  text-sm font-medium                   // typography
  bg-white text-gray-900               // colors
  rounded-lg shadow-md hover:shadow-lg  // effects
">
```

---

## Error Handling

### Use Error Utilities

```typescript
import { handleError, logError } from '@/utils/errorHandler';

async function fetchExpenses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;

  } catch (error) {
    // Development logging only
    logError('Failed to fetch expenses', error, { userId });

    // User-facing error (generic, no PHI)
    handleError(error, 'fetch-expenses', toast, 'Failed to load expenses');

    return null;
  }
}
```

### Try-Catch Blocks

```typescript
// ✅ Good - specific error handling
try {
  await saveExpense(data);
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationErrors(error.errors);
  } else {
    handleError(error, 'save-expense', toast);
  }
}

// ❌ Bad - silent failures
try {
  await saveExpense(data);
} catch (error) {
  // Nothing - error swallowed
}
```

---

## Security Requirements

### 1. Never Commit Secrets

```typescript
// ❌ Bad
const API_KEY = 'sk_live_abc123...';

// ✅ Good
const API_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
```

### 2. Validate All Inputs

```typescript
// ✅ Good
const schema = z.object({
  amount: z.number().positive().max(1000000),
  email: z.string().email().max(255)
});

const validated = schema.parse(userInput);
```

### 3. No PHI in Logs

```typescript
// ❌ Bad
console.log('User email:', user.email);
console.error('Failed for SSN:', ssn);

// ✅ Good
import { logError } from '@/utils/errorHandler';
logError('Operation failed', error, { userId: user.id }); // No email/SSN
```

### 4. Sanitize Errors

```typescript
// ✅ Good - use error handler
handleError(error, 'context', toast, 'Generic message');

// ❌ Bad - expose error details to user
toast.error(error.message); // Might contain PHI or system details
```

### 5. Verify User Ownership

```typescript
// ✅ Good - explicit user check (defense-in-depth)
const { data } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', user.id) // Explicit ownership check
  .eq('id', expenseId);

// ⚠️ Acceptable (RLS protects) but explicit is better
const { data } = await supabase
  .from('expenses')
  .select('*')
  .eq('id', expenseId);
```

---

## Testing Standards

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ExpenseCard } from './ExpenseCard';

describe('ExpenseCard', () => {
  it('displays expense amount', () => {
    render(<ExpenseCard expense={{ amount: 100, category: 'Medical' }} />);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});
```

---

## Code Review Checklist

### Functionality
- [ ] Code works as described
- [ ] Edge cases handled
- [ ] Error handling implemented

### Code Quality
- [ ] Follows TypeScript standards (strict mode passes)
- [ ] No `any` types (unless truly necessary)
- [ ] Explicit return types on exported functions
- [ ] Follows naming conventions
- [ ] No code duplication
- [ ] Functions are focused (<50 lines ideal)

### React Best Practices
- [ ] Function components only
- [ ] Hooks in correct order
- [ ] Proper dependency arrays
- [ ] Event handlers named with `handle` prefix

### Security
- [ ] No secrets in code
- [ ] Input validation with Zod
- [ ] Error messages sanitized
- [ ] No PHI in logs
- [ ] User ownership verified

### Performance
- [ ] No N+1 queries
- [ ] Proper React Query usage
- [ ] No unnecessary re-renders
- [ ] Memoization where appropriate

### Styling
- [ ] Tailwind classes only (no inline styles)
- [ ] Semantic design tokens used
- [ ] Mobile-responsive
- [ ] Consistent spacing

### Testing
- [ ] Unit tests for utilities
- [ ] Component tests for UI
- [ ] All tests pass

### Documentation
- [ ] JSDoc comments on complex functions
- [ ] README updated if needed
- [ ] Type definitions clear

---

## Examples

### Good Component Example

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { handleError } from '@/utils/errorHandler';
import type { Expense } from '@/types/expense';

interface ExpenseFormProps {
  userId: string;
  onSuccess?: () => void;
}

const expenseSchema = z.object({
  amount: z.number().positive().max(1000000),
  category: z.string().min(1).max(50),
  date: z.string().datetime(),
  isHsaEligible: z.boolean().optional()
});

type ExpenseData = z.infer<typeof expenseSchema>;

export function ExpenseForm({ userId, onSuccess }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: ExpenseData) => {
      const { error } = await supabase
        .from('expenses')
        .insert({ ...data, user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      onSuccess?.();
    },
    onError: (error) => {
      handleError(error, 'create-expense', toast, 'Failed to create expense');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      amount: parseFloat(amount),
      category: 'Medical',
      date: new Date().toISOString(),
      isHsaEligible: true
    };

    const validated = expenseSchema.parse(data);
    mutation.mutate(validated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
        placeholder="Amount"
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create Expense'}
      </Button>
    </form>
  );
}
```

---

## Related Documentation

- [Contributing Guide](../../CONTRIBUTING.md) - Contribution workflow
- [Testing Guide](testing.md) - Testing strategy
- [Security Policy](../security/SECURITY.md) - Security guidelines
- [Architecture Overview](../architecture/README.md) - System design

---

**Last Updated:** December 6, 2025
**Version:** 1.0.0
