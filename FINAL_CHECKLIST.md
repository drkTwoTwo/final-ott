# Pre-Launch Checklist

Complete checklist before deploying to production.

## Database Setup ✅

- [ ] Run migration `001_complete_schema.sql`
- [ ] Run migration `002_add_slug_and_stock.sql`
- [ ] Run migration `003_add_category.sql`
- [ ] Run migration `004_add_phone_to_orders.sql`
- [ ] Verify all tables created
- [ ] Verify RLS is enabled on all tables
- [ ] Verify indexes are created
- [ ] Create admin user (update profile role)

## Supabase Storage ✅

- [ ] Create `product-images` bucket
- [ ] Set bucket to public
- [ ] Configure bucket policies
- [ ] Test image upload
- [ ] Verify image URLs work

## Edge Functions ✅

- [ ] Deploy `create-payment`
- [ ] Deploy `verify-payment`
- [ ] Deploy `get-products-with-plans`
- [ ] Deploy `get-product-by-slug`
- [ ] Deploy `admin-create-product`
- [ ] Deploy `admin-update-product`
- [ ] Deploy `admin-delete-product`
- [ ] Deploy `admin-create-plan`
- [ ] Deploy `admin-update-plan`
- [ ] Deploy `admin-get-orders`
- [ ] Set `XTRAGATEWAY_API_KEY` secret
- [ ] Test all functions

## Environment Variables ✅

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-side only)
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] `XTRAGATEWAY_API_KEY` set
- [ ] `XTRAGATEWAY_WEBHOOK_SECRET` set (if provided)
- [ ] All variables verified in production environment

## Payment Integration ✅

- [ ] xtragateway.site account configured
- [ ] API key obtained and set
- [ ] Webhook URL configured in xtragateway.site dashboard
- [ ] Webhook secret set (if provided)
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives callbacks
- [ ] Test payment success scenario
- [ ] Test payment failure scenario
- [ ] Test payment pending scenario

## Security ✅

- [ ] All admin routes protected by middleware
- [ ] RLS policies verified
- [ ] Input validation on all forms
- [ ] Edge Functions validate all inputs
- [ ] No sensitive data in client-side code
- [ ] Service role key never exposed
- [ ] Error messages don't leak sensitive info
- [ ] Webhook signature verification (if available)

## Functionality Testing ✅

### Public Pages
- [ ] Homepage loads and displays products
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Product detail page loads
- [ ] Plan selection works
- [ ] "Buy Now" button works

### Checkout Flow
- [ ] Checkout page loads with plan details
- [ ] Plan selection (radio buttons) works
- [ ] Phone number validation works
- [ ] Email validation works
- [ ] Order summary displays correctly
- [ ] "Proceed to Checkout" button works
- [ ] Payment redirect works
- [ ] Success page verifies payment
- [ ] Guest checkout works
- [ ] Authenticated checkout works

### Admin Panel
- [ ] Admin login works
- [ ] Admin dashboard displays
- [ ] Product creation works
- [ ] Product editing works
- [ ] Product deletion works (with validation)
- [ ] Plan creation works
- [ ] Plan editing works
- [ ] Image upload works
- [ ] Orders list displays
- [ ] Order filtering works

### Payment Processing
- [ ] Order created with pending status
- [ ] Payment URL generated
- [ ] User redirected to payment
- [ ] Webhook receives payment callback
- [ ] Order status updates correctly
- [ ] Subscription created on payment success
- [ ] Stock decrements on payment success
- [ ] Failed payments handled correctly
- [ ] Pending payments handled correctly

## Performance ✅

- [ ] Homepage loads quickly
- [ ] Product images optimized
- [ ] Database queries optimized
- [ ] Edge Functions respond quickly
- [ ] No unnecessary re-renders
- [ ] Proper loading states
- [ ] Error boundaries in place

## UI/UX ✅

- [ ] Dark theme consistent
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Loading states display
- [ ] Error messages clear
- [ ] Success messages clear
- [ ] Navigation works
- [ ] Links work correctly
- [ ] Forms validate properly

## Error Handling ✅

- [ ] Network errors handled
- [ ] API errors handled
- [ ] Validation errors displayed
- [ ] Payment errors handled
- [ ] Database errors handled
- [ ] User-friendly error messages
- [ ] Error logging works

## Documentation ✅

- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Deployment steps documented
- [ ] API documentation available
- [ ] Security notes documented

## Pre-Launch Tasks ✅

- [ ] Remove all test data
- [ ] Remove console.log statements (or keep for production logging)
- [ ] Verify no hardcoded values
- [ ] Test with production Supabase project
- [ ] Test with production payment provider
- [ ] Verify all URLs are production URLs
- [ ] Check CORS settings
- [ ] Verify redirect URLs in Supabase Auth

## Post-Launch Monitoring ✅

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics
- [ ] Monitor payment success rate
- [ ] Monitor order completion rate
- [ ] Set up alerts for errors
- [ ] Monitor database performance
- [ ] Monitor Edge Function performance

## Backup & Recovery ✅

- [ ] Database backups enabled
- [ ] Backup schedule configured
- [ ] Recovery plan documented
- [ ] Environment variables backed up securely
- [ ] Code repository backed up

## Final Steps ✅

- [ ] Run `npm run build` successfully
- [ ] Fix all linting errors
- [ ] Test complete user journey
- [ ] Test complete admin journey
- [ ] Verify all features work
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Test production environment
- [ ] Monitor for 24 hours
- [ ] Document any issues

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Deploy Edge Functions
supabase functions deploy
```

---

**Status:** Ready for production deployment! 🚀

Complete all checklist items before launching.

