// Public function: Get a single product by slug with its plans
// No authentication required

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAnonClient } from '../_shared/supabase.ts';
import { validateString } from '../_shared/validation.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get('slug');

    // Validate slug
    const slugError = validateString(slug, 'slug', 1, 255);
    if (slugError) {
      return errorResponse(slugError, 400);
    }

    // Sanitize slug - remove protocol, www, and clean up
    if (slug) {
      slug = slug
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const supabase = createAnonClient();

    // Get product by slug
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, description, image_url, slug, category, active, created_at')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (productError) {
      if (productError.code === 'PGRST116') {
        // Not found
        return errorResponse('Product not found', 404);
      }
      console.error('Error fetching product:', productError);
      return errorResponse('Failed to fetch product', 500, productError);
    }

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Get active plans for this product
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name, description, price, currency, interval, active')
      .eq('product_id', product.id)
      .eq('active', true)
      .order('price', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return errorResponse('Failed to fetch plans', 500, plansError);
    }

    return jsonResponse({
      product: {
        ...product,
        plans: plans || [],
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

