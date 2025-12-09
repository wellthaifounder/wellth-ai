# Supabase Connection Troubleshooting

## Error: "Failed to fetch (api.supabase.com)"

This is a network connectivity issue, not a SQL syntax error. The SQL is now correct!

---

## Quick Fixes (Try These First)

### 1. Check Internet Connection
```bash
# Test if you can reach Supabase
ping api.supabase.com

# Or in browser, visit:
https://supabase.com
```

### 2. Check Supabase Dashboard
- Go to https://supabase.com/dashboard
- Can you access your project?
- Is your project paused or suspended?

### 3. Try Different Network
- Disable VPN (if using one)
- Try different WiFi network
- Try mobile hotspot
- Check if firewall is blocking Supabase

### 4. Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cache
Or try Incognito/Private browsing
```

---

## Alternative: Run Migration Locally via Supabase CLI

If the web SQL Editor isn't working, use the CLI:

### Install Supabase CLI (if not already)

**Option 1: With npm (RECOMMENDED for beginners)**

First, fix PowerShell execution policy (if you get "scripts is disabled" error):

```powershell
# Open PowerShell as Administrator (right-click → Run as administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then install Supabase CLI:

```bash
npm install -g supabase
```

**Option 2: With Scoop (alternative)**
```bash
scoop install supabase
```

### Login to Supabase
```bash
supabase login
```

### Link to Your Project
```bash
cd /c/Users/Owen/OneDrive/Documents/VSCode/wellth-ai
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to Supabase Dashboard
- Project Settings → General → Reference ID

### Run the Migration

**Option A: Create migration directory and push (RECOMMENDED)**
```bash
# Create migrations directory if it doesn't exist
mkdir -p supabase/migrations

# Copy the corrected migration with timestamp
cp CORRECTED_MIGRATION.sql supabase/migrations/20241209000000_add_analytics_and_insurance.sql

# Push to database
npx supabase db push
```

**Option B: Use psql directly with the file**
```bash
# Use the connection string to execute the file
psql "postgresql://postgres:[YOUR-PASSWORD]@db.fzmdfhdfvayaalhogskm.supabase.co:5432/postgres" -f CORRECTED_MIGRATION.sql
```

---

## Alternative: Apply via REST API

If both SQL Editor and CLI fail, use the REST API:

```bash
# Get your service_role key from Supabase Dashboard → Project Settings → API
# WARNING: Keep this secret!

curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS public.analytics_events ..."
  }'
```

---

## Alternative: Apply Directly in Database (psql)

If you have database credentials:

```bash
# Connect via psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Then paste SQL from CORRECTED_MIGRATION.sql
```

---

## Temporary Workaround: Manual Table Creation

If you need to test RIGHT NOW and can't wait for connectivity, create tables manually via Supabase Dashboard:

### 1. Create `analytics_events` table
**Supabase Dashboard → Database → Tables → New Table**

| Column Name | Type | Default | Nullable |
|-------------|------|---------|----------|
| id | uuid | gen_random_uuid() | NO |
| user_id | uuid | - | YES |
| event_name | text | - | NO |
| event_properties | jsonb | '{}'::jsonb | NO |
| created_at | timestamptz | now() | NO |

**Foreign Keys:**
- user_id → auth.users(id) ON DELETE CASCADE

**Indexes:**
- idx_analytics_events_user_id on (user_id)
- idx_analytics_events_event_name on (event_name)
- idx_analytics_events_created_at on (created_at)

**RLS Policies:**
Enable RLS, then add:
1. "Users can view own analytics events" - SELECT - `auth.uid() = user_id`
2. "Users can insert own analytics events" - INSERT - `auth.uid() = user_id OR user_id IS NULL`
3. "Admins can view all analytics events" - SELECT - `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)`

### 2. Add columns to `profiles` table
**Supabase Dashboard → Database → Tables → profiles → Add Column**

| Column Name | Type | Default | Nullable |
|-------------|------|---------|----------|
| insurance_plan | jsonb | NULL | YES |
| is_admin | boolean | false | YES |

---

## Check Supabase Status

Visit: https://status.supabase.com/

Is there an ongoing incident?

---

## Contact Supabase Support

If issue persists:
1. Go to https://supabase.com/dashboard/support
2. Include:
   - Error message: "Failed to fetch (api.supabase.com)"
   - When it started
   - Your project ref
   - Browser/OS info

---

## Next Steps Once Connected

Once you can access Supabase again:

1. ✅ Run [`CORRECTED_MIGRATION.sql`](CORRECTED_MIGRATION.sql)
2. ✅ Verify with queries in [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
3. ✅ Continue with [`QUICK_INTEGRATION_GUIDE.md`](QUICK_INTEGRATION_GUIDE.md)

---

## Test Without Migration (Dev Mode)

While troubleshooting connectivity, you can still test the UI locally:

The analytics will log to console instead of database (in dev mode):

```bash
npm run dev
```

Check browser console for:
```
Analytics (dev): { type: 'page_view', ... }
```

This confirms the code is working, just waiting for database connection.

---

## Most Likely Cause

**Network/ISP blocking Supabase**
- Some corporate networks block cloud databases
- Try from home WiFi vs work network
- Try mobile hotspot

**Supabase project paused**
- Free tier projects pause after inactivity
- Go to dashboard and click "Resume" if needed

**Browser extension blocking**
- Ad blockers, privacy extensions may block API calls
- Try disabling extensions or use Incognito mode
