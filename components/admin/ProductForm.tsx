'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

interface ProductFormProps {
  product?: ProductRow;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [active, setActive] = useState(product?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error('Product name is required');
      }

      const insertPayload: ProductInsert = {
        name,
        description: description || null,
        image_url: imageUrl || null,
        active,
      };

      const updatePayload: ProductUpdate = insertPayload;

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(insertPayload);

        if (error) throw error;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mt-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
          />
        </div>

        {/* IMAGE */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* ACTIVE */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">
            Active (visible to customers)
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </Link>
          <button
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
