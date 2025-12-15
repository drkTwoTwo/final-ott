// Admin function: Create a new plan
// Requires admin authentication

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest, isAdmin } from '../_shared/auth.ts';
import {
  validateUUID,
  validateString,
  validateNumber,
  validateEnum,
  validateBoolean,
  validateRequired,
  collectErrors,
} from '../_shared/validation.ts';

interface CreatePlanRequest {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval: 'month' | 'year';
  active?: boolean;
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
    const { userId } = await getUserFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    // Check admin access
    const admin = await isAdmin(userId);
    if (!admin) {
      return errorResponse('Admin access required', 403);
    }

    const body: CreatePlanRequest = await req.json();

    // Validate input
    const errors = collectErrors(
      validateRequired(body.product_id, 'product_id'),
      validateUUID(body.product_id, 'product_id'),
      validateRequired(body.name, 'name'),
      validateString(body.name, 'name', 1, 255),
      body.description
        ? validateString(body.description, 'description', 0, 5000)
        : null,
      validateRequired(body.price, 'price'),
      validateNumber(body.price, 'price', 0, 999999.99),
      body.currency ? validateString(body.currency, 'currency', 3, 3) : null,
      validateRequired(body.interval, 'interval'),
      validateEnum(body.interval, 'interval', ['month', 'year']),
      body.active !== undefined
        ? validateBoolean(body.active, 'active')
        : null
    );

    if (errors.length > 0) {
      return errorResponse('Validation failed', 400, { errors });
    }

    const supabase = createAdminClient();

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', body.product_id)
      .single();

    if (productError || !product) {
      return errorResponse('Product not found', 404);
    }

    // Create plan
    const planData: any = {
      product_id: body.product_id,
      name: body.name,
      description: body.description || null,
      price: body.price,
      currency: body.currency || 'INR',
      interval: body.interval,
      active: body.active !== undefined ? body.active : true,
    };

    const { data: plan, error } = await supabase
      .from('plans')
      .insert(planData)
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return errorResponse('Failed to create plan', 500, error);
    }

    return jsonResponse({ plan }, 201);
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

