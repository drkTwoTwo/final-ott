'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadProductImage, deleteProductImage } from '@/lib/storage';
import { adminCreateProduct, adminUpdateProduct } from '@/lib/api/edge-functions';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  slug: string | null;
  active: boolean;
  stock_quantity: number | null;
}

export default function ProductFormWithUpload({ product }: { product?: Product }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [active, setActive] = useState(product?.active ?? true);
  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity?.toString() || ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(imageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      let finalImageUrl = imageUrl;

      // Upload new image if selected
      if (imageFile) {
        if (product && imageUrl) {
          // Delete old image
          await deleteProductImage(imageUrl);
        }
        finalImageUrl = await uploadProductImage(
          imageFile,
          product?.id || 'new'
        );
      }

      // Generate slug from name if not provided, and sanitize it
      let finalSlug = slug.trim();
      if (!finalSlug) {
        // Auto-generate slug from product name
        finalSlug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
      } else {
        // Sanitize provided slug
        finalSlug = finalSlug
          .toLowerCase()
          .trim()
          .replace(/^https?:\/\//, '') // Remove protocol
          .replace(/^www\./, '') // Remove www
          .replace(/[^a-z0-9-]/g, '-') // Replace special chars with hyphens
          .replace(/-+/g, '-') // Remove multiple hyphens
          .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      }

      const productData: any = {
        name,
        description: description || null,
        category: category || null,
        slug: finalSlug || null,
        image_url: finalImageUrl || null,
        active,
        stock_quantity: stockQuantity ? parseInt(stockQuantity) : null,
      };

      if (product) {
        // Update existing product via Edge Function
        try {
          const result = await adminUpdateProduct(
            product.id,
            productData,
            session.access_token
          );
          if (!result) {
            throw new Error('Failed to update product');
          }
        } catch (err: any) {
          const status = err?.status;
          if (status === 404) {
            const { error: updateError } = await supabase
              .from('products')
              .update(productData)
              .eq('id', product.id);

            if (updateError) {
              throw updateError;
            }
          } else {
            throw err;
          }
        }
      } else {
        // Create new product via Edge Function
        try {
          const result = await adminCreateProduct(productData, session.access_token);
          if (!result || !result.product) {
            throw new Error('Failed to create product');
          }
        } catch (err: any) {
          const status = err?.status;
          if (status === 404) {
            const { error: insertError } = await supabase
              .from('products')
              .insert(productData);

            if (insertError) {
              throw insertError;
            }
          } else {
            throw err;
          }
        }
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error('Product save error:', err);
      console.error('Error details:', {
        message: err.message,
        error: err.error,
        status: err.status,
        details: err.details,
      });
      
      let errorMessage = 'An error occurred while saving the product';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.details?.errors) {
        errorMessage = `Validation errors: ${err.details.errors.join(', ')}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg bg-gray-800 border border-gray-700 p-6"
      >
        {error && (
          <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300"
            >
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-300"
            >
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => {
                // Sanitize slug: remove protocol, special chars, convert to lowercase with hyphens
                let value = e.target.value.toLowerCase().trim();
                // Remove http://, https://, www.
                value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
                // Replace spaces and special chars with hyphens
                value = value.replace(/[^a-z0-9-]/g, '-');
                // Remove multiple consecutive hyphens
                value = value.replace(/-+/g, '-');
                // Remove leading/trailing hyphens
                value = value.replace(/^-+|-+$/g, '');
                setSlug(value);
              }}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="product-slug (auto-generated from name if empty)"
            />
            <p className="mt-1 text-xs text-gray-400">
              Leave empty to auto-generate from product name. Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-300"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Streaming, Sports, Movies, etc."
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-300"
          >
            Product Image
          </label>
          {imagePreview && (
            <div className="mt-2 mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-32 w-32 object-cover rounded-md"
              />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="stockQuantity"
            className="block text-sm font-medium text-gray-300"
          >
            Stock Quantity (leave empty for unlimited)
          </label>
          <input
            type="number"
            id="stockQuantity"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            id="active"
            name="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-300">
            Active (visible to customers)
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

