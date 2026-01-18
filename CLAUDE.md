# CLAUDE.md - Wellth.ai Development Guidelines

> This file is institutional memory for Claude Code. Update it whenever Claude makes a mistake so it learns for next time.

## Project Overview

**Wellth.ai** is a HIPAA-compliant healthcare expense management platform that helps users:
- Track HSA/FSA accounts and transactions
- Detect medical billing errors using AI (Gemini 2.5 Flash)
- Manage disputes with healthcare providers
- Optimize healthcare spending with an AI assistant (Wellbie)

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase + Stripe + Plaid

## Architecture Rules

### Database & Security
- All database queries MUST use Row Level Security (RLS) - never bypass with service role on frontend
- NEVER log PHI (Protected Health Information) - use `utils/errorHandler.ts` for sanitization
- All edge functions require JWT validation via `supabase.auth.getUser()`
- Use `sessionStorage` NOT `localStorage` for auth tokens (security requirement)
- Plaid tokens are encrypted with AES-256-GCM - see `supabase/functions/plaid-exchange-token/`

### Data Fetching
- Use React Query for ALL data fetching (5-minute stale time default)
- Never use `SELECT *` - always specify columns explicitly
- Avoid N+1 queries - use `.in()` filter for batch fetching
- Pagination limit: 500-1000 items max per query

### Component Structure
- Components live in `src/components/{domain}/` (bills, dashboard, hsa, etc.)
- Pages live in `src/pages/`
- Use existing shadcn/ui components from `src/components/ui/`
- New pages MUST be wrapped in error boundaries

## Code Patterns

### Forms
```typescript
// Always use React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({...});
const form = useForm({ resolver: zodResolver(schema) });
```

### Data Fetching
```typescript
// Always use React Query hooks
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => supabase.from('table').select('col1, col2').eq('id', id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Error Handling
```typescript
// Use the centralized error handler for PHI-safe errors
import { handleError } from "@/utils/errorHandler";

try {
  // operation
} catch (error) {
  handleError(error); // Strips PHI before logging
}
```

## Common Mistakes to Avoid

### Security
- DON'T expose Supabase service role key to frontend code
- DON'T log user data, medical information, or billing details
- DON'T store sensitive data in localStorage (use sessionStorage)
- DON'T skip JWT validation in edge functions

### Performance
- DON'T use `SELECT *` - specify columns
- DON'T create N+1 queries in loops - batch with `.in()`
- DON'T fetch all records - use pagination
- DON'T skip React Query caching

### Code Quality
- DON'T add console.log in production code (use proper error handling)
- DON'T create new abstractions for one-time operations
- DON'T over-engineer - keep solutions simple and focused
- DON'T add features beyond what was explicitly requested

## File Locations

| Purpose | Location |
|---------|----------|
| Edge Functions | `supabase/functions/{function-name}/index.ts` |
| Migrations | `supabase/migrations/YYYYMMDD_description.sql` |
| Auto-generated Types | `src/integrations/supabase/types.ts` |
| React Components | `src/components/{domain}/` |
| Pages | `src/pages/` |
| Custom Hooks | `src/hooks/` |
| Contexts | `src/contexts/` |
| UI Components | `src/components/ui/` (shadcn) |

## Testing & Verification

Before committing any changes:
1. Run `npm run build` - must pass with zero errors
2. Check for TypeScript errors in modified files
3. Verify no PHI in error messages or console output
4. Test in browser - especially for UI changes
5. For Stripe changes: test with `stripe listen --forward-to localhost:54321/functions/v1/`
6. For Plaid changes: use sandbox environment

## Edge Function Patterns

```typescript
// Standard edge function structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Your logic here - always verify user ownership of resources

  } catch (error) {
    // Never expose internal errors - sanitize for PHI
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## Subscription Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | $0 | Basic tracking, receipt scanning |
| Plus | $9.99/mo | AI bill review, unlimited HSA accounts |
| Premium | $19.99/mo | Priority support, custom reports, API |

Check subscription with `useSubscription()` hook from `src/contexts/SubscriptionContext.tsx`.

## AI Integration (Gemini)

- Model: `gemini-2.5-flash-preview-04-17`
- Used for: Bill analysis, PHI redaction, Wellbie chat
- Always redact PHI before sending to AI
- Use streaming for chat responses (`wellbieChatStream.ts`)

---

## Lessons Learned (Update This Section!)

<!-- Add entries here when Claude makes mistakes -->

### Example Entry Format:
**Date:** YYYY-MM-DD
**Issue:** What went wrong
**Fix:** What to do instead

---

*Last updated: 2026-01-08*
