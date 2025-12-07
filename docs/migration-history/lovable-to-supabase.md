# Migration Guide: Lovable Cloud → Your Own Supabase

**New Supabase Project:** wellth-ai
**Project ID:** fzmdfhdfvayaalhogskm
**Project URL:** https://fzmdfhdfvayaalhogskm.supabase.co

---

## ✅ **What's Already Done**

- [x] Created new Supabase project
- [x] Updated `supabase/config.toml` with new project ID
- [x] Combined all 49 migrations into `MASTER_MIGRATION.sql`
- [x] All code changes committed to GitHub

---

## 🚀 **Migration Steps**

### **STEP 1: Run Database Migrations**

**Method A - SQL Editor (Easiest):**

1. **Go to:** https://supabase.com/dashboard/project/fzmdfhdfvayaalhogskm/sql/new
2. **Open** `MASTER_MIGRATION.sql` from your project root
3. **Copy entire file** (2,470 lines)
4. **Paste** into SQL Editor
5. **Click "RUN"**
6. Wait for "Success" message

**Expected Result:** All your database tables will be created (invoices, transactions, plaid_connections, etc.)

---

### **STEP 2: Set Environment Secrets**

1. **Go to:** https://supabase.com/dashboard/project/fzmdfhdfvayaalhogskm/settings/functions

2. **Click "Add new secret"** and add these:

   **Secret 1:**
   - Name: `PLAID_ENCRYPTION_KEY`
   - Value: `v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=`

   **Secret 2:**
   - Name: `MIGRATION_ADMIN_KEY`
   - Value: `f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=`

   **Secret 3:**
   - Name: `ALLOWED_ORIGIN`
   - Value: `https://wellth.ai` (or your production domain)

3. **Add any other secrets your app needs:**
   - `PLAID_CLIENT_ID`
   - `PLAID_SANDBOX_SECRET_KEY` (or `PLAID_SECRET_KEY` for production)
   - `STRIPE_SECRET_KEY`
   - `OPENAI_API_KEY` (if using Wellbie chat)
   - Any other API keys from your old setup

---

### **STEP 3: Deploy Edge Functions**

**Using CLI (Recommended if you have npx working):**

```bash
# Set environment variable with your new project ID
export SUPABASE_PROJECT_ID=fzmdfhdfvayaalhogskm

# Deploy all functions at once
npx supabase functions deploy --project-ref fzmdfhdfvayaalhogskm

# Or deploy individually:
npx supabase functions deploy plaid-exchange-token --project-ref fzmdfhdfvayaalhogskm
npx supabase functions deploy plaid-sync-transactions --project-ref fzmdfhdfvayaalhogskm
npx supabase functions deploy migrate-encrypt-tokens --project-ref fzmdfhdfvayaalhogskm
# ... etc for all 18 functions
```

**Using GitHub Integration (Alternative):**

1. **In Supabase dashboard**, go to Settings → Integrations
2. **Connect GitHub** repository
3. **Enable automatic deployments** for edge functions
4. Push to GitHub triggers auto-deploy

---

### **STEP 4: Update Frontend Environment Variables**

Update your frontend `.env` file (or Lovable environment variables):

```env
VITE_SUPABASE_URL=https://fzmdfhdfvayaalhogskm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bWRmaGRmdmF5YWFsaG9nc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDkwOTgsImV4cCI6MjA4MDUyNTA5OH0.D35OMBoBSRoY7mMPqjC62lYYToRBmwgyfD6EiElU2B8
```

**If using Lovable:**
1. Go to Lovable project settings
2. Update Supabase URL and Anon Key
3. Or switch to "Connect External Supabase" and enter your project details

---

### **STEP 5: Verify Everything Works**

**Check Database:**
```sql
-- Run in SQL Editor to verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables: invoices, transactions, plaid_connections, wellbie_conversations, etc.

**Check Edge Functions:**
1. Go to Edge Functions tab
2. Verify all 18 functions are deployed
3. Check logs for any errors

**Test in Your App:**
1. Try logging in
2. Try linking a bank account (Plaid)
3. Check that encryption is working

---

## 🔄 **What About Existing Data?**

If you have existing data in Lovable Cloud that you want to migrate:

### **Export from Lovable Cloud:**
1. Use Lovable's backup/export feature (if available)
2. Or query tables via SQL and export as CSV
3. Or use `pg_dump` if you have direct database access

### **Import to New Supabase:**
1. Use SQL Editor to import data
2. Or use Supabase Dashboard → Table Editor → Import CSV
3. Make sure UUIDs and foreign keys match

---

## 📋 **Quick Reference**

### **Your New Supabase Project:**
- **Project ID:** fzmdfhdfvayaalhogskm
- **URL:** https://fzmdfhdfvayaalhogskm.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/fzmdfhdfvayaalhogskm
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### **Encryption Keys (Store Securely!):**
- **PLAID_ENCRYPTION_KEY:** `v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=`
- **MIGRATION_ADMIN_KEY:** `f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=`

---

## ✅ **Migration Checklist**

- [ ] Run MASTER_MIGRATION.sql in SQL Editor
- [ ] Verify all tables created
- [ ] Set PLAID_ENCRYPTION_KEY secret
- [ ] Set MIGRATION_ADMIN_KEY secret
- [ ] Set ALLOWED_ORIGIN secret
- [ ] Add other API keys (Plaid, Stripe, OpenAI)
- [ ] Deploy all edge functions
- [ ] Update frontend environment variables
- [ ] Test login functionality
- [ ] Test Plaid bank linking
- [ ] Test transaction sync
- [ ] Verify encryption is working
- [ ] Export/import existing data (if needed)

---

## 🆘 **Troubleshooting**

### "Relation already exists" errors during migration
- Some tables might already exist
- Safe to ignore these specific errors
- Or start fresh: Database → Settings → Reset Database

### Edge functions not deploying
- Check you have the right permissions
- Try deploying via GitHub integration
- Or manually copy/paste function code in dashboard

### Frontend can't connect
- Double-check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Make sure CORS is configured (ALLOWED_ORIGIN secret)
- Check browser console for errors

---

**Estimated Time:** 30-45 minutes
**Priority:** HIGH - Required for production deployment

**Next Steps After Migration:**
1. Test thoroughly in staging
2. Update DNS/domains if needed
3. Monitor logs for any issues
4. Consider data backup strategy
