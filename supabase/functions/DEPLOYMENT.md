# Edge Functions Deployment Guide

## Quick Start

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Deploy all functions**:
   ```bash
   supabase functions deploy
   ```

4. **Or deploy individually**:
   ```bash
   supabase functions deploy get-products-with-plans
   supabase functions deploy get-product-by-slug
   supabase functions deploy create-order
   supabase functions deploy admin-create-product
   supabase functions deploy admin-update-product
   supabase functions deploy admin-delete-product
   supabase functions deploy admin-create-plan
   supabase functions deploy admin-update-plan
   supabase functions deploy admin-get-orders
   ```

## Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (used by admin functions)

These are automatically set by Supabase and don't need manual configuration.

## Testing

### Using cURL

**Public Functions:**
```bash
# Get products with plans
curl https://your-project.supabase.co/functions/v1/get-products-with-plans

# Get product by slug
curl "https://your-project.supabase.co/functions/v1/get-product-by-slug?slug=netflix"
```

**Create Order (Guest):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "plan-uuid-here",
    "quantity": 1,
    "guest_email": "guest@example.com"
  }'
```

**Create Order (Authenticated):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plan_id": "plan-uuid-here",
    "quantity": 1
  }'
```

**Admin Functions:**
```bash
# Create Product
curl -X POST https://your-project.supabase.co/functions/v1/admin-create-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Netflix",
    "description": "Streaming service",
    "slug": "netflix",
    "active": true
  }'
```

## Local Development

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Serve functions locally**:
   ```bash
   supabase functions serve
   ```

3. **Test locally**:
   ```bash
   curl http://localhost:54321/functions/v1/get-products-with-plans
   ```

## Important Notes

1. **Database Schema**: Make sure you've run both migration files:
   - `001_complete_schema.sql`
   - `002_add_slug_and_stock.sql`

2. **Admin Access**: Admin functions verify that the authenticated user has `role = 'admin'` in the `profiles` table.

3. **Stock Management**: Stock is decremented atomically when orders are created. If stock tracking is disabled (stock_quantity is NULL), stock checks are skipped.

4. **CORS**: All functions include CORS headers for cross-origin requests.

## Function Endpoints

Base URL: `https://your-project.supabase.co/functions/v1/`

- `GET /get-products-with-plans` - Public
- `GET /get-product-by-slug?slug=xxx` - Public
- `POST /create-order` - Public (guest checkout supported)
- `POST /admin-create-product` - Admin only
- `PUT /admin-update-product?id=xxx` - Admin only
- `DELETE /admin-delete-product?id=xxx` - Admin only
- `POST /admin-create-plan` - Admin only
- `PUT /admin-update-plan?id=xxx` - Admin only
- `GET /admin-get-orders?status=xxx&limit=50&offset=0` - Admin only

