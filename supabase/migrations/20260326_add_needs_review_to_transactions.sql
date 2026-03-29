-- Add needs_review flag to transactions
-- Used to mark keyword-matched medical transactions that require user confirmation
-- to prevent false positives causing incorrect HSA eligibility claims.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

-- Index for efficiently querying unreviewed transactions per user
CREATE INDEX IF NOT EXISTS idx_transactions_needs_review
  ON transactions (user_id, needs_review)
  WHERE needs_review = true;

-- Update RLS: existing policies already cover this column since they use user_id scoping.
-- No additional policy needed.

COMMENT ON COLUMN transactions.needs_review IS
  'True when a transaction was auto-categorized as medical by keyword matching and has not been confirmed or rejected by the user. Prevents false positives from auto-HSA-eligibility.';
