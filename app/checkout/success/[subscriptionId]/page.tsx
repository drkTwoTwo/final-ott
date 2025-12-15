import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const { subscriptionId } = await params;

  const supabase = await createClient();
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      status,
      current_period_start,
      current_period_end,
      guest_email,
      plans (
        id,
        name,
        price,
        currency,
        interval,
        products (
          id,
          name
        )
      )
    `
    )
    .eq('id', subscriptionId)
    .single();

  if (!subscription) {
    notFound();
  }

  const plan = subscription.plans as any;
  const product = plan.products;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
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
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Subscription Successful!
          </h1>
          <p className="mt-2 text-gray-600">
            Your subscription has been activated successfully.
          </p>

          <div className="mt-8 rounded-lg bg-gray-50 p-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900">
              Subscription Details
            </h2>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Product</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {product.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Plan</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {plan.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="text-sm font-medium capitalize text-green-600">
                  {subscription.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Current Period</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatDate(subscription.current_period_start)} -{' '}
                  {formatDate(subscription.current_period_end)}
                </dd>
              </div>
              {subscription.guest_email && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Email</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {subscription.guest_email}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Browse More Products
            </Link>
            <Link
              href="/"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


