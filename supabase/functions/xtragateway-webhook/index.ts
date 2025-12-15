// @ts-nocheck

// Webhook handler for xtragateway.site callbacks (Supabase Edge Function)

import {
  corsResponse,
  jsonResponse,
  errorResponse,
} from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';

const XTRAGATEWAY_WEBHOOK_SECRET =
  Deno.env.get('XTRAGATEWAY_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method === 'GET') {
    // Allow provider to verify endpoint availability
    return jsonResponse({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-xtragateway-signature') ||
      req.headers.get('x-signature') ||
      '';

    if (XTRAGATEWAY_WEBHOOK_SECRET) {
      // TODO: Implement signature verification per xtragateway.site docs
      // Example placeholder:
      // const isValid = verifySignature(rawBody, signature, XTRAGATEWAY_WEBHOOK_SECRET);
      // if (!isValid) return errorResponse('Invalid signature', 401);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Invalid webhook JSON', parseError);
      return errorResponse('Invalid JSON payload', 400);
    }

    const event = payload?.event;
    const data = payload?.data || payload;

    const paymentId = data?.payment_id || data?.id || data?.transaction_id;
    const paymentStatus = data?.status || data?.payment_status || event;
    const orderIdFromMetadata = data?.metadata?.order_id || data?.order_id;

    if (!paymentId) {
      return errorResponse('Missing payment_id', 400);
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, plans!inner (interval, products!inner (id, stock_quantity))')
      .eq('payment_provider_id', paymentId)
      .single();

    if (orderError || !order) {
      console.error('Webhook: order not found for payment', paymentId, orderError);
      return errorResponse('Order not found', 404);
    }

    let newOrderStatus = order.status;
    if (
      paymentStatus === 'paid' ||
      paymentStatus === 'completed' ||
      paymentStatus === 'success'
    ) {
      newOrderStatus = 'completed';
    } else if (
      paymentStatus === 'failed' ||
      paymentStatus === 'cancelled' ||
      paymentStatus === 'canceled'
    ) {
      newOrderStatus = 'failed';
    } else if (paymentStatus === 'pending' || paymentStatus === 'processing') {
      newOrderStatus = 'pending';
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newOrderStatus })
      .eq('id', order.id);

    if (updateError) {
      console.error('Webhook: failed to update order status', updateError);
      return errorResponse('Failed to update order status', 500);
    }

    if (newOrderStatus === 'completed' && order.status !== 'completed') {
      const plan = order.plans as any;
      const product = plan.products as any;

      const now = new Date();
      const periodEnd = new Date(now);
      if (plan.interval === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const subscriptionData: any = {
        plan_id: order.plan_id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      };

      if (order.user_id) {
        subscriptionData.user_id = order.user_id;
      } else {
        subscriptionData.guest_email = order.guest_email;
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        console.error('Webhook: failed to create subscription', subscriptionError);
      } else if (subscription) {
        await supabase
          .from('orders')
          .update({ subscription_id: subscription.id })
          .eq('id', order.id);
      }

      if (product.stock_quantity !== null) {
        const newStock = product.stock_quantity - (order.quantity || 1);
        if (newStock >= 0) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', product.id);

          if (stockError) {
            console.error('Webhook: failed to decrement stock', stockError);
          }
        } else {
          console.error('Webhook: stock would go negative, skipping decrement');
        }
      }
    }

    return jsonResponse({
      success: true,
      order_id: order.id,
      status: newOrderStatus,
      payment_id: paymentId,
      provider_order_id: orderIdFromMetadata || null,
    });
  } catch (error) {
    console.error('Webhook error', error);
    return errorResponse('Webhook processing failed', 500);
  }
});

