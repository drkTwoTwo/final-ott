# Troubleshooting Guide

## "Failed to fetch" Error When Creating Products

If you're getting a "Failed to fetch" error when trying to create a product in the admin panel, follow these steps:

### 1. Check Environment Variables

Make sure you have a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

### 2. Deploy Edge Functions

The Edge Functions must be deployed to Supabase before they can be used. 

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy all Edge Functions
supabase functions deploy

# Or deploy a specific function
supabase functions deploy admin-create-product
```

**Option B: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Create a new function or upload the function code
4. For each function in `supabase/functions/`, create it in the dashboard

### 3. Verify Edge Function Deployment

After deployment, verify the function is accessible:

```bash
# Test the function directly
curl -X POST https://your-project.supabase.co/functions/v1/admin-create-product \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product"}'
```

### 4. Check Browser Console

Open your browser's developer console (F12) and check:
- Network tab: Look for the failed request to see the exact error
- Console tab: Check for any additional error messages

### 5. Common Issues

**Issue: "Network error" or "Failed to fetch"**
- **Solution**: Edge Functions are not deployed. Deploy them using step 2.

**Issue: "401 Unauthorized"**
- **Solution**: Check that your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct and the user is authenticated.

**Issue: "403 Forbidden"**
- **Solution**: The user doesn't have admin role. Make sure the user's profile has `role = 'admin'` in the `profiles` table.

**Issue: "404 Not Found"**
- **Solution**: The Edge Function doesn't exist or the URL is incorrect. Verify the function name matches the deployed function.

**Issue: CORS errors**
- **Solution**: The Edge Function should handle CORS. Check that the function includes CORS headers (already included in our functions).

### 6. Quick Test

To quickly test if your setup is working:

1. Open browser console
2. Run:
```javascript
fetch('https://your-project.supabase.co/functions/v1/get-products-with-plans', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

If this works, your Edge Functions are accessible. If not, they need to be deployed.

### 7. Local Development

For local development, you can run Edge Functions locally:

```bash
# Start Supabase locally
supabase start

# Serve Edge Functions locally
supabase functions serve

# Then update NEXT_PUBLIC_SUPABASE_URL to http://localhost:54321
```

### Still Having Issues?

1. Check the Supabase project logs in the dashboard
2. Verify your Supabase project is active and not paused
3. Check your internet connection
4. Verify the Edge Function code doesn't have syntax errors
5. Check that all required environment variables are set in Supabase Edge Functions (Settings > Edge Functions > Secrets)

