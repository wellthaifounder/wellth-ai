# Bill Review Feature Archive Summary

**Date:** 2026-01-25
**Reason:** Reduce ongoing API costs and focus on core HSA/FSA tracking value proposition

## What Was Archived

### Database Tables (via migration)

- `bill_reviews` - AI analysis results
- `bill_errors` - Detected billing errors
- `bill_disputes` - Dispute case management
- `dispute_documents` - Supporting evidence
- `dispute_communications` - Communication log
- `cpt_code_reference` - CPT code pricing reference

### Edge Functions

- `analyze-medical-bill` → moved to `supabase/functions/_archived/`
  - Used Gemini 2.5 Pro via Lovable AI Gateway
  - Required `LOVABLE_API_KEY` (can be removed from secrets if not used elsewhere)

### Frontend Pages

- `BillReviews.tsx` → moved to `src/_archived/pages/`
- `BillReview.tsx` → moved to `src/_archived/pages/`
- `BillDispute.tsx` → moved to `src/_archived/pages/`
- `DisputeManagement.tsx` → moved to `src/_archived/pages/`
- `DisputeDetail.tsx` → moved to `src/_archived/pages/`

### Frontend Components

- `BillReviewCard.tsx` → moved to `src/_archived/components/bills/`
- `DisputeWizard.tsx` → moved to `src/_archived/components/bills/`

### Routes Removed/Redirected

- `/bill-reviews/:invoiceId` → redirects to `/bills`
- `/disputes/:id` → redirects to `/bills`
- `/bills/:invoiceId/dispute` → redirects to `/bills`

## What Was Kept

### Core Features (Focus Areas)

✅ HSA/FSA receipt tracking and storage
✅ Document organization (Medical Events)
✅ Plaid integration for HSA account tracking
✅ Basic receipt OCR (metadata extraction via `process-receipt-ocr`)
✅ Transaction tracking
✅ Reimbursement requests

### Database Tables (Still Active)

- `invoices` - Medical bills/invoices
- `receipts` - Uploaded documents
- `payment_transactions` - Payment tracking
- `medical_events` - Episode-of-care grouping
- `receipt_ocr_data` - Basic OCR metadata
- All other core tables

## How to Resurrect

If you want to bring back the bill review feature later:

1. **Database**: Run the inverse migration (recreate tables/enums from `20251109150232_1e092845-30ea-4f3f-827d-2e44d34095f4.sql`)
2. **Edge Function**: Move `supabase/functions/_archived/analyze-medical-bill` back to `supabase/functions/`
3. **Frontend**: Move archived pages/components back from `src/_archived/`
4. **Routing**: Restore routes in `App.tsx`
5. **API Key**: Add `LOVABLE_API_KEY` to Supabase edge function secrets
6. **Billing**: Set up API credit billing via Lovable workspace

## Migrations Applied

1. `20260125_fix_security_warnings.sql` - Fixed function search_path warnings, dropped unused email tables
2. `20260125_archive_bill_review_feature.sql` - **PENDING** - Run this in Supabase SQL Editor

## Next Steps

1. ✅ All frontend code updated
2. ✅ All routing updated
3. ⏳ **Run migration in Supabase Dashboard SQL Editor**
   - Copy contents of `supabase/migrations/20260125_archive_bill_review_feature.sql`
   - Paste into SQL Editor
   - Execute
4. 🔄 (Optional) Remove `LOVABLE_API_KEY` from edge function secrets if not used elsewhere
5. 🔄 Test the app to ensure bills page works without errors

## Cost Savings

- ❌ No more Gemini API costs (Lovable AI Gateway)
- ❌ No more prompt engineering maintenance (595 lines)
- ✅ Simpler codebase focused on core value prop
- ✅ Can resurrect later if users explicitly request it or after achieving PMF
