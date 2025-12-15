// Admin function: Delete a product
// Requires admin authentication

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest, isAdmin } from '../_shared/auth.ts';
import { validateUUID } from '../_shared/validation.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'DELETE') {
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
    const productId = url.searchParams.get('id');

    // Validate product ID
    const idError = validateUUID(productId || '', 'id');
    if (idError) {
      return errorResponse(idError, 400);
    }

    const supabase = createAdminClient();

    // Check if product exists
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (fetchError || !existing) {
      return errorResponse('Product not found', 404);
    }

    // Check if product has active plans
    const { data: activePlans } = await supabase
      .from('plans')
      .select('id')
      .eq('product_id', productId)
      .eq('active', true)
      .limit(1);

    if (activePlans && activePlans.length > 0) {
      return errorResponse(
        'Cannot delete product with active plans. Deactivate plans first.',
        409
      );
    }

    // Delete product (CASCADE will delete related plans)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return errorResponse('Failed to delete product', 500, error);
    }

    return jsonResponse(
      {
        message: 'Product deleted successfully',
        deleted_id: productId,
      },
      200
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});


