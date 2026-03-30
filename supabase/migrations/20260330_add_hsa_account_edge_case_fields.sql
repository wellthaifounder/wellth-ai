-- Add edge case fields to hsa_accounts for QLE tracking and retroactive eligibility
ALTER TABLE hsa_accounts
  ADD COLUMN IF NOT EXISTS eligibility_start_date DATE,
  ADD COLUMN IF NOT EXISTS qle_type TEXT
    CHECK (qle_type IN (
      'new_employment',
      'loss_of_coverage',
      'marriage',
      'divorce',
      'birth_adoption',
      'plan_change',
      'other'
    )),
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN hsa_accounts.eligibility_start_date IS
  'When HSA eligibility actually begins — may precede opened_date for retroactive IRS elections (up to 60 days back from QLE date)';

COMMENT ON COLUMN hsa_accounts.qle_type IS
  'Qualifying Life Event that triggered mid-year HDHP eligibility, if applicable';

COMMENT ON COLUMN hsa_accounts.notes IS
  'Free-form context about this account (carrier, plan details, retroactive notes, etc.)';
