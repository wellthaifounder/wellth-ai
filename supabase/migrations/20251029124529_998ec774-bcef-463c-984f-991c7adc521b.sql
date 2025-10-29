-- Phase 1: Add HSA opened date to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hsa_opened_date date;

-- Phase 1-2: Add reimbursement strategy fields to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS reimbursement_strategy text CHECK (reimbursement_strategy IN ('immediate', 'medium', 'vault')) DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS planned_reimbursement_date date,
ADD COLUMN IF NOT EXISTS reimbursement_reminder_date date,
ADD COLUMN IF NOT EXISTS card_payoff_months integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_notes text;

-- Phase 3: Create expense decisions table for pre-purchase tracking
CREATE TABLE IF NOT EXISTS expense_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  expense_amount numeric NOT NULL,
  payment_strategy jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_for_expense_id uuid REFERENCES invoices(id)
);

-- Enable RLS on expense_decisions
ALTER TABLE expense_decisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_decisions
CREATE POLICY "Users can view their own expense decisions"
ON expense_decisions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense decisions"
ON expense_decisions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense decisions"
ON expense_decisions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense decisions"
ON expense_decisions FOR DELETE
USING (auth.uid() = user_id);