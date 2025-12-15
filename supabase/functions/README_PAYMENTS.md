# Payment Integration with xtragateway.site

## Overview

This implementation provides secure server-side payment processing using xtragateway.site as the payment provider. All payment logic lives in Supabase Edge Functions, ensuring no client-side trust.

## Architecture

1. **Frontend**: Initiates payment and redirects to payment URL
2. **Edge Function (`create-payment`)**: Creates order and payment intent
3. **xtragateway.site**: Processes payment
4. **Webhook (`/api/webhooks/xtragateway`)**: Receives payment confirmation
5. **Edge Function (`verify-payment`)**: Server-side payment verification

## Flow

```
User clicks "Subscribe"
    ↓
Frontend calls create-payment Edge Function
    ↓
Edge Function creates order (status: pending)
    ↓
Edge Function calls xtragateway.site API
    ↓
User redirected to xtragateway.site payment page
    ↓
User completes payment
    ↓
xtragateway.site sends webhook to /api/webhooks/xtragateway
    ↓
Webhook verifies payment and updates order status
    ↓
If completed: Creates subscription, decrements stock
    ↓
User redirected back to success page
    ↓
Success page verifies payment server-side
```

## Setup

### 1. Environment Variables

Add to your `.env.local`:
```env
XTRAGATEWAY_API_KEY=your_api_key_here
XTRAGATEWAY_WEBHOOK_SECRET=your_webhook_secret_here (optional)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Add to Supabase Edge Function secrets:
```bash
supabase secrets set XTRAGATEWAY_API_KEY=your_api_key_here
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy create-payment
supabase functions deploy verify-payment
```

### 3. Configure Webhook URL

In your xtragateway.site dashboard, set the webhook URL to:
```
https://your-domain.com/api/webhooks/xtragateway
```

### 4. Update Orders Table

Make sure the `orders` table has these fields:
- `payment_provider` (TEXT)
- `payment_provider_id` (TEXT)
- `status` (TEXT with values: pending, completed, failed, refunded)

## API Endpoints

### Create Payment

**Edge Function:** `create-payment`

**Request:**
```json
{
  "plan_id": "uuid",
  "quantity": 1,
  "guest_email": "guest@example.com", // optional if authenticated
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

### Verify Payment

**Edge Function:** `verify-payment`

**Request:**
```json
{
  "order_id": "uuid" // or "payment_id": "payment_id"
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

### Webhook

**Endpoint:** `POST /api/webhooks/xtragateway`

Handles payment callbacks from xtragateway.site. Expected payload structure:
```json
{
  "event": "payment.completed",
  "data": {
    "payment_id": "...",
    "status": "paid",
    "metadata": {
      "order_id": "..."
    }
  }
}
```

*Note: Adjust field names based on actual xtragateway.site webhook format*

## Security Features

1. **Server-Side Only**: All payment logic in Edge Functions
2. **No Client Trust**: Frontend only initiates and redirects
3. **Webhook Verification**: Can verify webhook signatures (if provided)
4. **Order Status Updates**: Only after server-side verification
5. **Idempotency**: Prevents duplicate subscriptions on retries

## Payment Status Flow

- **pending**: Initial state when order created
- **completed**: Payment verified, subscription created, stock decremented
- **failed**: Payment failed or cancelled

## Handling Edge Cases

### Pending Payments
- User can return to success page
- Success page verifies payment status
- Shows appropriate message

### Failed Payments
- Order status set to 'failed'
- Stock not decremented
- Subscription not created
- User can retry

### Webhook Failures
- Manual verification via `verify-payment` function
- Admin can verify payments from admin panel

## Testing

1. **Test Payment Flow:**
   - Create order with test payment
   - Verify webhook receives callback
   - Check order status updates
   - Verify subscription created

2. **Test Verification:**
   - Call verify-payment function
   - Check status updates correctly

3. **Test Error Cases:**
   - Invalid plan_id
   - Insufficient stock
   - Failed payment
   - Network errors

## Notes

- Adjust API endpoint URLs based on actual xtragateway.site documentation
- Update webhook payload structure based on actual format
- Add signature verification if xtragateway.site provides it
- Consider adding retry logic for failed webhooks
- Add logging for debugging payment issues


