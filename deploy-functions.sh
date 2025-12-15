#!/bin/bash

# Script to deploy all Supabase Edge Functions
# Usage: ./deploy-functions.sh

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked. Linking now..."
    echo "Please run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "📦 Deploying public functions..."
supabase functions deploy get-products-with-plans
supabase functions deploy get-product-by-slug

echo ""
echo "📦 Deploying order functions..."
supabase functions deploy create-order
supabase functions deploy create-payment
supabase functions deploy verify-payment

echo ""
echo "📦 Deploying admin functions..."
supabase functions deploy admin-create-product
supabase functions deploy admin-update-product
supabase functions deploy admin-delete-product
supabase functions deploy admin-create-plan
supabase functions deploy admin-update-plan
supabase functions deploy admin-get-orders

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Verify functions are accessible in Supabase Dashboard"
echo "2. Test functions using the examples in supabase/functions/README.md"
echo "3. Check that environment variables are set correctly"

