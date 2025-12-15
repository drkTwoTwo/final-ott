'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createPayment } from '@/lib/api/payments';
import { formatCurrency } from '@/lib/utils';
import { validateEmail, validatePhoneNumber, sanitizePhoneNumber } from '@/lib/validation';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string | null;
  category: string | null;
  plans: Plan[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlanAndProduct();
    loadUserData();
  }, [planId]);

  const loadUserData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      setEmail(user.email);
    }
  };

  const loadPlanAndProduct = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get plan details
      type PlanWithProduct = {
        id: string;
        name: string;
        description: string | null;
        price: number;
        currency: string;
        interval: 'month' | 'year';
        active: boolean;
        product_id: string;
        products: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          slug: string | null;
          category: string | null;
        };
      };

      type PlanSummary = {
        id: string;
        name: string;
        description: string | null;
        price: number;
        currency: string;
        interval: 'month' | 'year';
        active: boolean;
      };

      const { data: planRows, error: planError } = await supabase
        .from('plans')
        .select(`
          id,
          name,
          description,
          price,
          currency,
          interval,
          active,
          product_id,
          products!inner (
            id,
            name,
            description,
            image_url,
            slug,
            category
          )
        `)
        .eq('id', planId)
        .eq('active', true) as { data: PlanWithProduct[] | null; error: unknown };

      const planData = (planRows ?? [])[0];

      if (planError || !planData) {
        throw new Error('Plan not found');
      }

      const plan = planData as any;
      const productData = plan.products;

      // Get all plans for this product
      const { data: allPlans } = await supabase
        .from('plans')
        .select('id, name, description, price, currency, interval, active')
        .eq('product_id', productData.id)
        .eq('active', true)
        .order('price', { ascending: true }) as { data: PlanSummary[] | null };

      setProduct({
        ...productData,
        plans: allPlans ?? [],
      });

      // Set selected plan (the one user clicked)
      setSelectedPlan({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        active: plan.active,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Create payment via Edge Function
      const payment = await createPayment({
        plan_id: selectedPlan.id,
        quantity: 1,
        guest_email: session ? undefined : email,
        phone_number: sanitizePhoneNumber(phoneNumber),
        success_url: `${window.location.origin}/checkout/success?order_id={ORDER_ID}`,
        cancel_url: `${window.location.origin}/checkout/${planId}`,
        token: session?.access_token,
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
      const errorMessage = err.message || err.error || 'Failed to initiate payment. Please try again.';
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product || !selectedPlan) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Plan Not Found</h1>
          <Link href="/products" className="text-blue-400 hover:text-blue-300">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/products/${product.slug || product.id}`}
          className="inline-flex items-center text-gray-400 hover:text-white mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Link>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Product Display */}
            <div className="flex gap-6 mb-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 text-xs">No Image</span>
                  </div>
                )}
                {product.category && (
                  <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    {product.category}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                {product.description && (
                  <p className="text-gray-400">{product.description}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Choose Your Plan */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Choose Your Plan</h2>
                <div className="space-y-3">
                  {product.plans.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    const isOutOfStock = false; // Add stock check if needed

                    return (
                      <label
                        key={plan.id}
                        className={`block relative cursor-pointer ${
                          isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={isSelected}
                          onChange={() => setSelectedPlan(plan)}
                          disabled={isOutOfStock}
                          className="sr-only"
                        />
                        <div
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-900/20'
                              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                          } ${isOutOfStock ? 'border-red-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              )}
                              <div>
                                <div className="text-white font-medium">{plan.name}</div>
                                {plan.description && (
                                  <div className="text-sm text-gray-400 mt-1">
                                    {plan.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">
                                {formatCurrency(plan.price)}
                              </div>
                              {isOutOfStock && (
                                <span className="text-xs text-red-400">Out of Stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Contact Details</h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Delivery Within 20 Minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>24/7 Customer Support</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Secure Payment via XtraGate</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="sticky top-8">
              <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Selected Plan</span>
                    <span className="text-white font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(selectedPlan.price)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !phoneNumber || !email}
                  className="w-full rounded-md bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
