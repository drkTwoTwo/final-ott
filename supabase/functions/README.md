# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the OTT marketplace.

## Setup

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Set up environment secrets (service role key is automatically available):
   ```bash
   # Secrets are automatically loaded from Supabase project
   ```

## Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy get-products-with-plans
```

## Function List

### Public Functions

#### `get-products-with-plans`
- **Method**: GET
- **Auth**: None required
- **Description**: Returns all active products with their active plans
- **Usage**: `GET /functions/v1/get-products-with-plans`

#### `get-product-by-slug`
- **Method**: GET
- **Auth**: None required
- **Params**: `?slug=product-slug`
- **Description**: Returns a single product by slug with its plans
- **Usage**: `GET /functions/v1/get-product-by-slug?slug=netflix`

### Order Functions

#### `create-order`
- **Method**: POST
- **Auth**: Optional (supports guest checkout)
- **Body**:
  ```json
  {
    "plan_id": "uuid",
    "quantity": 1,
    "guest_email": "guest@example.com" // Required if not authenticated
  }
  ```
- **Description**: Creates an order with stock validation and decrement. Also creates a subscription.
- **Usage**: `POST /functions/v1/create-order`
- **Features**:
  - Stock validation before order creation
  - Automatic stock decrement
  - Subscription creation
  - Supports both authenticated users and guest checkout

### Admin Functions

All admin functions require:
- Bearer token in Authorization header
- User must have `role = 'admin'` in profiles table

#### `admin-create-product`
- **Method**: POST
- **Auth**: Admin required
- **Body**:
  ```json
  {
    "name": "Product Name",
    "description": "Description",
    "image_url": "https://...",
    "slug": "product-slug",
    "active": true,
    "stock_quantity": 100
  }
  ```

#### `admin-update-product`
- **Method**: PUT
- **Auth**: Admin required
- **Params**: `?id=product-uuid`
- **Body**: Partial product object (any fields to update)

#### `admin-delete-product`
- **Method**: DELETE
- **Auth**: Admin required
- **Params**: `?id=product-uuid`
- **Note**: Prevents deletion if product has active plans

#### `admin-create-plan`
- **Method**: POST
- **Auth**: Admin required
- **Body**:
  ```json
  {
    "product_id": "uuid",
    "name": "Plan Name",
    "description": "Description",
    "price": 9.99,
    "currency": "USD",
    "interval": "month",
    "active": true
  }
  ```

#### `admin-update-plan`
- **Method**: PUT
- **Auth**: Admin required
- **Params**: `?id=plan-uuid`
- **Body**: Partial plan object (any fields to update)

#### `admin-get-orders`
- **Method**: GET
- **Auth**: Admin required
- **Params**: 
  - `?status=pending|completed|failed|refunded` (optional)
  - `?limit=50` (optional, default: 50, max: 100)
  - `?offset=0` (optional, default: 0)
- **Description**: Returns paginated list of orders with plan and product details

## Testing Locally

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Serve functions locally:
   ```bash
   supabase functions serve
   ```

3. Test a function:
   ```bash
   curl http://localhost:54321/functions/v1/get-products-with-plans
   ```

## Error Handling

All functions return consistent error responses:
```json
{
  "error": "Error message",
  "details": { /* additional error details */ }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (e.g., duplicate slug)
- `500` - Internal Server Error

## Security Notes

1. **Service Role Key**: Admin functions use the service role key which bypasses RLS. Always verify admin status before using it.

2. **Input Validation**: All inputs are validated before processing.

3. **Stock Management**: Stock is decremented atomically when orders are created.

4. **CORS**: All functions include CORS headers for cross-origin requests.

