-- Phase 1: Rename expense_reports to invoices
ALTER TABLE expense_reports RENAME TO invoices;

-- Update foreign key column names for clarity
ALTER TABLE payment_transactions RENAME COLUMN expense_report_id TO invoice_id;
ALTER TABLE receipts RENAME COLUMN expense_id TO invoice_id;
ALTER TABLE reimbursement_items RENAME COLUMN expense_id TO invoice_id;

-- Update RLS policy names to reflect new terminology
DROP POLICY IF EXISTS "Users can view their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can update their own expenses" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON invoices;

CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);