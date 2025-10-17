-- Add document management fields to receipts table
ALTER TABLE receipts 
ADD COLUMN document_type TEXT DEFAULT 'receipt' CHECK (document_type IN ('invoice', 'payment_receipt', 'eob', 'prescription_label', 'other', 'receipt')),
ADD COLUMN description TEXT,
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add payment plan tracking to expenses table
ALTER TABLE expenses
ADD COLUMN payment_plan_total_amount NUMERIC,
ADD COLUMN payment_plan_installments INTEGER,
ADD COLUMN payment_plan_notes TEXT;

-- Create index for better query performance
CREATE INDEX idx_receipts_expense_type ON receipts(expense_id, document_type);

-- Add comment for documentation
COMMENT ON COLUMN receipts.document_type IS 'Type of document: invoice (primary billing), payment_receipt (proof of payment), eob (Explanation of Benefits), prescription_label, other, or receipt (default)';
COMMENT ON COLUMN receipts.description IS 'Optional description or notes about this document';
COMMENT ON COLUMN receipts.display_order IS 'Order for displaying multiple documents for the same expense';
COMMENT ON COLUMN expenses.payment_plan_total_amount IS 'Total amount if on payment plan (different from individual payment amounts)';
COMMENT ON COLUMN expenses.payment_plan_installments IS 'Number of installments if on payment plan';
COMMENT ON COLUMN expenses.payment_plan_notes IS 'Notes about payment plan arrangements';