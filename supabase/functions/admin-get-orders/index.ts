// Admin function: Get all orders with filters
// Requires admin authentication

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest, isAdmin } from '../_shared/auth.ts';
import { validateEnum, validateNumber } from '../_shared/validation.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'GET') {
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
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate filters
    if (status) {
      const statusError = validateEnum(
        status,
        'status',
        ['pending', 'completed', 'failed', 'refunded']
      );
      if (statusError) {
        return errorResponse(statusError, 400);
      }
    }

    const limitError = validateNumber(limit, 'limit', 1, 100);
    const offsetError = validateNumber(offset, 'offset', 0);
    if (limitError || offsetError) {
      return errorResponse('Invalid pagination parameters', 400);
    }

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('orders')
      .select(
        `
        id,
        subscription_id,
        user_id,
        plan_id,
        amount,
        currency,
        status,
        payment_provider,
        payment_provider_id,
        guest_email,
        created_at,
        updated_at,
        plans (
          id,
          name,
          price,
          currency,
          interval,
          products (
            id,
            name
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return errorResponse('Failed to fetch orders', 500, error);
    }

    return jsonResponse({
      orders: orders || [],
      count: count || 0,
      limit,
      offset,
      has_more: count ? offset + limit < count : false,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});


