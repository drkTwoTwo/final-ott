// @ts-nocheck
// Supabase Edge Function — Create Payment (Xtragateway official API)

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import {
  validateUUID,
  validateNumber,
  validateEmail,
  validatePhoneNumber,
  validateString,
  validateRequired,
  collectErrors,
} from '../_shared/validation.ts';

const XTRAGATEWAY_API_KEY = Deno.env.get('XTRAGATEWAY_API_KEY') ?? '';
const XTRAGATEWAY_SITE_URL = 'https://xtragateway.site';
const XTRAGATEWAY_REDIRECT_URL =
  Deno.env.get('XTRAGATEWAY_REDIRECT_URL') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    if (!XTRAGATEWAY_API_KEY) {
      return errorResponse('Payment gateway not configured', 500);
    }

    const supabase = createAdminClient();
    const { userId } = await getUserFromRequest(req);
    const body = await req.json();

    const errors = collectErrors(
      validateRequired(body.plan_id, 'plan_id'),
      validateUUID(body.plan_id, 'plan_id'),
      validateNumber(body.quantity ?? 1, 'quantity', 1, 100),
      validateRequired(body.phone_number, 'phone_number'),
      validatePhoneNumber(body.phone_number || '', 'phone_number'),
      !userId ? validateRequired(body.guest_email, 'guest_email') : null,
      !userId && body.guest_email ? validateEmail(body.guest_email) : null,
      validateRequired(body.success_url, 'success_url'),
      validateString(body.success_url, 'success_url', 1, 2048),
      validateRequired(body.cancel_url, 'cancel_url'),
      validateString(body.cancel_url, 'cancel_url', 1, 2048)
    );

    if (errors.length > 0) {
      return errorResponse('Validation failed', 400, { errors });
    }

    const quantity = body.quantity ?? 1;
    const sanitizedPhone = body.phone_number.replace(/\D/g, '');

    // Fetch plan with product for remarks and stock
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select(
        `
        id,
        price,
        currency,
        interval,
        active,
        products!inner (
          id,
          name,
          stock_quantity
        )
      `
      )
      .eq('id', body.plan_id)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return errorResponse('Plan not found or inactive', 404);
    }

    const product = plan.products as any;

    // Stock validation
    if (product.stock_quantity !== null && product.stock_quantity < quantity) {
      return errorResponse('Insufficient stock', 400, {
        available: product.stock_quantity,
        requested: quantity,
      });
    }

    const amount = (Number(plan.price) * quantity).toFixed(2);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        plan_id: plan.id,
        amount,
        currency: plan.currency,
        status: 'pending',
        quantity,
        user_id: userId ?? null,
        guest_email: userId ? null : body.guest_email,
        payment_provider: 'xtragateway',
        phone_number: sanitizedPhone,
      })
      .select()
      .single();

    if (orderError) {
      return errorResponse('Failed to create order', 500, orderError);
    }

    const rawSuccessUrl = String(body.success_url || '').trim();
    let redirectUrl = rawSuccessUrl;

    if (redirectUrl.includes('{ORDER_ID}')) {
      redirectUrl = redirectUrl.replaceAll('{ORDER_ID}', order.id);
    } else {
      const joiner = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl = `${redirectUrl}${joiner}order_id=${encodeURIComponent(order.id)}`;
    }

    if (!redirectUrl && XTRAGATEWAY_REDIRECT_URL) {
      redirectUrl = XTRAGATEWAY_REDIRECT_URL;
    }

    if (!redirectUrl) {
      return errorResponse('Redirect URL not configured', 500, {
        action: 'Provide success_url in request or set XTRAGATEWAY_REDIRECT_URL in Supabase secrets',
      });
    }

    // Xtragateway official create-order (form-encoded)
    const formData = new URLSearchParams();
    formData.append('customer_mobile', sanitizedPhone);
    formData.append('user_token', XTRAGATEWAY_API_KEY);
    formData.append('amount', amount);
    formData.append('order_id', order.id); // use our order id to keep linkage
    formData.append('redirect_url', redirectUrl);
    formData.append('remark1', product.name || 'order');
    formData.append('remark2', plan.id);

    const gatewayResponse = await fetch(
      `${XTRAGATEWAY_SITE_URL}/api/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    let result: any;
    try {
      result = await gatewayResponse.json();
    } catch (e) {
      result = { message: 'Invalid JSON from gateway' };
    }

    const okStatus =
      gatewayResponse.ok &&
      (result?.status === true ||
        result?.status === 'true' ||
        result?.status === 'SUCCESS' ||
        result?.status === 'COMPLETED');

    if (!okStatus) {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
      return errorResponse(result?.message || 'Payment gateway error', 502, result);
    }

    const providerOrderId = result?.result?.orderId || order.id;

    await supabase
      .from('orders')
      .update({
        payment_provider_id: providerOrderId,
      })
      .eq('id', order.id);

    return jsonResponse(
      {
        order_id: order.id,
        payment_url: result?.result?.payment_url,
        payment_id: providerOrderId,
      },
      201
    );
  } catch (err) {
    console.error(err);
    return errorResponse('Internal server error', 500);
  }
});
