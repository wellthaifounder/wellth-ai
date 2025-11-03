-- Add is_hsa_account flag to payment_methods table
ALTER TABLE payment_methods 
ADD COLUMN is_hsa_account BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN payment_methods.is_hsa_account IS 'Indicates if this payment method is a Health Savings Account (HSA)';