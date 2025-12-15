# Production Deployment Guide

Complete guide for deploying the OTT Marketplace to production.

## Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.local` with all required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Payment Provider (xtragateway.site)
XTRAGATEWAY_API_KEY=your_api_key
XTRAGATEWAY_WEBHOOK_SECRET=your_webhook_secret
```

**⚠️ Security Notes:**
- Never commit `.env.local` to git
- `SUPABASE_SERVICE_ROLE_KEY` must be kept secret
- Use different keys for production and staging

### 2. Database Setup

#### Run Migrations in Order:

1. **001_complete_schema.sql** - Base schema with all tables
2. **002_add_slug_and_stock.sql** - Add slug and stock fields
3. **003_add_category.sql** - Add category field
4. **004_add_phone_to_orders.sql** - Add phone number to orders

**Steps:**
```sql
-- In Supabase SQL Editor, run each migration file in order
-- Verify each migration completes successfully before proceeding
```

#### Create Admin User:

```sql
-- After user signs up, set admin role:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
```

### 3. Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create bucket: `product-images`
3. Set bucket to **Public**
4. Configure policies:
   - Public read access
   - Authenticated write access (for admin uploads)

### 4. Supabase Edge Functions

#### Deploy All Functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set XTRAGATEWAY_API_KEY=your_key

# Deploy functions
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

### 5. Webhook Configuration

In xtragateway.site dashboard:
- Webhook URL: `https://your-domain.com/api/webhooks/xtragateway`
- Events: payment.completed, payment.failed, payment.pending
- Add webhook secret if provided

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Push code to GitHub/GitLab
   git push origin main
   ```

2. **Import Project in Vercel:**
   - Go to vercel.com
   - Import your repository
   - Configure environment variables

3. **Set Environment Variables:**
   - Add all variables from `.env.local`
   - Mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive

4. **Deploy:**
   - Vercel will auto-deploy on push
   - Or trigger manual deployment

### Option 2: Self-Hosted

1. **Build Application:**
   ```bash
   npm run build
   ```

2. **Start Production Server:**
   ```bash
   npm start
   ```

3. **Use Process Manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "ott-marketplace" -- start
   pm2 save
   pm2 startup
   ```

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

## Security Hardening

### 1. Row Level Security (RLS)

Verify all tables have RLS enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. API Security

- ✅ All Edge Functions validate inputs
- ✅ Admin functions require authentication
- ✅ Service role key only used server-side
- ✅ No sensitive data in client-side code

### 3. Environment Variables

- ✅ Never expose service role key
- ✅ Use different keys for staging/production
- ✅ Rotate keys periodically

### 4. Input Validation

- ✅ All forms validate on client and server
- ✅ Edge Functions validate all inputs
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React escapes by default)

## Performance Optimizations

### 1. Next.js Optimizations

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-supabase-storage-url'],
  },
  // Enable static optimization where possible
  experimental: {
    optimizeCss: true,
  },
};
```

### 2. Database Indexes

All critical indexes are created in migrations:
- Products: active, created_at, slug, category
- Plans: product_id, active, price
- Orders: user_id, guest_email, status, payment_provider_id
- Subscriptions: user_id, plan_id, status

### 3. Edge Functions

- Use connection pooling
- Cache frequently accessed data
- Minimize database queries

### 4. Image Optimization

- Use Next.js Image component
- Compress images before upload
- Use CDN for static assets

## Monitoring & Logging

### 1. Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics

### 2. Database Monitoring

- Monitor Supabase dashboard for:
  - Query performance
  - Connection pool usage
  - Storage usage

### 3. Edge Function Logs

```bash
# View function logs
supabase functions logs create-payment
```

## Testing Checklist

### Before Launch:

- [ ] All migrations run successfully
- [ ] Admin user created and can access admin panel
- [ ] Products can be created/updated/deleted
- [ ] Plans can be created/updated
- [ ] Public can view products and plans
- [ ] Guest checkout works
- [ ] Authenticated checkout works
- [ ] Payment flow works end-to-end
- [ ] Webhook receives callbacks
- [ ] Order status updates correctly
- [ ] Stock decrements on payment
- [ ] Subscriptions created on payment
- [ ] Image upload works
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Mobile responsive design
- [ ] Error handling works
- [ ] Loading states display correctly

## Post-Deployment

### 1. Verify Functionality

- Test complete user flow
- Test admin panel
- Test payment processing
- Monitor error logs

### 2. Set Up Monitoring

- Configure alerts for errors
- Monitor payment success rate
- Track order completion rate

### 3. Backup Strategy

- Enable Supabase daily backups
- Export database schema
- Backup environment variables securely

## Troubleshooting

### Common Issues:

1. **Edge Functions not deploying:**
   - Check Supabase CLI is linked
   - Verify secrets are set
   - Check function logs

2. **RLS blocking queries:**
   - Verify policies are correct
   - Check user authentication
   - Review policy conditions

3. **Payment webhook not working:**
   - Verify webhook URL is correct
   - Check webhook secret
   - Review webhook logs

4. **Images not loading:**
   - Verify storage bucket is public
   - Check CORS settings
   - Verify image URLs

## Rollback Plan

If issues occur:

1. **Database Rollback:**
   - Restore from backup
   - Or manually revert migrations

2. **Code Rollback:**
   - Revert to previous git commit
   - Redeploy previous version

3. **Edge Functions:**
   - Redeploy previous function versions
   - Or disable functions temporarily

## Support & Maintenance

### Regular Tasks:

- Monitor error logs weekly
- Review payment success rates
- Update dependencies monthly
- Rotate API keys quarterly
- Review and update RLS policies as needed

## Production URLs

After deployment, update:
- `NEXT_PUBLIC_APP_URL` in environment variables
- Webhook URLs in payment provider dashboard
- CORS settings in Supabase
- Redirect URLs in Supabase Auth settings

---

**Ready for Production!** 🚀

Follow this guide step-by-step and your application will be production-ready.

