// Admin function: Create a new product
// Requires admin authentication

import { corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { getUserFromRequest, isAdmin } from '../_shared/auth.ts';
import {
  validateString,
  validateBoolean,
  validateNumber,
  validateRequired,
  collectErrors,
} from '../_shared/validation.ts';

interface CreateProductRequest {
  name: string;
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

    const body: CreateProductRequest = await req.json();

    // Validate input
    const errors = collectErrors(
      validateRequired(body.name, 'name'),
      validateString(body.name, 'name', 1, 255),
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

    // Sanitize slug if provided
    let finalSlug = body.slug ? body.slug.trim() : null;
    if (finalSlug) {
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
    }
    
    // Generate slug from name if not provided
    if (!finalSlug && body.name) {
      finalSlug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Check if slug is unique (if provided)
    if (finalSlug) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (existing) {
        return errorResponse('Product with this slug already exists', 409);
      }
    }

    // Create product
    const productData: any = {
      name: body.name,
      description: body.description || null,
      image_url: body.image_url || null,
      slug: finalSlug,
      category: body.category || null,
      active: body.active !== undefined ? body.active : true,
      stock_quantity: body.stock_quantity !== undefined ? body.stock_quantity : null,
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return errorResponse('Failed to create product', 500, error);
    }

    return jsonResponse({ product }, 201);
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

