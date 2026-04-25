-- Migration: Complete the Plaid token encryption cutover
-- Follow-up to 20251202201215_encrypt_plaid_tokens.sql (see its MANUAL STEPS notes).
-- Drops the legacy plaintext access_token column and enforces NOT NULL on
-- encrypted_access_token so every Plaid connection has an encrypted token.

ALTER TABLE public.plaid_connections
  ALTER COLUMN encrypted_access_token SET NOT NULL;

ALTER TABLE public.plaid_connections
  DROP COLUMN access_token;
