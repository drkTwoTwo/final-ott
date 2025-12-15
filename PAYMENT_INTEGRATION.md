# xtragateway.site Payment Integration

## Overview

Complete server-side payment integration with xtragateway.site. All payment logic is handled in Supabase Edge Functions for full server-side trust.

## Architecture

### Components

1. **Frontend (`app/products/[slug]/page.tsx`)**
   - Initiates payment via Edge Function
   - Redirects user to payment URL

2. **Edge Function: `create-payment`**
   - Validates order request
   - Creates order record (status: pending)
   - Calls xtragateway.site API
   - Returns payment URL

3. **xtragateway.site**
   - Processes payment
   - Redirects user
   - Sends webhook

4. **Edge Function: `xtragateway-webhook`**
   - Receives payment confirmation directly inside Supabase
   - Maps provider status → order status
   - Creates subscription and decrements stock on completion

5. **Edge Function: `verify-payment`**
   - Server-side payment verification
   - Can be called manually if webhook fails

6. **Success Page (`app/checkout/success/page.tsx`)**
   - Verifies payment server-side
   - Shows appropriate status

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:
```env
XTRAGATEWAY_API_KEY=your_api_key_from_xtragateway
XTRAGATEWAY_WEBHOOK_SECRET=your_webhook_secret_optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Set Supabase Edge Function secrets:
```bash
supabase secrets set \
  XTRAGATEWAY_API_KEY=your_api_key \
  XTRAGATEWAY_SITE_URL=https://xtragateway.site \
  XTRAGATEWAY_WEBHOOK_URL=https://<project-ref>.functions.supabase.co/xtragateway-webhook \
  XTRAGATEWAY_WEBHOOK_SECRET=optional_shared_secret
```

### 2. Deploy Functions

```bash
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy xtragateway-webhook
```

### 3. Configure Webhook

In xtragateway.site dashboard:
- Webhook URL: `https://<project-ref>.functions.supabase.co/xtragateway-webhook`
- Events: payment.completed, payment.failed, payment.pending

### 4. Adjust API Endpoints

**⚠️ IMPORTANT:** The actual xtragateway.site API endpoints and payload structure may differ. Please check their documentation and update:

- `supabase/functions/create-payment/index.ts` - Payment creation API call
- `supabase/functions/verify-payment/index.ts` - Payment verification API call
- `supabase/functions/xtragateway-webhook/index.ts` - Webhook payload structure

Common adjustments needed:
- API endpoint URLs
- Request/response field names
- Authentication method (Bearer token, API key in header, etc.)
- Webhook payload structure
- Status value mappings

## Payment Flow

```
1. User clicks "Subscribe" on product page
   ↓
2. Frontend calls create-payment Edge Function
   ↓
3. Edge Function:
   - Validates plan and stock
   - Creates order (status: pending)
   - Calls xtragateway.site API
   ↓
4. User redirected to xtragateway.site payment page
   ↓
5. User completes payment
   ↓
6. xtragateway.site:
   - Processes payment
   - Sends webhook to Supabase Edge Function `/xtragateway-webhook`
   - Redirects user to success_url
   ↓
7. Webhook handler:
   - Verifies payment
   - Updates order status
   - If completed:
     * Creates subscription
     * Decrements stock
   ↓
8. User lands on success page
   ↓
9. Success page:
   - Calls verify-payment Edge Function
   - Shows order status
```

## Order Status Flow

- **pending**: Order created, payment initiated
- **completed**: Payment verified, subscription created, stock decremented
- **failed**: Payment failed or cancelled

## Security Features

✅ **Server-Side Only**: All payment logic in Edge Functions/API routes
✅ **No Client Trust**: Frontend only initiates and redirects
✅ **Webhook Verification**: Can verify webhook signatures
✅ **Order Status Updates**: Only after server-side verification
✅ **Idempotency**: Prevents duplicate subscriptions on retries
✅ **Stock Validation**: Validated before order creation
✅ **Stock Decrement**: Only after payment confirmation

## Error Handling

### Failed Payments
- Order status set to 'failed'
- Stock not decremented
- Subscription not created
- User can retry

### Pending Payments
- Order remains 'pending'
- User can return to success page
- Success page verifies status
- Webhook will update when payment completes

### Network Errors
- Order created but payment may fail
- Webhook handles late confirmations
- Manual verification available via verify-payment

## Testing

### Test Scenarios

1. **Successful Payment**
   - Create payment
   - Complete payment
   - Verify webhook received
   - Check order status = completed
   - Verify subscription created
   - Verify stock decremented

2. **Failed Payment**
   - Create payment
   - Cancel payment
   - Verify order status = failed
   - Verify stock not decremented
   - Verify subscription not created

3. **Pending Payment**
   - Create payment
   - Don't complete immediately
   - Verify order status = pending
   - Complete payment later
   - Verify webhook updates status

4. **Webhook Retry**
   - Call verify-payment function
   - Verify status updates correctly

## API Reference

### create-payment Edge Function

**Endpoint:** `POST /functions/v1/create-payment`

**Request:**
```json
{
  "plan_id": "uuid",
  "quantity": 1,
  "guest_email": "guest@example.com",
  "success_url": "https://your-domain.com/checkout/success?order_id={ORDER_ID}",
  "cancel_url": "https://your-domain.com/products/slug"
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "payment_url": "https://xtragateway.site/pay/...",
  "payment_id": "payment_id_from_xtragateway"
}
```

### verify-payment Edge Function

**Endpoint:** `POST /functions/v1/verify-payment`

**Request:**
```json
{
  "order_id": "uuid"
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "status": "completed",
  "payment_status": "paid",
  "verified": true
}
```

### Webhook Endpoint

**Endpoint:** `POST /api/webhooks/xtragateway`

Receives callbacks from xtragateway.site when payment status changes.

## Customization Notes

The implementation uses placeholder API endpoints and payload structures. You'll need to:

1. **Check xtragateway.site Documentation**
   - Actual API endpoints
   - Request/response formats
   - Authentication method
   - Webhook payload structure

2. **Update Code Accordingly**
   - `create-payment/index.ts` - Payment creation API
   - `verify-payment/index.ts` - Payment verification API
   - `api/webhooks/xtragateway/route.ts` - Webhook payload parsing

3. **Test Thoroughly**
   - All payment scenarios
   - Error cases
   - Webhook delivery
   - Edge cases

## Support

For issues:
1. Check Supabase Edge Function logs
2. Check Next.js API route logs
3. Verify webhook is receiving callbacks
4. Test payment verification manually
5. Review xtragateway.site dashboard for payment status


