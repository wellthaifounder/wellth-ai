# PATCH #5 Quick Start Guide

## ✅ COMPLETED BY CLAUDE
- [x] Created encryption utility module with AES-256-GCM
- [x] Updated plaid-exchange-token to encrypt tokens
- [x] Updated plaid-sync-transactions to decrypt tokens
- [x] Created database migration script
- [x] Created one-time token migration function
- [x] Generated encryption keys
- [x] Created setup script

## ⚠️ MANUAL STEPS REQUIRED (By You)

### Prerequisites
Install Supabase CLI if not already installed:
```bash
npm install -g supabase
# OR
brew install supabase/tap/supabase
```

### Option 1: Run Automated Setup Script (Recommended)
```bash
bash SETUP-PATCH-5.sh
```

This interactive script will guide you through all steps.

---

### Option 2: Manual Setup

#### 1. Set Environment Variables
```bash
# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set PLAID_ENCRYPTION_KEY="v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg="
supabase secrets set MIGRATION_ADMIN_KEY="f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg="
```

#### 2. Run Database Migration
```bash
supabase db push
```

#### 3. Deploy Edge Functions
```bash
supabase functions deploy plaid-exchange-token
supabase functions deploy plaid-sync-transactions
supabase functions deploy migrate-encrypt-tokens
```

#### 4. Migrate Existing Tokens (If You Have Existing Plaid Connections)

Check if you have unmigrated tokens:
```bash
supabase db query "SELECT COUNT(*) FROM plaid_connections WHERE encrypted_access_token IS NULL;"
```

If count > 0, run migration:
```bash
# Get your project URL and anon key from Supabase dashboard
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/migrate-encrypt-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"admin_key": "f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg="}'
```

Expected response:
```json
{"success": true, "total": X, "encrypted": X, "errors": 0}
```

#### 5. Verify Setup
```bash
# Check logs for encryption messages
supabase functions logs plaid-exchange-token

# Test with a new Plaid connection
# Should see: "[uuid] Encrypting Plaid access token" in logs
```

---

## 🔐 Generated Keys (Stored in .env.encryption-keys)

**PLAID_ENCRYPTION_KEY:** `v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=`
**MIGRATION_ADMIN_KEY:** `f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=`

⚠️ **BACKUP THESE KEYS SECURELY** - Without them, encrypted tokens cannot be recovered!

---

## 🧪 Testing

1. **Link a new bank account** via Plaid in your app
2. **Check database:**
   ```sql
   SELECT
     id,
     encrypted_access_token IS NOT NULL as is_encrypted,
     LENGTH(encrypted_access_token) as encrypted_length
   FROM plaid_connections
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. **Verify encrypted format:** Should look like `abc123...==:xyz789...==` (two base64 strings separated by colon)
4. **Test transaction sync:** Should work normally, check logs for decryption messages

---

## 📊 Files Created/Modified

### New Files
- `supabase/functions/_shared/encryption.ts` - Encryption utilities
- `supabase/functions/_shared/generate-encryption-key.ts` - Key generator
- `supabase/migrations/20251202201215_encrypt_plaid_tokens.sql` - DB migration
- `supabase/functions/migrate-encrypt-tokens/index.ts` - Token migration function
- `.env.encryption-keys` - Generated keys (DO NOT COMMIT)
- `PATCH-5-SETUP-INSTRUCTIONS.md` - Full documentation
- `SETUP-PATCH-5.sh` - Automated setup script
- `PATCH-5-QUICK-START.md` - This file

### Modified Files
- `supabase/functions/plaid-exchange-token/index.ts` - Added encryption
- `supabase/functions/plaid-sync-transactions/index.ts` - Added decryption

---

## 🎯 Success Criteria

- [ ] Environment variables set in Supabase
- [ ] Database migration applied
- [ ] Edge functions deployed
- [ ] Existing tokens migrated (if applicable)
- [ ] New Plaid connections create encrypted tokens
- [ ] Transaction sync works with decryption
- [ ] No errors in function logs

---

## 🆘 Troubleshooting

**"Supabase CLI not found"**
→ Install: `npm install -g supabase` or `brew install supabase/tap/supabase`

**"Project not linked"**
→ Run: `supabase link --project-ref YOUR_REF`

**"PLAID_ENCRYPTION_KEY not set" error in logs**
→ Verify secret was set: `supabase secrets list`

**"Invalid encrypted token format"**
→ Re-run migration function for that connection

---

**Estimated setup time:** 10-15 minutes (if Supabase CLI already installed)

**Next:** After setup complete, proceed to Tier 2 - Critical Bugs
