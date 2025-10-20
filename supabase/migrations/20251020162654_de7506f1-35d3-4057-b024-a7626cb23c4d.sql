-- Make expense_id nullable since receipts can be attached to either expense_reports or payment_transactions
ALTER TABLE receipts ALTER COLUMN expense_id DROP NOT NULL;