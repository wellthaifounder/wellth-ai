# ⚠️ MANUAL SETUP REQUIRED - Patch #5

## Status: Code Complete, Deployment Pending

All Patch #5 code has been written and is ready to deploy. You need to complete these manual steps to activate the encryption.

---

## 🔐 Generated Encryption Keys

**Location:** `.env.encryption-keys` file in project root

```bash
PLAID_ENCRYPTION_KEY=v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=
MIGRATION_ADMIN_KEY=f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=
```

⚠️ **CRITICAL:** Back up these keys in a secure location (1Password, etc.) before proceeding!

---

## 📋 Manual Steps Checklist

### Prerequisites
- [ ] Supabase CLI installed (`npm install -g supabase` or `brew install supabase/tap/supabase`)
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Project linked (`supabase link --project-ref YOUR_PROJECT_REF`)

### Step 1: Set Environment Variables
```bash
supabase secrets set PLAID_ENCRYPTION_KEY="v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg="
supabase secrets set MIGRATION_ADMIN_KEY="f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg="
```

Verify:
```bash
supabase secrets list
```

### Step 2: Run Database Migration
```bash
supabase db push
```

This adds the `encrypted_access_token` column to the `plaid_connections` table.

Verify:
```bash
supabase db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plaid_connections' AND column_name = 'encrypted_access_token';"
```

Expected output: Should show the new column exists.

### Step 3: Deploy Edge Functions
```bash
# Deploy updated functions with encryption
supabase functions deploy plaid-exchange-token
supabase functions deploy plaid-sync-transactions

# Deploy one-time migration function
supabase functions deploy migrate-encrypt-tokens
```

Verify:
```bash
supabase functions list
```

### Step 4: Migrate Existing Tokens (If Applicable)

**Check if you have existing Plaid connections:**
```bash
supabase db query "SELECT COUNT(*) as total_connections FROM plaid_connections;"
```

**If count > 0**, you need to run the migration:

1. Get your project URL from Supabase dashboard
2. Get your anon key from Supabase dashboard (Settings > API)
3. Run migration:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/migrate-encrypt-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"admin_key": "f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg="}'
```

Expected response:
```json
{
  "success": true,
  "total": X,
  "encrypted": X,
  "errors": 0
}
```

**Verify migration:**
```bash
supabase db query "SELECT COUNT(*) as encrypted FROM plaid_connections WHERE encrypted_access_token IS NOT NULL;"
```

### Step 5: Test New Connection

1. In your app, link a new bank account via Plaid
2. Check database:
   ```bash
   supabase db query "SELECT id, encrypted_access_token IS NOT NULL as is_encrypted, LEFT(encrypted_access_token, 20) as preview FROM plaid_connections ORDER BY created_at DESC LIMIT 1;"
   ```
3. Should show `is_encrypted = true` and preview showing format like `abc123==:xyz789==`

4. Test transaction sync through the app
5. Check logs:
   ```bash
   supabase functions logs plaid-sync-transactions --tail
   ```
6. Should see: `[uuid] Decrypting Plaid access token`

---

## ✅ Success Criteria

After completing all steps, verify:

- [ ] `PLAID_ENCRYPTION_KEY` and `MIGRATION_ADMIN_KEY` are set in Supabase secrets
- [ ] Database migration applied (`encrypted_access_token` column exists)
- [ ] Edge functions deployed successfully
- [ ] Existing tokens migrated (if applicable, all show encrypted)
- [ ] New Plaid connections create encrypted tokens
- [ ] Transaction sync works without errors
- [ ] Logs show decryption messages
- [ ] No plaintext tokens in `encrypted_access_token` column

---

## 🧹 Cleanup (After 30 Days)

Once you've verified encryption is working in production for 30+ days:

```bash
# 1. Delete migration function (no longer needed)
supabase functions delete migrate-encrypt-tokens
rm -rf supabase/functions/migrate-encrypt-tokens/

# 2. Remove migration admin key
supabase secrets unset MIGRATION_ADMIN_KEY

# 3. Make encrypted column required and drop old column
supabase db query "
  ALTER TABLE plaid_connections
  ALTER COLUMN encrypted_access_token SET NOT NULL;

  ALTER TABLE plaid_connections
  DROP COLUMN access_token;
"
```

---

## 🆘 Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
# OR
brew install supabase/tap/supabase
```

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Get your project ref from Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### "PLAID_ENCRYPTION_KEY not set" in logs
```bash
# Check if secret was set correctly
supabase secrets list

# If missing, set it again
supabase secrets set PLAID_ENCRYPTION_KEY="v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg="
```

### Migration function returns error
- Check that `MIGRATION_ADMIN_KEY` matches exactly
- Verify you're using the anon key, not service role key, in the Authorization header
- Check function logs: `supabase functions logs migrate-encrypt-tokens`

### New connections still use plaintext
- Verify `plaid-exchange-token` function was deployed successfully
- Check function logs for errors: `supabase functions logs plaid-exchange-token`
- Ensure `PLAID_ENCRYPTION_KEY` is set in Supabase secrets

---

## 📞 Quick Reference

**Generated Keys Location:** `.env.encryption-keys`
**Full Documentation:** `PATCH-5-SETUP-INSTRUCTIONS.md`
**Quick Start:** `PATCH-5-QUICK-START.md`
**Automated Script:** `SETUP-PATCH-5.sh` (requires Supabase CLI)

**Estimated Time:** 10-15 minutes (if Supabase CLI already installed)

---

## ⚡ Quick Start (Recommended)

If you have Supabase CLI installed and project linked:

```bash
# Option 1: Run automated script
bash SETUP-PATCH-5.sh

# Option 2: Manual one-liner
supabase secrets set PLAID_ENCRYPTION_KEY="v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=" MIGRATION_ADMIN_KEY="f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=" && \
supabase db push && \
supabase functions deploy plaid-exchange-token && \
supabase functions deploy plaid-sync-transactions && \
supabase functions deploy migrate-encrypt-tokens
```

Then follow Step 4 for token migration (if needed) and Step 5 for testing.

---

**Last Updated:** 2025-12-02
**Author:** Claude Code
**Priority:** HIGH - Complete before deploying to production
