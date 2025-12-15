'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyPayment } from '@/lib/api/payments';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

/* ---------- Types ---------- */

interface OrderWithPlan {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  created_at: string;
  plans: {
    name: string;
    products: {
      name: string;
    };
  } | null;
}

/* ---------- Helper ---------- */

function requireString(value: string | null, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

/* ---------- Component ---------- */

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState<OrderWithPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const orderId = requireString(
          searchParams.get('order_id'),
          'order_id'
        );

        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        // ✅ verify payment (server-side logic)
        await verifyPayment(orderId, session?.access_token ?? undefined);

        // ✅ load order safely
        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            id,
            status,
            amount,
            currency,
            created_at,
            plans (
              name,
              products (
                name
              )
            )
          `
          )
          .eq('id', orderId)
          .returns<OrderWithPlan[]>();

        if (error || !data || data.length === 0) {
          throw new Error('Order not found');
        }

        if (mounted) {
          setOrder(data[0]);
        }
      } catch (err) {
        console.error('Checkout success error:', err);
        router.replace('/');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [searchParams, router]);

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  /* ---------- Not Found ---------- */

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Order Not Found
          </h1>
          <Link href="/products" className="text-blue-400 hover:text-blue-300">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- State ---------- */

  const isSuccess = order.status === 'completed';
  const isPending = order.status === 'pending';
  const isFailed = order.status === 'failed';

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSuccess && 'Payment Successful!'}
            {isPending && 'Payment Pending'}
            {isFailed && 'Payment Failed'}
          </h1>

          <p className="text-gray-400 mb-8">
            {isSuccess && 'Your subscription has been activated successfully.'}
            {isPending && 'Your payment is being processed.'}
            {isFailed && 'Your payment could not be processed.'}
          </p>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6 text-left mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Order Details
            </h2>

            <dl className="space-y-3">
              <Detail label="Product" value={order.plans?.products?.name} />
              <Detail label="Plan" value={order.plans?.name} />
              <Detail
                label="Amount"
                value={formatCurrency(order.amount)}
              />
              <Detail
                label="Status"
                value={order.status}
                badge
                status={order.status}
              />
              <Detail
                label="Order Date"
                value={formatDate(order.created_at)}
              />
            </dl>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Browse Products
            </Link>
            <Link
              href="/"
              className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessInner />
    </Suspense>
  );
}

/* ---------- Small Component ---------- */

function Detail({
  label,
  value,
  badge,
  status,
}: {
  label: string;
  value?: string;
  badge?: boolean;
  status?: 'pending' | 'completed' | 'failed';
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-white">
        {badge ? (
          <span className="inline-flex rounded-full px-2 text-xs capitalize bg-gray-700">
            {status}
          </span>
        ) : (
          value ?? 'N/A'
        )}
      </dd>
    </div>
  );
}
