'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/api/payments';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  plans: {
    name: string;
    products: {
      name: string;
    };
  };
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    verifyAndLoadOrder();
  }, [orderId]);

  const verifyAndLoadOrder = async () => {
    try {
      setVerifying(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Verify payment status server-side
      await verifyPayment(orderId!, session?.access_token);

      // Load order details
      type OrderWithPlan = {
        id: string;
        status: 'pending' | 'completed' | 'failed';
        amount: number;
        currency: string;
        created_at: string;
        plans: { name: string; products: { name: string } };
      };

      const { data: orderRows, error } = await supabase
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
        .eq('id', orderId) as { data: OrderWithPlan[] | null; error: unknown };

      const orderData = (orderRows ?? [])[0];

      if (error || !orderData) {
        throw new Error('Order not found');
      }

      setOrder(orderData);
    } catch (error: any) {
      console.error('Error verifying payment:', error);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Order Not Found</h1>
          <Link
            href="/products"
            className="text-blue-400 hover:text-blue-300"
          >
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = order.status === 'completed';
  const isPending = order.status === 'pending';
  const isFailed = order.status === 'failed';

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-8 text-center">
          {isSuccess && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-900/50 border border-green-700 mb-4">
              <svg
                className="h-6 w-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          )}

          {isPending && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-900/50 border border-yellow-700 mb-4">
              <svg
                className="h-6 w-6 text-yellow-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}

          {isFailed && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50 border border-red-700 mb-4">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {isSuccess && 'Payment Successful!'}
            {isPending && 'Payment Pending'}
            {isFailed && 'Payment Failed'}
          </h1>

          <p className="text-gray-400 mb-8">
            {isSuccess && 'Your subscription has been activated successfully.'}
            {isPending && 'Your payment is being processed. Please wait for confirmation.'}
            {isFailed && 'Your payment could not be processed. Please try again.'}
          </p>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6 text-left mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Order Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Product</dt>
                <dd className="text-sm font-medium text-white">
                  {order.plans?.products?.name || 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Plan</dt>
                <dd className="text-sm font-medium text-white">
                  {order.plans?.name || 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Amount</dt>
                <dd className="text-sm font-medium text-white">
                  {formatCurrency(order.amount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Status</dt>
                <dd className="text-sm font-medium">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold capitalize ${
                      isSuccess
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : isPending
                        ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                        : 'bg-red-900/50 text-red-300 border border-red-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Order Date</dt>
                <dd className="text-sm font-medium text-white">
                  {formatDate(order.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex justify-center gap-4">
            {isSuccess && (
              <>
                <Link
                  href="/products"
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
                >
                  Browse More Products
                </Link>
                <Link
                  href="/"
                  className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Go Home
                </Link>
              </>
            )}
            {(isPending || isFailed) && (
              <>
                <Link
                  href={`/products/${orderId}`}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
                >
                  Try Again
                </Link>
                <Link
                  href="/products"
                  className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Browse Products
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

