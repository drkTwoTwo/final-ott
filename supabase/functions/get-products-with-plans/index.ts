// Public function: Get all active products with their plans
// No authentication required

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAnonClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabase = createAnonClient();

    // Get active products with their active plans
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        image_url,
        slug,
        category,
        active,
        created_at
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return errorResponse('Failed to fetch products', 500, productsError);
    }

    if (!products || products.length === 0) {
      return jsonResponse({ products: [] });
    }

    // Get plans for each product
    const productIds = products.map((p) => p.id);
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select(`
        id,
        product_id,
        name,
        description,
        price,
        currency,
        interval,
        active
      `)
      .in('product_id', productIds)
      .eq('active', true)
      .order('price', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return errorResponse('Failed to fetch plans', 500, plansError);
    }

    // Group plans by product
    const productsWithPlans = products.map((product) => ({
      ...product,
      plans: plans?.filter((plan) => plan.product_id === product.id) || [],
    }));

    return jsonResponse({
      products: productsWithPlans,
      count: productsWithPlans.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

