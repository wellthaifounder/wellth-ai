-- Add user_id to receipts table to track ownership
ALTER TABLE receipts ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Backfill user_id for existing receipts from their invoices
UPDATE receipts
SET user_id = invoices.user_id
FROM invoices
WHERE receipts.invoice_id = invoices.id AND receipts.user_id IS NULL;

-- Backfill user_id for receipts linked to payment_transactions
UPDATE receipts
SET user_id = payment_transactions.user_id
FROM payment_transactions
WHERE receipts.payment_transaction_id = payment_transactions.id AND receipts.user_id IS NULL;

-- Make user_id not nullable after backfill
ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert their receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete their receipts" ON receipts;

-- Create new RLS policies based on user_id
CREATE POLICY "Users can view their own receipts"
ON receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
ON receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
ON receipts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
ON receipts FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_receipts_user_id ON receipts(user_id);