#!/bin/bash
# PATCH #5 Setup Script
# Plaid Token Encryption - Manual Setup Steps
#
# PREREQUISITES:
# - Supabase CLI installed (https://supabase.com/docs/guides/cli)
# - Logged in to Supabase CLI: supabase login
# - Project linked: supabase link --project-ref <your-project-ref>

set -e  # Exit on error

echo "================================================================================"
echo "PATCH #5: Plaid Token Encryption Setup"
echo "================================================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ ERROR: Supabase CLI not found"
    echo ""
    echo "Please install Supabase CLI first:"
    echo "  npm install -g supabase"
    echo "  OR"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Set encryption key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Setting encryption keys in Supabase secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Set PLAID_ENCRYPTION_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase secrets set PLAID_ENCRYPTION_KEY="v3DUs0QkAwzuuLghL7KB+pIL18qK3Caq6QbOT7tYBSg="
    echo "✅ PLAID_ENCRYPTION_KEY set"
else
    echo "⏭️  Skipped"
fi

echo ""
read -p "Set MIGRATION_ADMIN_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase secrets set MIGRATION_ADMIN_KEY="f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg="
    echo "✅ MIGRATION_ADMIN_KEY set"
else
    echo "⏭️  Skipped"
fi

echo ""

# Step 2: Run database migration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Running database migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will add the 'encrypted_access_token' column to plaid_connections table"
echo ""

read -p "Run database migration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo "✅ Database migration complete"
else
    echo "⏭️  Skipped"
fi

echo ""

# Step 3: Deploy edge functions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Deploying updated edge functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Deploy plaid-exchange-token? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase functions deploy plaid-exchange-token
    echo "✅ plaid-exchange-token deployed"
else
    echo "⏭️  Skipped"
fi

echo ""
read -p "Deploy plaid-sync-transactions? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase functions deploy plaid-sync-transactions
    echo "✅ plaid-sync-transactions deployed"
else
    echo "⏭️  Skipped"
fi

echo ""
read -p "Deploy migrate-encrypt-tokens? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase functions deploy migrate-encrypt-tokens
    echo "✅ migrate-encrypt-tokens deployed"
else
    echo "⏭️  Skipped"
fi

echo ""

# Step 4: Check for existing connections
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Check for existing Plaid connections"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Checking if you have existing Plaid connections that need migration..."
echo ""

read -p "Run migration check query? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running: SELECT COUNT(*) FROM plaid_connections WHERE encrypted_access_token IS NULL;"
    supabase db query "SELECT COUNT(*) as unmigrated_tokens FROM plaid_connections WHERE encrypted_access_token IS NULL;" || echo "⚠️  Could not run query - check manually"
else
    echo "⏭️  Skipped"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Encryption keys generated and documented in .env.encryption-keys"
echo "✅ Setup script created (run with: bash SETUP-PATCH-5.sh)"
echo ""
echo "NEXT STEPS:"
echo "1. If you have existing Plaid connections, call the migration endpoint:"
echo "   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/migrate-encrypt-tokens \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -d '{\"admin_key\": \"f6AJDVZV6vgM4RXEcy/2RRwLdNndA3lGSO95oTX0Lbg=\"}'"
echo ""
echo "2. Test with a new Plaid connection to verify encryption works"
echo ""
echo "3. Monitor logs: supabase functions logs plaid-exchange-token"
echo ""
echo "================================================================================"
