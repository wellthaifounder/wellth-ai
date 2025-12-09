# Quick Integration Guide - 5 Steps to Go Live

## Step 1: Database Schema (5 minutes)

Copy and paste the SQL from [`CORRECTED_MIGRATION.sql`](CORRECTED_MIGRATION.sql) into your Supabase SQL Editor, or run:

```sql
-- 1. Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- 2. Add insurance_plan to profiles table (not user_profiles!)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS insurance_plan JSONB DEFAULT NULL;

-- 3. Add is_admin column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 4. Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics events"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );
```

**Note**: Your table is called `profiles`, not `user_profiles`. The code has been corrected.

## Step 2: Add Insurance Widget to Dashboard (2 minutes)

In `src/pages/Dashboard.tsx`, find where `HSAHealthCheck` is rendered and add:

```typescript
import { InsurancePlanPrompt } from "@/components/dashboard/InsurancePlanPrompt";

// In the component JSX, after <HSAHealthCheck ... />:
<InsurancePlanPrompt />
```

## Step 3: Add Key Analytics Tracking (10 minutes)

### A. Bill Upload Tracking

In `src/pages/BillDetail.tsx` (or wherever bills are uploaded), add after successful upload:

```typescript
import { analytics } from "@/lib/analytics";

// After bill upload success
analytics.billUpload(parseFloat(totalAmount), category);
```

### B. Bill Analysis Tracking

After AI analysis completes:

```typescript
// When analysis results come back
analytics.track({
  type: 'bill_analyzed',
  value: potentialSavings,
  metadata: { bill_id: billId }
});

// Track time to first value
const sessionStart = localStorage.getItem('session_start') || Date.now();
analytics.trackTimeToFirstValue('bill_analyzed', Date.now() - Number(sessionStart));
```

### C. Onboarding Tracking

In `src/components/dashboard/EmptyStateOnboarding.tsx`:

```typescript
import { analytics } from "@/lib/analytics";

// When component mounts for first-time users
useEffect(() => {
  const hasSeenOnboarding = localStorage.getItem('onboarding_started');
  if (!hasSeenOnboarding) {
    analytics.trackOnboardingStarted();
    localStorage.setItem('onboarding_started', Date.now().toString());
  }
}, []);

// When user uploads first bill
analytics.trackOnboardingStepCompleted('first_bill_uploaded', 1);

// When user completes setup
const onboardingStart = localStorage.getItem('onboarding_started');
analytics.trackOnboardingCompleted(Date.now() - Number(onboardingStart));
```

### D. Dispute Conversion Tracking

When user starts a dispute:

```typescript
analytics.trackDisputeConversion(billAmount, disputeAmount);
```

### E. Calculator Tracking

In `src/pages/PrePurchaseDecision.tsx`:

```typescript
// When user views calculator results
const calculatorStart = Date.now(); // Set when form opens

// When results displayed
analytics.trackTimeToFirstValue('calculator_result', Date.now() - calculatorStart);
```

## Step 4: Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# Open browser console
# Navigate through app and verify:
# 1. Analytics events appear in console (dev mode)
# 2. Insurance dialog opens
# 3. Onboarding progress bar shows
# 4. HSA prompts appear for non-HSA users
```

Check Supabase Table Editor → `analytics_events` to see events being logged.

## Step 5: Deploy (3 minutes)

```bash
# Build
npm run build

# Deploy (adjust for your platform)
vercel --prod
# or
npm run deploy
```

---

## Optional: External Analytics Setup

### PostHog Integration

```bash
npm install posthog-js
```

```typescript
// In src/main.tsx or App.tsx
import posthog from 'posthog-js';

if (import.meta.env.PROD) {
  posthog.init('YOUR_API_KEY', {
    api_host: 'https://app.posthog.com'
  });
}
```

In `src/lib/analytics.ts`, update `track()` method:

```typescript
async track(event: AnalyticsEvent) {
  // ... existing code ...

  // Send to PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event.type, {
      ...event.metadata,
      page: event.page,
      value: event.value
    });
  }
}
```

---

## Verification Checklist

After deploying:

- [ ] New user sees "Find Your First $380 in Savings" onboarding
- [ ] Navigation shows 5 categories (not 15+)
- [ ] Upload Bill button in header
- [ ] Progress bar appears during onboarding
- [ ] Insurance plan dialog works
- [ ] HSA prompts show for non-HSA users on bill detail
- [ ] Analytics events in Supabase `analytics_events` table
- [ ] Dashboard shows Total Value Created card
- [ ] HSA Health Check widget adaptive

---

## Troubleshooting

### "analytics_events table doesn't exist"
→ Run Step 1 SQL migration

### Insurance dialog doesn't save
→ Check `user_profiles.insurance_plan` column exists
→ Verify RLS policies allow inserts

### Analytics not tracking
→ Check browser console for errors
→ Verify Supabase connection
→ Check RLS policy allows inserts with `user_id IS NULL`

### Progress bar not showing
→ Check if user has existing bills (may auto-complete onboarding)
→ Verify queries in `OnboardingProgressBar.tsx` are working

---

## Quick Wins to Test First

1. **Landing Page**: Refresh home page → See new "Medical Bills Overcharged You" headline
2. **Navigation**: Log in → See 5 categories instead of 15+
3. **Upload Button**: Check header → "Upload Bill" button visible
4. **Onboarding**: Create new test account → See "Find Your First $380"
5. **Insurance**: Click "Add Insurance Plan" → Fill form → Save → See summary

---

**Estimated Total Integration Time: 25 minutes**

Most of the hard work is done! These are just the final connection points.
