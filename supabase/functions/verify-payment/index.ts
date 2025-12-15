// @ts-nocheck
// Verify payment status with xtragateway.site (official check-order-status API)

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { validateRequired } from '../_shared/validation.ts';

const XTRAGATEWAY_API_KEY = Deno.env.get('XTRAGATEWAY_API_KEY') || '';
const XTRAGATEWAY_SITE_URL = 'https://xtragateway.site';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    if (!XTRAGATEWAY_API_KEY) {
      return errorResponse('Payment gateway not configured', 500);
    }

    const body = await req.json();
    const { payment_id, order_id } = body;

    if (!payment_id && !order_id) {
      return errorResponse('payment_id or order_id is required', 400);
    }

    const supabase = createAdminClient();

    // Find order by id or provider id
    let order;
    if (order_id) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      if (error || !data) return errorResponse('Order not found', 404);
      order = data;
    } else {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_provider_id', payment_id)
        .single();
      if (error || !data) return errorResponse('Order not found', 404);
      order = data;
    }

    const providerOrderId = order.payment_provider_id || order.id;

    // Call official check-order-status (form-encoded)
    const formData = new URLSearchParams();
    formData.append('user_token', XTRAGATEWAY_API_KEY);
    formData.append('order_id', providerOrderId);

    const verifyResponse = await fetch(
      `${XTRAGATEWAY_SITE_URL}/api/check-order-status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }
    );

    let result: any;
    try {
      result = await verifyResponse.json();
    } catch {
      result = { message: 'Invalid JSON from gateway' };
    }

    if (!verifyResponse.ok) {
      return errorResponse('Failed to verify payment', 502, result);
    }

    const providerStatus =
      result?.status ||
      result?.result?.status ||
      result?.result?.txnStatus ||
      'UNKNOWN';

    let newStatus = order.status;
    if (
      providerStatus === 'COMPLETED' ||
      providerStatus === 'SUCCESS' ||
      providerStatus === 'paid' ||
      providerStatus === 'completed'
    ) {
      newStatus = 'completed';
    } else if (
      providerStatus === 'FAILED' ||
      providerStatus === 'ERROR' ||
      providerStatus === 'failed' ||
      providerStatus === 'cancelled'
    ) {
      newStatus = 'failed';
    } else if (
      providerStatus === 'PENDING' ||
      providerStatus === 'pending' ||
      providerStatus === 'PROCESSING'
    ) {
      newStatus = 'pending';
    }

    // Update order status
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);

    // If payment completed, create subscription and decrement stock
    if (newStatus === 'completed' && order.status !== 'completed') {
      const { data: plan } = await supabase
        .from('plans')
        .select('interval, products!inner (id, stock_quantity)')
        .eq('id', order.plan_id)
        .single();

      if (plan) {
        const product = plan.products as any;
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1);
        else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        const subscriptionData: any = {
          plan_id: order.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        };
        if (order.user_id) subscriptionData.user_id = order.user_id;
        else subscriptionData.guest_email = order.guest_email;

        const { data: subscription } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (subscription) {
          await supabase
            .from('orders')
            .update({ subscription_id: subscription.id })
            .eq('id', order.id);
        }

        if (product.stock_quantity !== null) {
          const newStock = product.stock_quantity - (order.quantity || 1);
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', product.id);
        }
      }
    }

    return jsonResponse({
      order_id: order.id,
      status: newStatus,
      provider_status: providerStatus,
      verified: true,
      raw: result,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});


