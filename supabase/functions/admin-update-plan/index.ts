// Admin function: Update an existing plan
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
  collectErrors,
} from '../_shared/validation.ts';

interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: 'month' | 'year';
  active?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'PUT') {
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

    const url = new URL(req.url);
    const planId = url.searchParams.get('id');

    // Validate plan ID
    const idError = validateUUID(planId || '', 'id');
    if (idError) {
      return errorResponse(idError, 400);
    }

    const body: UpdatePlanRequest = await req.json();

    // Validate input
    const errors = collectErrors(
      body.name ? validateString(body.name, 'name', 1, 255) : null,
      body.description
        ? validateString(body.description, 'description', 0, 5000)
        : null,
      body.price !== undefined
        ? validateNumber(body.price, 'price', 0, 999999.99)
        : null,
      body.currency ? validateString(body.currency, 'currency', 3, 3) : null,
      body.interval
        ? validateEnum(body.interval, 'interval', ['month', 'year'])
        : null,
      body.active !== undefined
        ? validateBoolean(body.active, 'active')
        : null
    );

    if (errors.length > 0) {
      return errorResponse('Validation failed', 400, { errors });
    }

    const supabase = createAdminClient();

    // Check if plan exists
    const { data: existing, error: fetchError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .single();

    if (fetchError || !existing) {
      return errorResponse('Plan not found', 404);
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.interval !== undefined) updateData.interval = body.interval;
    if (body.active !== undefined) updateData.active = body.active;

    // Update plan
    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return errorResponse('Failed to update plan', 500, error);
    }

    return jsonResponse({ plan });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});


