# Environment Variables Guide

This guide explains all environment variables used in Wellth.ai and how to configure them properly.

## Quick Reference

```bash
# Copy .env.example to .env
cp .env.example .env

# Generate encryption key
openssl rand -base64 32
```

## Environment Variables by Category

### Supabase Configuration

#### `VITE_SUPABASE_URL` (Required)
**Description:** Your Supabase project URL
**Example:** `https://fzmdfhdfvayaalhogskm.supabase.co`
**Where to find:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → Project URL

**Frontend/Backend:** Frontend (exposed in browser)
**Security Level:** Public (safe to expose)

---

#### `VITE_SUPABASE_ANON_KEY` (Required)
**Description:** Supabase anonymous/public API key
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
**Where to find:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → Project API keys → `anon` `public`

**Frontend/Backend:** Frontend (exposed in browser)
**Security Level:** Public (safe to expose, protected by RLS)

**Note:** This key is used for client-side operations. Row Level Security (RLS) policies protect your data even with this key exposed.

---

#### `SUPABASE_SERVICE_ROLE_KEY` (Required for Edge Functions)
**Description:** Supabase service role key with admin privileges
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
**Where to find:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → Project API keys → `service_role` `secret`

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** **CRITICAL** - Never expose in frontend

⚠️ **WARNING:** This key bypasses Row Level Security. Only use in edge functions, never in frontend code.

---

### Stripe Configuration

#### `VITE_STRIPE_PUBLISHABLE_KEY` (Required)
**Description:** Stripe publishable key for frontend
**Example:** `pk_test_51Abc...` (test) or `pk_live_51Xyz...` (production)
**Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

**Frontend/Backend:** Frontend (exposed in browser)
**Security Level:** Public (safe to expose)

**Development:** Use test key (`pk_test_...`)
**Production:** Use live key (`pk_live_...`)

---

#### `STRIPE_SECRET_KEY` (Required for Edge Functions)
**Description:** Stripe secret key for backend operations
**Example:** `sk_test_51Abc...` (test) or `sk_live_51Xyz...` (production)
**Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** **CRITICAL** - Never expose in frontend

**Used by:** `create-checkout`, `check-subscription`, `customer-portal` edge functions

---

#### `STRIPE_WEBHOOK_SECRET` (Required for Webhooks)
**Description:** Stripe webhook signing secret for verifying webhook signatures
**Example:** `whsec_...`
**Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Select endpoint → Signing secret

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** Secret

**Setup:**
1. Create webhook endpoint in Stripe Dashboard
2. URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Copy the signing secret

---

#### `STRIPE_PRICE_ID_PLUS` (Optional)
**Description:** Stripe Price ID for Plus subscription tier
**Example:** `price_1ABC...`
**Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/products) → Your product → Pricing

**Used for:** Plus tier ($9.99/month) checkout

---

