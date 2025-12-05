# PATCH #5: Plaid Token Encryption - Setup Instructions

## Overview
This patch encrypts Plaid access tokens at rest using AES-256-GCM encryption, addressing a CRITICAL security vulnerability (Issue #5).

**Status:** ✅ Code implemented, ⚠️ Requires manual setup steps

---

## 🔑 STEP 1: Generate Encryption Key

Run the key generation script:

```bash
deno run supabase/functions/_shared/generate-encryption-key.ts
```

This will output a base64-encoded 256-bit encryption key. **Save this key securely** - you'll need it for all environments.

⚠️ **CRITICAL:** If you lose this key, all encrypted tokens become permanently unusable.

---

## 🔐 STEP 2: Set Environment Variables

Add the encryption key to your environment variables:

### Local Development (.env.local)
```bash
PLAID_ENCRYPTION_KEY=<your-generated-key>
```

### Supabase Edge Functions
```bash
supabase secrets set PLAID_ENCRYPTION_KEY=<your-generated-key>
```

### Migration Function (One-time)
```bash
# Generate a secure admin key for the migration function
# This prevents unauthorized access to the migration endpoint
supabase secrets set MIGRATION_ADMIN_KEY=$(openssl rand -base64 32)
```

---

## 📊 STEP 3: Run Database Migration

Apply the database migration to add the `encrypted_access_token` column:

```bash
supabase db push
```

This will:
- Add `encrypted_access_token TEXT` column to `plaid_connections` table
- Create an index for performance
- Keep the old `access_token` column for rollback safety

---

## 🔄 STEP 4: Migrate Existing Tokens

**⚠️ Only run this if you have existing Plaid connections in your database**

Deploy the migration function:
```bash
supabase functions deploy migrate-encrypt-tokens
```

Run the migration (replace `<ADMIN_KEY>` with your `MIGRATION_ADMIN_KEY`):
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/migrate-encrypt-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-anon-key>" \
  -d '{"admin_key": "<ADMIN_KEY>"}'
```

Expected response:
```json
{
  "success": true,
  "total": 5,
  "encrypted": 5,
  "errors": 0
}
```

---

## ✅ STEP 5: Verify Migration

Check that all tokens are encrypted:

```sql
-- All connections should have encrypted_access_token populated
SELECT
  id,
  encrypted_access_token IS NOT NULL as is_encrypted,
  access_token IS NOT NULL as has_old_token
FROM plaid_connections;
```

Expected result: All rows should have `is_encrypted = true`.

---

## 🧪 STEP 6: Test New Connections

1. Link a new bank account via Plaid in your app
2. Check the database - the new connection should have:
   - `encrypted_access_token` populated (format: `<base64-iv>:<base64-ciphertext>`)
   - `access_token` should be NULL (new code doesn't write to this column)

3. Test transaction sync:
   - Trigger a transaction sync for the new connection
   - Verify transactions are fetched successfully
   - Check logs for `[uuid] Decrypting Plaid access token` messages

---

## 🗑️ STEP 7: Cleanup (After 30-Day Verification)

**⚠️ Only perform cleanup after 30 days of successful production use**

### 7.1 Delete Migration Function
```bash
supabase functions delete migrate-encrypt-tokens
rm -rf supabase/functions/migrate-encrypt-tokens
```

### 7.2 Remove Old Column (Irreversible)
```sql
-- Make encrypted column required
ALTER TABLE plaid_connections
ALTER COLUMN encrypted_access_token SET NOT NULL;

-- Drop old plaintext column
ALTER TABLE plaid_connections
DROP COLUMN access_token;
```

### 7.3 Remove Migration Admin Key
```bash
supabase secrets unset MIGRATION_ADMIN_KEY
```

---

## 🔄 Rollback Procedure

If issues arise, you can rollback:

### Immediate Rollback (Within 24 hours)
```bash
# Revert edge functions to previous deployment
supabase functions deploy plaid-exchange-token --no-verify-jwt
supabase functions deploy plaid-sync-transactions --no-verify-jwt
```

### Database Rollback
```sql
-- Drop encrypted column
ALTER TABLE plaid_connections DROP COLUMN encrypted_access_token;
```

---

## 🔐 Key Management Best Practices

1. **Backup:** Store `PLAID_ENCRYPTION_KEY` in a secure secrets manager:
   - 1Password (recommended for small teams)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

2. **Access Control:** Limit who can view the encryption key

3. **Rotation:** Plan for key rotation in 12-24 months (requires re-encrypting all tokens)

4. **Monitoring:** Set up alerts for decryption failures:
   ```sql
   -- Monitor edge function logs for decryption errors
   SELECT * FROM edge_logs
   WHERE event_message LIKE '%decrypt%error%'
   AND timestamp > NOW() - INTERVAL '1 hour';
   ```

---

## 📝 Files Modified

**New Files:**
- `supabase/functions/_shared/encryption.ts` (encryption utilities)
- `supabase/functions/_shared/generate-encryption-key.ts` (key generator)
- `supabase/migrations/20251202201215_encrypt_plaid_tokens.sql` (database migration)
- `supabase/functions/migrate-encrypt-tokens/index.ts` (one-time migration function)
- `PATCH-5-SETUP-INSTRUCTIONS.md` (this file)

**Modified Files:**
- `supabase/functions/plaid-exchange-token/index.ts` (now encrypts tokens before storage)
- `supabase/functions/plaid-sync-transactions/index.ts` (now decrypts tokens before use)

---

## ❓ Troubleshooting

### Error: "PLAID_ENCRYPTION_KEY environment variable not set"
**Solution:** Ensure you've set the environment variable in Supabase secrets:
```bash
supabase secrets set PLAID_ENCRYPTION_KEY=<your-key>
```

### Error: "Invalid encrypted token format"
**Cause:** Token in database is not in expected `iv:ciphertext` format
**Solution:** Re-run the migration function for that connection

### Error: "Failed to decrypt token"
**Possible causes:**
1. Wrong encryption key in environment
2. Token was encrypted with a different key
3. Database corruption

**Solution:** Check that `PLAID_ENCRYPTION_KEY` matches the key used during encryption

### New connections work but old ones fail
**Cause:** Old tokens not yet migrated
**Solution:** Run the migration function (Step 4)

---

## 📊 Success Metrics

After deployment, monitor:
- ✅ Zero increase in Plaid API error rates
- ✅ All new connections have `encrypted_access_token` populated
- ✅ Transaction sync continues working for all users
- ✅ No decryption errors in edge function logs

---

## 🎯 Compliance Impact

This patch addresses:
- **HIPAA 45 CFR 164.312(a)(2)(iv):** Encryption of ePHI at rest ✅
- **Issue #5 (CRITICAL):** Plaid tokens stored in plaintext ✅

**Tier 1 Progress:** 5/5 (100%) - Critical Security tier complete!

---

## 📞 Support

If you encounter issues during setup:
1. Check Supabase edge function logs: `supabase functions logs`
2. Verify environment variables: `supabase secrets list`
3. Test encryption locally: Run `generate-encryption-key.ts` and test encryption utilities

---

**Last Updated:** 2025-12-02
**Patch Author:** Claude Code
**Estimated Setup Time:** 30-45 minutes
