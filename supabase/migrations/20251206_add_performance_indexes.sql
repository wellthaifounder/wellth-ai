-- Performance Indexes Migration (Tier 3 Optimization)
-- Adds indexes on frequently queried columns to improve query performance

-- Invoices table indexes
-- Most queries filter by user_id and order by date
CREATE INDEX IF NOT EXISTS idx_invoices_user_date
  ON public.invoices(user_id, date DESC);

-- HSA account filtering is common in analytics
CREATE INDEX IF NOT EXISTS idx_invoices_hsa_account
  ON public.invoices(hsa_account_id)
  WHERE hsa_account_id IS NOT NULL;

-- Bill reviews table indexes
-- Dashboard and BillReviews pages filter by user_id and review_status
CREATE INDEX IF NOT EXISTS idx_bill_reviews_user_status
  ON public.bill_reviews(user_id, review_status);

-- Ordering by analyzed_at is frequent
CREATE INDEX IF NOT EXISTS idx_bill_reviews_analyzed_at
  ON public.bill_reviews(analyzed_at DESC);

-- Bill errors table indexes
-- Now that we fixed N+1, this index will speed up the JOIN
CREATE INDEX IF NOT EXISTS idx_bill_errors_review_status
  ON public.bill_errors(bill_review_id, status);

-- Transaction splits table indexes
-- Used in HSA account performance calculations
CREATE INDEX IF NOT EXISTS idx_transaction_splits_hsa
  ON public.transaction_splits(hsa_account_id)
  WHERE hsa_account_id IS NOT NULL;

-- Payment transactions table indexes
-- Used in HSA performance and bill payment tracking
CREATE INDEX IF NOT EXISTS idx_payment_transactions_hsa
  ON public.payment_transactions(hsa_account_id)
  WHERE hsa_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice
  ON public.payment_transactions(invoice_id);

-- Providers table indexes
-- Provider directory sorts by billing_accuracy_score
CREATE INDEX IF NOT EXISTS idx_providers_billing_score
  ON public.providers(billing_accuracy_score DESC NULLS LAST);

-- Provider reviews for aggregation queries
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_flagged
  ON public.provider_reviews(provider_id, is_flagged);

-- Comment documenting the performance improvements
COMMENT ON INDEX idx_invoices_user_date IS
  'Composite index for user invoice queries ordered by date. Improves Bills, Reports, Dashboard performance.';

COMMENT ON INDEX idx_bill_reviews_user_status IS
  'Composite index for filtering bill reviews by user and status. Critical for Dashboard pending reviews.';

COMMENT ON INDEX idx_bill_errors_review_status IS
  'Composite index for joining bill_errors to bill_reviews. Eliminates N+1 query bottleneck.';
