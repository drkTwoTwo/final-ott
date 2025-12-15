// Admin function: Update an existing product
// Requires admin authentication

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest, isAdmin } from '../_shared/auth.ts';
import {
  validateUUID,
  validateString,
  validateBoolean,
  validateNumber,
  collectErrors,
} from '../_shared/validation.ts';

interface UpdateProductRequest {
  name?: string;
  description?: string;
  image_url?: string;
  slug?: string;
  category?: string;
  active?: boolean;
  stock_quantity?: number | null;
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
    const productId = url.searchParams.get('id');

    // Validate product ID
    const idError = validateUUID(productId || '', 'id');
    if (idError) {
      return errorResponse(idError, 400);
    }

    const body: UpdateProductRequest = await req.json();

    // Validate input
    const errors = collectErrors(
      body.name ? validateString(body.name, 'name', 1, 255) : null,
      body.description
        ? validateString(body.description, 'description', 0, 5000)
        : null,
      body.image_url ? validateString(body.image_url, 'image_url', 0, 2048) : null,
      body.slug ? validateString(body.slug, 'slug', 1, 255) : null,
      body.category ? validateString(body.category, 'category', 0, 100) : null,
      body.active !== undefined
        ? validateBoolean(body.active, 'active')
        : null,
      body.stock_quantity !== undefined && body.stock_quantity !== null
        ? validateNumber(body.stock_quantity, 'stock_quantity', 0)
        : null
    );

    if (errors.length > 0) {
      return errorResponse('Validation failed', 400, { errors });
    }

    const supabase = createAdminClient();

    // Check if product exists
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (fetchError || !existing) {
      return errorResponse('Product not found', 404);
    }

    // Sanitize slug if being updated
    let finalSlug = body.slug !== undefined ? (body.slug ? body.slug.trim() : null) : undefined;
    if (finalSlug !== undefined && finalSlug) {
      // Remove protocol, www, and sanitize
      finalSlug = finalSlug
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (!finalSlug) {
        finalSlug = null; // If slug becomes empty after sanitization, set to null
      }
      
      // Check if slug is unique
      if (finalSlug) {
        const { data: slugConflict } = await supabase
          .from('products')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', productId)
          .single();

        if (slugConflict) {
          return errorResponse('Product with this slug already exists', 409);
        }
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (finalSlug !== undefined) updateData.slug = finalSlug;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.stock_quantity !== undefined) updateData.stock_quantity = body.stock_quantity;

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return errorResponse('Failed to update product', 500, error);
    }

    return jsonResponse({ product });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

