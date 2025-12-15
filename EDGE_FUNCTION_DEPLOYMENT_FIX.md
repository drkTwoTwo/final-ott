# Edge Function Deployment Fix

## Issue: "Missing authorization header" Error

If you're seeing "Missing authorization header" errors when trying to load products, it means the Edge Functions are **not deployed** to Supabase.

## Quick Fix

Deploy the public Edge Functions:

```bash
# Deploy public functions
supabase functions deploy get-products-with-plans
supabase functions deploy get-product-by-slug

# Deploy order functions
supabase functions deploy create-order
supabase functions deploy create-payment
supabase functions deploy verify-payment

# Deploy admin functions
supabase functions deploy admin-create-product
supabase functions deploy admin-update-product
supabase functions deploy admin-delete-product
supabase functions deploy admin-create-plan
supabase functions deploy admin-update-plan
supabase functions deploy admin-get-orders
```

Or deploy all at once:

```bash
supabase functions deploy
```

## Verify Deployment

After deployment, verify the functions are accessible:

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. You should see all functions listed
4. Test a function:
   ```bash
   curl https://your-project.supabase.co/functions/v1/get-products-with-plans \
     -H "apikey: YOUR_ANON_KEY"
   ```

## Why This Happens

- Edge Functions must be deployed to Supabase before they can be called
- The error "Missing authorization header" is Supabase's default error when a function doesn't exist
- Even though the functions exist in your code, they need to be deployed to the Supabase platform

## After Deployment

Once deployed, the products should load correctly on the homepage and products page.


