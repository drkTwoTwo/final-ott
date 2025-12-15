'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { createPayment } from '@/lib/api/payments';
import { validateEmail, validatePhoneNumber, sanitizePhoneNumber } from '@/lib/validation';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  products: {
    id: string;
    name: string;
  };
}

export default function CheckoutForm({
  plan,
  userEmail,
}: {
  plan: Plan;
  userEmail: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!userEmail || !validateEmail(userEmail)) {
      setError('Please ensure your account has a valid email address');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create payment via Edge Function
      const payment = await createPayment({
        plan_id: plan.id,
        quantity: 1,
        phone_number: sanitizePhoneNumber(phoneNumber),
        success_url: `${window.location.origin}/checkout/success?order_id={ORDER_ID}`,
        cancel_url: `${window.location.origin}/checkout/${plan.id}`,
        token: session.access_token,
      });

      // Redirect to payment URL
      if (payment.payment_url) {
        window.location.href = payment.payment_url;
      } else {
        // If no payment URL, redirect to success page
        router.push(`/checkout/success?order_id=${payment.order_id}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || err.error || 'An error occurred during checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{plan.products.name}</p>
                <p className="text-sm text-gray-600">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(plan.price, plan.currency)}
                </p>
                <p className="text-sm text-gray-600">per {plan.interval}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-900">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(plan.price, plan.currency)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Using your account email
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="10-digit phone number"
              maxLength={15}
            />
            <p className="mt-1 text-xs text-gray-500">
              Required for order confirmation
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