#### `STRIPE_PRICE_ID_PREMIUM` (Optional)
**Description:** Stripe Price ID for Premium subscription tier
**Example:** `price_1XYZ...`
**Where to find:** [Stripe Dashboard](https://dashboard.stripe.com/products) → Your product → Pricing

**Used for:** Premium tier ($19.99/month) checkout

---

### Plaid Configuration

#### `PLAID_CLIENT_ID` (Required)
**Description:** Plaid client identifier
**Example:** `60a1b2c3d4e5f6a7b8c9d0e1`
**Where to find:** [Plaid Dashboard](https://dashboard.plaid.com/team/keys)

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** Confidential

**Used by:** All Plaid edge functions

---

#### `PLAID_SECRET` (Required)
**Description:** Plaid API secret
**Example:** `abc123def456...`
**Where to find:** [Plaid Dashboard](https://dashboard.plaid.com/team/keys)

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** **CRITICAL** - Never expose

**Environments:**
- Sandbox: Use for development/testing
- Development: Use for testing with real credentials
- Production: Use for live transactions

---

#### `PLAID_ENV` (Required)
**Description:** Plaid environment
**Values:** `sandbox` | `development` | `production`
**Default:** `sandbox`

**Environment Guide:**
- **sandbox**: Testing without real bank credentials (use test account: `user_good` / `pass_good`)
- **development**: Testing with real bank credentials (limited institutions)
- **production**: Live production environment

**Development:** Always use `sandbox`
**Production:** Use `production`

---

### Gemini AI Configuration

#### `GEMINI_API_KEY` (Required for AI Features)
**Description:** Google Gemini API key for AI-powered features
**Example:** `AIzaSyD...`
**Where to find:** [Google AI Studio](https://aistudio.google.com/app/apikey)

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** Secret

**Used by:**
- `analyze-medical-bill` - Medical bill error detection
- `wellbie-chat` - AI assistant chat
- `redact-phi` - AI-based PHI detection

**Setup:**
1. Create Google Cloud project
2. Enable Gemini API
3. Create API key in AI Studio

---

### Encryption Configuration

#### `PLAID_ENCRYPTION_KEY` (Required)
**Description:** AES-256-GCM encryption key for Plaid access tokens
**Format:** Base64-encoded 32-byte key (44 characters)
**Example:** `v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg=`

**Frontend/Backend:** Backend only (edge functions)
**Security Level:** **CRITICAL** - Never expose, backup securely

**Generate:**
```bash
openssl rand -base64 32
```

**Important:**
- **MUST be exactly 32 bytes** (44 characters in base64)
- **Same key** must be used across all environments sharing the database
- **Backup securely** (1Password, AWS Secrets Manager, etc.)
- **If lost**, encrypted tokens cannot be decrypted

**Used by:**
- `plaid-exchange-token` - Encrypts new Plaid tokens
- `plaid-sync-transactions` - Decrypts tokens for API calls

---

#### `MIGRATION_ADMIN_KEY` (Temporary)
**Description:** One-time admin key for migrating plaintext tokens to encrypted
**Format:** Base64-encoded 32-byte key
**Example:** `f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=`

**Used by:** `migrate-encrypt-tokens` edge function (one-time use)

**Generate:**
```bash
openssl rand -base64 32
```

**Lifecycle:**
1. Set before running migration
2. Run `migrate-encrypt-tokens` function once
3. **Delete after 30 days** (when confident migration succeeded)

```bash
# Remove after migration complete
npx supabase secrets unset MIGRATION_ADMIN_KEY
```

---

### Application Configuration

#### `ALLOWED_ORIGIN` (Required for Edge Functions)
**Description:** Allowed CORS origin for edge functions
**Example:**
- Development: `http://localhost:5173`
- Production: `https://wellth.ai`

**Frontend/Backend:** Backend (edge functions CORS)
**Security Level:** Important for security

**Important:** Must match your frontend URL exactly (including protocol and port)

---

#### `NODE_ENV` (Required)
**Description:** Node environment
**Values:** `development` | `production` | `test`
**Default:** `development`

**Effects:**
- `development`: Verbose logging, React DevTools enabled, dev error messages
- `production`: Minimal logging, optimized builds, generic error messages

---

#### `VITE_APP_URL` (Required)
**Description:** Application base URL
**Example:**
- Development: `http://localhost:5173`
- Production: `https://wellth.ai`

**Used for:**
- OAuth redirects
- Email links
- Share URLs

---

### Optional: Email Configuration

#### `SMTP_HOST` (Optional)
**Description:** SMTP server hostname
**Example:** `smtp.sendgrid.net`

---

#### `SMTP_PORT` (Optional)
**Description:** SMTP server port
**Example:** `587` (TLS) or `465` (SSL)

---

#### `SMTP_USER` (Optional)
**Description:** SMTP authentication username
**Example:** `apikey` (SendGrid) or your email

---

#### `SMTP_PASS` (Optional)
**Description:** SMTP authentication password
**Example:** Your SMTP password or API key

**Security:** Never commit to git

---

#### `SMTP_FROM` (Optional)
**Description:** Default "from" email address
**Example:** `noreply@wellth.ai`

---

### Optional: Analytics & Monitoring

#### `VITE_GA_MEASUREMENT_ID` (Optional)
**Description:** Google Analytics 4 measurement ID
**Example:** `G-XXXXXXXXXX`
**Where to find:** Google Analytics → Admin → Data Streams

**Frontend/Backend:** Frontend
**Security Level:** Public

---

#### `VITE_SENTRY_DSN` (Optional)
**Description:** Sentry Data Source Name for error tracking
**Example:** `https://abc123@o123456.ingest.sentry.io/123456`
**Where to find:** Sentry → Settings → Projects → Client Keys (DSN)

**Frontend/Backend:** Frontend
**Security Level:** Public (designed to be exposed)

---

### Development Tools

#### `VITE_ENABLE_REACT_QUERY_DEVTOOLS` (Optional)
**Description:** Enable React Query DevTools in development
**Values:** `true` | `false`
**Default:** `true` in development

---

#### `VITE_ENABLE_VERBOSE_LOGGING` (Optional)
**Description:** Enable verbose console logging
**Values:** `true` | `false`
**Default:** `false`

---

## Environment-Specific Configurations

### Development (.env)

```bash
# Use sandbox/test credentials
PLAID_ENV=sandbox
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
ALLOWED_ORIGIN=http://localhost:5173
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
```

### Production (.env.production)

```bash
# Use production credentials
PLAID_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
ALLOWED_ORIGIN=https://wellth.ai
NODE_ENV=production
VITE_APP_URL=https://wellth.ai
```

---

## Setting Supabase Secrets

Edge functions access environment variables via Supabase secrets:

```bash
# Set individual secret
npx supabase secrets set KEY_NAME="value"

# Set multiple secrets
npx supabase secrets set \
  STRIPE_SECRET_KEY="sk_test_..." \
  PLAID_CLIENT_ID="..." \
  PLAID_SECRET="..." \
  GEMINI_API_KEY="..."

# List all secrets
npx supabase secrets list

# Unset a secret
npx supabase secrets unset KEY_NAME
```

**Required Secrets for Edge Functions:**
```bash
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_..."
npx supabase secrets set PLAID_CLIENT_ID="your_client_id"
npx supabase secrets set PLAID_SECRET="your_secret"
npx supabase secrets set PLAID_ENV="sandbox"
npx supabase secrets set GEMINI_API_KEY="your_api_key"
npx supabase secrets set PLAID_ENCRYPTION_KEY="$(openssl rand -base64 32)"
npx supabase secrets set ALLOWED_ORIGIN="http://localhost:5173"
```

---

## Security Best Practices

### Never Commit Secrets

**Add to .gitignore:**
```gitignore
.env
.env.local
.env.*.local
```

**Verify:**
```bash
# Check .env is ignored
git status

# Should NOT show .env file
```

---

### Use Different Keys per Environment

- **Development:** Use test/sandbox keys
- **Staging:** Use separate test keys
- **Production:** Use production keys

**Never** use production keys in development.

---

### Rotate Keys Regularly

Recommended rotation schedule:
- **API Keys:** Every 90 days
- **Encryption Keys:** Annually (requires re-encryption)
- **After Security Incident:** Immediately

---

### Store Secrets Securely

**Recommended tools:**
- **1Password** - Team password manager
- **AWS Secrets Manager** - AWS secret storage
- **HashiCorp Vault** - Enterprise secret management
- **Doppler** - Developer secret management

---

## Verification Checklist

Before deploying, verify:

- [ ] All required variables set in .env
- [ ] `.env` file NOT committed to git
- [ ] Encryption key generated (32 bytes base64)
- [ ] Supabase secrets configured
- [ ] Using test keys in development
- [ ] Using production keys in production
- [ ] `ALLOWED_ORIGIN` matches frontend URL
- [ ] Stripe webhooks configured
- [ ] Plaid environment set correctly

---

## Troubleshooting

### "Invalid Supabase URL"

**Cause:** Incorrect `VITE_SUPABASE_URL`

**Fix:**
1. Verify URL format: `https://[project-ref].supabase.co`
2. No trailing slash
3. Must start with `https://`

---

### "Unauthorized" errors

**Cause:** Incorrect or missing API keys

**Fix:**
1. Verify `VITE_SUPABASE_ANON_KEY` is correct
2. Check key hasn't been rotated
3. Ensure RLS policies allow operation

---

### "CORS error" in edge functions

**Cause:** `ALLOWED_ORIGIN` mismatch

**Fix:**
1. Verify `ALLOWED_ORIGIN` matches your frontend URL exactly
2. Include protocol (`http://` or `https://`)
3. Include port if not standard (`:5173` for dev)

---

### "Encryption key invalid"

**Cause:** `PLAID_ENCRYPTION_KEY` wrong length

**Fix:**
1. Must be exactly 32 bytes (44 chars in base64)
2. Generate with: `openssl rand -base64 32`
3. No extra whitespace or newlines

---

## Related Documentation

- [Installation Guide](installation.md) - Complete setup process
- [Development Guide](development.md) - Local development workflow
- [Deployment Guide](../deployment/supabase-setup.md) - Production deployment
- [Security Policy](../security/SECURITY.md) - Security best practices

---

**Last Updated:** December 6, 2025
