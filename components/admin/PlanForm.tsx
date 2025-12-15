'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Database } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];
type PlanUpdate = Database['public']['Tables']['plans']['Update'];

type ProductRow = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'name'
>;

interface PlanFormProps {
  plan?: PlanRow;
}

export default function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productId, setProductId] = useState<string>(plan?.product_id ?? '');
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [price, setPrice] = useState(
    plan ? String(plan.price) : ''
  );

  const currency = 'INR';
  const [interval, setInterval] = useState<'month' | 'year'>(
    plan?.interval ?? 'month'
  );
  const [active, setActive] = useState<boolean>(plan?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- FETCH PRODUCTS ---------------- */

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name')
        .returns<ProductRow[]>();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setProducts(data);

        if (!plan && data.length > 0) {
          setProductId(data[0].id);
        }
      }
    };

    fetchProducts();
  }, [supabase, plan]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new Error('Price must be a positive number');
      }

      if (!productId) {
        throw new Error('Product is required');
      }

      const payload: PlanInsert = {
        product_id: productId,
        name,
        description: description || null,
        price: priceNum,
        currency,
        interval,
        active,
      };

      if (plan) {
        const { error } = await supabase
          .from('plans')
          .update(payload as never)
          .eq('id', plan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(payload as never);

        if (error) throw error;
      }

      router.push('/admin/plans');
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

        {/* PRODUCT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product *
          </label>
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={!!plan}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-gray-900 shadow-sm disabled:bg-gray-50"
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Plan Name *
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

        {/* PRICE + INTERVAL */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Interval *
            </label>
            <select
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value as 'month' | 'year')
              }
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
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
            Active
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/plans"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </Link>
          <button
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving…' : plan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
