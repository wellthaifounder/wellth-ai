-- Migration: Add encrypted storage for Plaid access tokens
-- Issue #5: CRITICAL - Plaid tokens stored in plaintext (HIPAA violation)
-- Date: 2025-12-02

-- Step 1: Add encrypted column (nullable during transition)
ALTER TABLE public.plaid_connections
ADD COLUMN encrypted_access_token TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.plaid_connections.encrypted_access_token IS
  'AES-256-GCM encrypted Plaid access token. Format: base64(iv):base64(ciphertext)';

-- Step 3: Create index for faster lookups (optional optimization)
CREATE INDEX IF NOT EXISTS idx_plaid_connections_encrypted_token
  ON public.plaid_connections(encrypted_access_token)
  WHERE encrypted_access_token IS NOT NULL;

-- MANUAL STEPS REQUIRED AFTER DEPLOYMENT:
-- 1. Run the migrate-encrypt-tokens edge function to encrypt existing tokens
-- 2. Verify all tokens are encrypted (check encrypted_access_token IS NOT NULL)
-- 3. After 30-day verification period, run cleanup migration:
--    - ALTER TABLE plaid_connections ALTER COLUMN encrypted_access_token SET NOT NULL;
--    - ALTER TABLE plaid_connections DROP COLUMN access_token;
