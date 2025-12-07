# Installation Guide

This guide will help you set up Wellth.ai for local development. Follow these steps carefully to ensure a smooth setup process.

**Expected Time:** 30-45 minutes

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

1. **Node.js 18+** and **npm**
   ```bash
   # Check versions
   node --version  # Should be v18.0.0 or higher
   npm --version   # Should be v9.0.0 or higher
   ```

   **Install with nvm (recommended):**
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # Install Node.js 18
   nvm install 18
   nvm use 18
   ```

2. **Git**
   ```bash
   git --version  # Should be v2.0.0 or higher
   ```

   Install from: https://git-scm.com/downloads

3. **Supabase CLI** (optional but recommended)
   ```bash
   npm install -g supabase
   # Or use npx: npx supabase <command>
   ```

### Required Accounts

Create accounts for the following services:

1. **Supabase** - Database and backend
   - Sign up: https://supabase.com
   - Create a new project
   - Note your Project URL and API keys

2. **Stripe** - Payment processing
   - Sign up: https://stripe.com
   - Get test API keys from: https://dashboard.stripe.com/test/apikeys
   - Set up products and pricing

3. **Plaid** - Bank account integration
   - Sign up: https://plaid.com
   - Get sandbox credentials from: https://dashboard.plaid.com/team/keys
   - Use sandbox environment for development

4. **Gemini AI** - AI features
   - Get API key from: https://aistudio.google.com/app/apikey
   - Enable Gemini API in your Google Cloud project

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/wellthaifounder/claude-supabase-starter.git

# Navigate to project directory
cd wellth-ai

# Verify you're in the right directory
ls -la  # Should see package.json, src/, supabase/, etc.
```

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm list --depth=0
```

**Expected output:** List of ~70+ dependencies including:
- react@18.3.1
- @supabase/supabase-js@2.58.0
- @stripe/stripe-js@8.1.0
- react-plaid-link@4.1.1
- And more...

## Step 3: Set Up Environment Variables

### Create .env File

```bash
# Copy the example file
cp .env.example .env
```

### Configure Your .env

Open `.env` in your text editor and replace all placeholder values. See [Environment Variables Guide](environment-variables.md) for detailed explanations.

**Minimum Required Variables:**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Plaid
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox

# Gemini AI
GEMINI_API_KEY=your_api_key_here

# Encryption
PLAID_ENCRYPTION_KEY=$(openssl rand -base64 32)

# App Config
ALLOWED_ORIGIN=http://localhost:5173
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
```

### Generate Encryption Key

```bash
# Generate a secure encryption key
openssl rand -base64 32

# Add to your .env file as PLAID_ENCRYPTION_KEY
```

## Step 4: Set Up Supabase Database

### Link Your Supabase Project

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref
```

**Find your project ref:**
- Go to https://app.supabase.com/project/_/settings/general
- Look for "Reference ID" or check your Project URL: `https://[project-ref].supabase.co`

### Run Database Migrations

```bash
# Push all migrations to your Supabase database
npx supabase db push

# Expected output:
# Applying migration 20251005_initial_schema.sql...
# Applying migration 20251010_add_rls_policies.sql...
# ... (35+ migrations)
# Finished supabase db push
```

**What this does:**
- Creates all database tables (20+ tables)
- Sets up Row Level Security policies (40+ policies)
- Creates database functions and triggers
- Sets up enum types and constraints

### Verify Database Setup

```bash
# Check database status
npx supabase db diff

# Should show: "No schema changes detected"
```

Or visit your Supabase project:
- Go to https://app.supabase.com/project/your-project-ref/editor
- Verify you see tables like: profiles, expenses, invoices, hsa_accounts, etc.

## Step 5: Configure Supabase Secrets

Edge functions need access to your secrets. Set them in Supabase:

```bash
# Set Stripe secret (for subscription management)
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_your_key_here"

# Set Plaid credentials
npx supabase secrets set PLAID_CLIENT_ID="your_client_id"
npx supabase secrets set PLAID_SECRET="your_sandbox_secret"
npx supabase secrets set PLAID_ENV="sandbox"

# Set Gemini AI key
npx supabase secrets set GEMINI_API_KEY="your_api_key"

# Set encryption key
npx supabase secrets set PLAID_ENCRYPTION_KEY="your_generated_key"

# Set allowed origin
npx supabase secrets set ALLOWED_ORIGIN="http://localhost:5173"

# Verify secrets are set
npx supabase secrets list
```

## Step 6: Deploy Edge Functions (Optional for Development)

For full functionality, deploy the edge functions:

```bash
# Deploy all 17 edge functions
npx supabase functions deploy

# Or deploy specific functions
npx supabase functions deploy analyze-medical-bill
npx supabase functions deploy plaid-create-link-token
# ... etc.
```

