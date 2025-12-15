# Production Deployment Guide - Complete

## Quick Start

1. **Set up Supabase project**
2. **Run database migrations**
3. **Deploy Edge Functions**
4. **Configure environment variables**
5. **Deploy application**

## Step-by-Step Deployment

### 1. Supabase Project Setup

1. Create a new Supabase project
2. Note your project URL and API keys
3. Go to SQL Editor

### 2. Database Migrations

Run these migrations **in order** in Supabase SQL Editor:

```sql
-- 1. Base schema
-- Copy and paste: supabase/migrations/001_complete_schema.sql
-- Execute

-- 2. Add slug and stock
-- Copy and paste: supabase/migrations/002_add_slug_and_stock.sql
-- Execute

-- 3. Add category
-- Copy and paste: supabase/migrations/003_add_category.sql
-- Execute

-- 4. Add phone to orders
-- Copy and paste: supabase/migrations/004_add_phone_to_orders.sql
-- Execute
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `product-images`
4. Set to **Public**
5. Create bucket

**Set bucket policy:**
```sql
-- Allow public read
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated uploads (for admin)
CREATE POLICY "Authenticated can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

### 4. Create Admin User

1. Sign up a user through your app (or Supabase Auth)
2. Get the user ID from `auth.users` table
3. Set admin role:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'user-id-from-auth-users';
```

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set XTRAGATEWAY_API_KEY=your_api_key_here

# Deploy all functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy get-products-with-plans
supabase functions deploy get-product-by-slug
supabase functions deploy admin-create-product
supabase functions deploy admin-update-product
supabase functions deploy admin-delete-product
supabase functions deploy admin-create-plan
supabase functions deploy admin-update-plan
supabase functions deploy admin-get-orders
```

### 6. Environment Variables

Create `.env.local` (for local) and set in your hosting platform (for production):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Payment Provider
XTRAGATEWAY_API_KEY=your_xtragateway_api_key
XTRAGATEWAY_WEBHOOK_SECRET=your_webhook_secret
```

**⚠️ Important:**
- Never commit `.env.local` to git
- `SUPABASE_SERVICE_ROLE_KEY` is secret - only use server-side
- Use different keys for staging/production

### 7. Configure xtragateway.site

1. Log in to xtragateway.site dashboard
2. Get your API key
3. Set webhook URL: `https://your-domain.com/api/webhooks/xtragateway`
4. Configure webhook events
5. Set webhook secret (if provided)

**⚠️ Note:** Update API endpoints in Edge Functions based on actual xtragateway.site documentation.

### 8. Deploy Application

#### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

#### Option B: Self-Hosted

```bash
npm run build
npm start
```

#### Option C: Docker

```bash
docker build -t ott-marketplace .
docker run -p 3000:3000 ott-marketplace
```

## Performance Optimizations

### Database

All indexes are created in migrations. Monitor query performance in Supabase dashboard.

### Next.js

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-supabase-storage-url.supabase.co'],
  },
};
```

### Edge Functions

- Use connection pooling
- Cache frequently accessed data
- Minimize database queries

## Monitoring

### Error Tracking

Consider integrating:
- Sentry for error tracking
- Vercel Analytics
- Supabase Logs

### Database Monitoring

- Monitor Supabase dashboard
- Check query performance
- Monitor connection pool
- Review slow queries

### Edge Function Logs

```bash
supabase functions logs create-payment --tail
```

## Security Checklist

- [x] RLS enabled on all tables
- [x] Admin routes protected
- [x] Input validation everywhere
- [x] No sensitive data in client
- [x] Service role key secured
- [x] Payment verification server-side
- [x] Webhook signature verification ready
- [x] Error messages don't leak info

## Testing Checklist

Before going live:

- [ ] Test user signup/login
- [ ] Test admin login
- [ ] Test product creation
- [ ] Test plan creation
- [ ] Test image upload
- [ ] Test product display
- [ ] Test checkout flow
- [ ] Test payment processing
- [ ] Test webhook callbacks
- [ ] Test order status updates
- [ ] Test stock decrement
- [ ] Test guest checkout
- [ ] Test authenticated checkout
- [ ] Test error scenarios
- [ ] Test mobile responsiveness

## Troubleshooting

### Edge Functions not working
- Check function logs
- Verify secrets are set
- Check function URLs

### RLS blocking queries
- Verify policies are correct
- Check user authentication
- Review policy conditions

### Payment webhook not receiving
- Verify webhook URL is correct
- Check webhook secret
- Review webhook logs
- Test webhook manually

### Images not loading
- Verify bucket is public
- Check CORS settings
- Verify image URLs

## Support

For issues:
1. Check Supabase logs
2. Check Edge Function logs
3. Check application logs
4. Review error messages
5. Test in development first

## Maintenance

### Regular Tasks

- **Weekly:** Monitor error logs
- **Monthly:** Review payment success rates
- **Quarterly:** Update dependencies
- **Quarterly:** Rotate API keys
- **As needed:** Review and update RLS policies

---

**Ready for Production!** 🚀

Follow this guide and your application will be live and secure.

