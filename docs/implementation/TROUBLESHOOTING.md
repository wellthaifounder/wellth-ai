# Troubleshooting Guide

## Fixed: "relation user_profiles does not exist"

**Issue**: The SQL migration referenced `user_profiles` table which doesn't exist.

**Solution**: Your table is actually called `profiles`.

✅ **Updated files**:
- [`CORRECTED_MIGRATION.sql`](CORRECTED_MIGRATION.sql) - Fixed SQL migration
- [`InsurancePlanDialog.tsx`](src/components/onboarding/InsurancePlanDialog.tsx) - Now uses `profiles` table
- [`useInsurancePlan.ts`](src/hooks/useInsurancePlan.ts) - Now queries `profiles` table
- [`QUICK_INTEGRATION_GUIDE.md`](QUICK_INTEGRATION_GUIDE.md) - Updated with correct SQL

**Next steps**:
1. Run the SQL from [`CORRECTED_MIGRATION.sql`](CORRECTED_MIGRATION.sql) in Supabase SQL Editor
2. Continue with Step 2 in [QUICK_INTEGRATION_GUIDE.md](QUICK_INTEGRATION_GUIDE.md)

---

## Common Issues & Solutions

### 1. Analytics events not being logged

**Symptoms**:
- Console shows analytics events but they're not in database
- Error: "relation analytics_events does not exist"

**Solution**:
```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'analytics_events';

-- If not, run CORRECTED_MIGRATION.sql
```

### 2. Insurance plan dialog won't save

**Symptoms**:
- Form submits but data doesn't persist
- Error in console about RLS policies

**Check**:
```sql
-- 1. Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'insurance_plan';

-- 2. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. Test insert manually
UPDATE profiles
SET insurance_plan = '{"carrier": "Test", "plan_type": "hdhp"}'::jsonb
WHERE id = auth.uid();
```

**Solution**: Ensure migration ran completely. Re-run if needed.

### 3. Onboarding progress bar not showing

**Symptoms**:
- Progress bar never appears
- User already has bills/bank connected

**Explanation**: Progress bar auto-hides when onboarding is complete (all 3 milestones met).

**Check milestones**:
```sql
-- Check if user has bills
SELECT COUNT(*) FROM invoices WHERE user_id = auth.uid();

-- Check if user has bill reviews (analyzed)
SELECT COUNT(*) FROM bill_reviews br
JOIN invoices i ON i.id = br.invoice_id
WHERE i.user_id = auth.uid();

-- Check if user has bank accounts
SELECT COUNT(*) FROM bank_accounts WHERE user_id = auth.uid();

-- Check if user has HSA date set
SELECT hsa_opened_date FROM profiles WHERE id = auth.uid();
```

If user has:
- Bills uploaded (>0)
- Bills analyzed (>0)
- Bank connected OR HSA date set

Then onboarding is complete and progress bar won't show.

### 4. HSA upgrade prompts not appearing

**Symptoms**:
- Non-HSA users don't see prompts on bill detail or calculator

**Check**:
```typescript
// In browser console:
localStorage.getItem('wellth_hsa_opened_date')
// Should be null for non-HSA users

// Or check database:
SELECT hsa_opened_date FROM profiles WHERE id = auth.uid();
// Should be NULL
```

**Common cause**: User previously set HSA date.

**To test**: Create a fresh test account with no HSA date.

### 5. Dashboard widgets not appearing

**Symptoms**:
- InsurancePlanPrompt doesn't show
- HSAHealthCheck missing

**Solution**:
```typescript
// In src/pages/Dashboard.tsx, verify imports:
import { InsurancePlanPrompt } from "@/components/dashboard/InsurancePlanPrompt";
import { HSAHealthCheck } from "@/components/dashboard/HSAHealthCheck";

// And verify they're rendered:
<HSAHealthCheck
  hasHSA={hasHSA}
  // ... props
/>

<InsurancePlanPrompt />
```

### 6. TypeScript errors after updates

**Symptoms**:
- Build fails with type errors
- IDE shows red squiggles

**Solution**:
```bash
# Restart TypeScript server (in VS Code)
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

---

## Database Schema Verification

Run these queries to verify migration succeeded:

```sql
-- 1. Check analytics_events table
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'analytics_events'
ORDER BY ordinal_position;

-- Expected output:
-- id               | uuid
-- user_id          | uuid
-- event_name       | text
-- event_properties | jsonb
-- created_at       | timestamp with time zone

-- 2. Check profiles.insurance_plan column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('insurance_plan', 'is_admin');

-- Expected output:
-- insurance_plan | jsonb   | YES
-- is_admin       | boolean | YES

-- 3. Check RLS policies on analytics_events
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'analytics_events';

-- Expected: 3 policies
-- - Users can view own analytics events (SELECT)
-- - Users can insert own analytics events (INSERT)
-- - Admins can view all analytics events (SELECT)

-- 4. Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'analytics_events';

-- Expected: 3 indexes on user_id, event_name, created_at
```

---

## Testing Checklist

After running migration, test each component:

### ✅ Analytics Tracking
```typescript
// In browser console:
import { analytics } from '@/lib/analytics';

// Test event
analytics.track({
  type: 'page_view',
  page: '/test',
  metadata: { test: true }
});

// Check database
// Supabase → Table Editor → analytics_events
// Should see new row
```

### ✅ Insurance Plan
1. Navigate to Dashboard
2. Click "Add Insurance Plan"
3. Fill form with test data
4. Click "Save Insurance Plan"
5. Verify:
   - Toast: "Insurance plan saved successfully!"
   - Dashboard shows summary card
   - Database: `SELECT insurance_plan FROM profiles WHERE id = auth.uid();`

### ✅ Onboarding Progress
1. Create fresh test account
2. Login and go to Dashboard
3. Verify progress bar shows "0/3 complete"
4. Upload a bill → progress updates to "1/3"
5. (Wait for analysis or mock it) → progress updates to "2/3"
6. Connect bank OR set HSA date → progress updates to "3/3" and hides

---

## Need More Help?

1. **Check browser console** for errors
2. **Check Supabase logs** (Database → Logs)
3. **Verify RLS policies** aren't blocking operations
4. **Test with fresh incognito window** (clears localStorage/cache)
5. **Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** for complete context

---

## Quick Reset (for testing)

```sql
-- Reset onboarding state for test user
UPDATE profiles
SET insurance_plan = NULL,
    hsa_opened_date = NULL
WHERE id = auth.uid();

-- Clear analytics events
DELETE FROM analytics_events WHERE user_id = auth.uid();

-- Then clear browser localStorage and refresh
```

In browser console:
```javascript
localStorage.clear();
location.reload();
```