**Note:** You can develop frontend without deploying edge functions initially. Deploy when you need backend functionality.

## Step 7: Start Development Server

```bash
# Start Vite development server
npm run dev
```

**Expected output:**
```
VITE v5.4.19  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Open in browser:** http://localhost:5173

## Step 8: Verify Installation

### Create a Test Account

1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Enter email and password (min 8 characters)
4. Verify you can sign in

### Check Database Connection

After signing in:
- You should see the Dashboard page
- No console errors related to Supabase
- Your user profile should be created automatically

### Verify in Supabase Dashboard

1. Go to https://app.supabase.com/project/your-project-ref/editor
2. Click on `profiles` table
3. You should see your newly created user profile

## Installation Checklist

Use this checklist to verify everything is set up correctly:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] npm install completed without errors
- [ ] .env file created and configured
- [ ] Supabase project created
- [ ] Database migrations pushed successfully (35+ migrations)
- [ ] Supabase secrets configured
- [ ] Development server starts without errors
- [ ] Can create account and sign in
- [ ] User profile appears in Supabase database
- [ ] No console errors in browser

## Troubleshooting

### Issue: "npm install" fails

**Symptoms:** Errors during `npm install`

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot connect to Supabase"

**Symptoms:** Frontend can't reach Supabase, CORS errors

**Solutions:**
1. Verify `VITE_SUPABASE_URL` in .env is correct
2. Verify `VITE_SUPABASE_ANON_KEY` in .env is correct
3. Check Supabase project is running (not paused)
4. Restart development server

```bash
# Test Supabase connection
curl https://your-project-ref.supabase.co/rest/v1/
```

### Issue: "Migration failed"

**Symptoms:** `npx supabase db push` fails

**Solutions:**
1. Check you're linked to correct project:
   ```bash
   npx supabase projects list
   npx supabase link --project-ref correct-project-ref
   ```

2. Reset database (⚠️ destroys all data):
   ```bash
   npx supabase db reset
   ```

3. Check migration file syntax in `supabase/migrations/`

### Issue: "Edge function not found"

**Symptoms:** API calls to edge functions return 404

**Solutions:**
1. Ensure functions are deployed:
   ```bash
   npx supabase functions list
   ```

2. Deploy missing functions:
   ```bash
   npx supabase functions deploy function-name
   ```

3. Verify function URL in Supabase dashboard

### Issue: "Stripe/Plaid integration not working"

**Symptoms:** Subscription or bank connection fails

**Solutions:**
1. Verify API keys in .env are correct
2. Check you're using TEST keys (pk_test_..., sk_test_...)
3. Verify Supabase secrets are set:
   ```bash
   npx supabase secrets list
   ```
4. Check browser console for detailed error messages

### Issue: "Port 5173 already in use"

**Symptoms:** Vite can't start because port is occupied

**Solutions:**
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Issue: "Authentication not working"

**Symptoms:** Can't sign up or sign in

**Solutions:**
1. Verify Supabase Auth is enabled in dashboard
2. Check email confirmation is disabled for development:
   - Go to: https://app.supabase.com/project/_/auth/settings
   - Disable "Confirm email" for development
3. Check browser console for errors
4. Verify RLS policies are in place:
   ```bash
   npx supabase db diff
   ```

## Next Steps

Now that your development environment is set up:

1. **Explore the codebase:**
   - Read [Architecture Overview](../architecture/README.md)
   - Review [Database Schema](../database/schema.md)
   - Check [Component Structure](../architecture/frontend-architecture.md)

2. **Start developing:**
   - Review [Coding Standards](../development/coding-standards.md)
   - Read [Development Guide](development.md)
   - Check [Contributing Guidelines](../../CONTRIBUTING.md)

3. **Test integrations:**
   - [Stripe Integration](../integrations/stripe.md) - Test subscription flow
   - [Plaid Integration](../integrations/plaid.md) - Connect sandbox bank account
   - [AI Features](../integrations/gemini-ai.md) - Test bill analysis

4. **Learn the features:**
   - [Expense Tracking](../features/expense-tracking.md)
   - [HSA Account Management](../features/hsa-accounts.md)
   - [Bill Review](../features/bill-review.md)

## Getting Help

- **Installation Issues:** Open a [GitHub Issue](https://github.com/wellthaifounder/claude-supabase-starter/issues)
- **Questions:** Ask in [GitHub Discussions](https://github.com/wellthaifounder/claude-supabase-starter/discussions)
- **Documentation:** Check [docs/](../README.md)
- **Support:** Email support@wellth.ai

---

**Congratulations!** You're ready to start developing with Wellth.ai.

**Next:** [Environment Variables Guide](environment-variables.md) | [Development Guide](development.md)
