import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GuestCheckoutForm from '@/components/checkout/GuestCheckoutForm';

type PlanWithProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  product_id: string;
  products: { id: string; name: string };
};

export default async function GuestCheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  const supabase = await createClient();
  
  const { data: plans } = await supabase
    .from('plans')
    .select(
      `
      id,
      name,
      description,
      price,
      currency,
      interval,
      product_id,
      products (
        id,
        name
      )
    `
    )
    .eq('id', planId)
    .eq('active', true) as { data: PlanWithProduct[] | null };

  const plan = (plans ?? [])[0];

  if (!plan) {
    notFound();
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Guest Checkout
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          No account required. Complete your purchase with just your email.
        </p>
        <GuestCheckoutForm plan={plan} />
      </div>
    </div>
  );
}


