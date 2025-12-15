'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutButton({
  planId,
  planName,
}: {
  planId: string;
  planName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User checkout - redirect to checkout page
        router.push(`/checkout/${planId}`);
      } else {
        // Guest checkout - redirect to guest checkout page
        router.push(`/checkout/guest/${planId}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      {loading ? 'Loading...' : `Subscribe to ${planName}`}
    </button>
  );
}


