-- Migration: Auto-matching infrastructure for Phase 1 of expense lifecycle redesign
-- Adds vendor_aliases, matching_run_log, and auto_linked tracking on payment_transactions

-- 1. Vendor aliases — learned mappings from user corrections
CREATE TABLE vendor_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canonical_vendor TEXT NOT NULL,
  alias TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'learned' CHECK (source IN ('manual', 'learned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, canonical_vendor, alias)
);

ALTER TABLE vendor_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendor aliases"
  ON vendor_aliases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vendor aliases"
  ON vendor_aliases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vendor aliases"
  ON vendor_aliases FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_vendor_aliases_user_id ON vendor_aliases(user_id);

-- 2. Add auto_linked tracking columns to payment_transactions
ALTER TABLE payment_transactions
  ADD COLUMN auto_linked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN auto_linked_at TIMESTAMPTZ,
  ADD COLUMN match_confidence NUMERIC(3,2);

COMMENT ON COLUMN payment_transactions.auto_linked IS 'True if this link was created automatically by the matching engine';
COMMENT ON COLUMN payment_transactions.auto_linked_at IS 'When the auto-link was created';
COMMENT ON COLUMN payment_transactions.match_confidence IS 'Confidence score (0-1) of the auto-match';

-- 3. Matching run log — observability for auto-matching pipeline
CREATE TABLE matching_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('plaid_sync', 'document_upload', 'manual')),
  transactions_processed INT NOT NULL DEFAULT 0,
  auto_linked_count INT NOT NULL DEFAULT 0,
  suggested_count INT NOT NULL DEFAULT 0,
  exception_count INT NOT NULL DEFAULT 0,
  duration_ms INT
);

ALTER TABLE matching_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matching logs"
  ON matching_run_log FOR SELECT USING (auth.uid() = user_id);

-- Service role inserts these from edge functions, no user INSERT policy needed

CREATE INDEX idx_matching_run_log_user_id ON matching_run_log(user_id);
CREATE INDEX idx_matching_run_log_run_at ON matching_run_log(run_at DESC);
