// Create order with stock validation and decrement
// Supports both authenticated users and guest checkout

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest } from '../_shared/auth.ts';
import {
  validateUUID,
  validateEmail,
  validateNumber,
  validateEnum,
  validateRequired,
  collectErrors,
} from '../_shared/validation.ts';

interface CreateOrderRequest {
  plan_id: string;
  quantity?: number;
  guest_email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { userId, token } = await getUserFromRequest(req);
    const body: CreateOrderRequest = await req.json();

    // Validate input
    const errors = collectErrors(
      validateUUID(body.plan_id, 'plan_id'),
      validateRequired(body.plan_id, 'plan_id')
    );

    // Validate quantity if provided
    if (body.quantity !== undefined) {
      const quantityError = validateNumber(body.quantity, 'quantity', 1, 100);
      if (quantityError) errors.push(quantityError);
    }

    const quantity = body.quantity || 1;

    // Validate email for guest checkout
    if (!userId && !body.guest_email) {
      errors.push('Either user authentication or guest_email is required');
    }

    if (!userId && body.guest_email) {
      const emailError = validateEmail(body.guest_email);
      if (emailError) errors.push(emailError);
    }

    if (errors.length > 0) {
      return errorResponse('Validation failed', 400, { errors });
    }

    const supabase = createAdminClient();

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select(`
        id,
        product_id,
        name,
        price,
        currency,
        interval,
        active,
        products!inner (
          id,
          name,
          stock_quantity
        )
      `)
      .eq('id', body.plan_id)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return errorResponse('Plan not found or inactive', 404);
    }

    const product = plan.products as any;

    // Stock validation
    if (product.stock_quantity !== null) {
      if (product.stock_quantity < quantity) {
        return errorResponse(
          'Insufficient stock',
          400,
          {
            available: product.stock_quantity,
            requested: quantity,
          }
        );
      }
    }

    // Calculate order amount
    const orderAmount = parseFloat(plan.price) * quantity;

    // Create order
    const orderData: any = {
      plan_id: plan.id,
      amount: orderAmount,
      currency: plan.currency,
      status: 'pending',
      quantity,
    };

    if (userId) {
      orderData.user_id = userId;
    } else {
      orderData.guest_email = body.guest_email;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return errorResponse('Failed to create order', 500, orderError);
    }

    // Decrement stock if stock tracking is enabled
    if (product.stock_quantity !== null) {
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stock_quantity: product.stock_quantity - quantity,
        })
        .eq('id', product.id);

      if (stockError) {
        console.error('Error decrementing stock:', stockError);
        // Order was created but stock wasn't decremented
        // In production, you might want to rollback or handle this differently
        return errorResponse(
          'Order created but stock update failed',
          500,
          stockError
        );
      }
    }

    // Create subscription if order is for a subscription plan
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscriptionData: any = {
      plan_id: plan.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    };

    if (userId) {
      subscriptionData.user_id = userId;
    } else {
      subscriptionData.guest_email = body.guest_email;
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    // Update order with subscription_id if subscription was created
    if (subscription && !subError) {
      await supabase
        .from('orders')
        .update({ subscription_id: subscription.id, status: 'completed' })
        .eq('id', order.id);
    }

    return jsonResponse(
      {
        order: {
          ...order,
          subscription_id: subscription?.id || null,
        },
        subscription: subscription || null,
        stock_remaining:
          product.stock_quantity !== null
            ? product.stock_quantity - quantity
            : null,
      },
      201
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

