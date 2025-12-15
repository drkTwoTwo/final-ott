'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminGetOrders } from '@/lib/api/edge-functions';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Order {
  id: string;
  subscription_id: string | null;
  user_id: string | null;
  plan_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
  guest_email: string | null;
  created_at: string;
  plans: {
    name: string;
    products: {
      name: string;
    };
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const result = await adminGetOrders(session.access_token, {
        status: statusFilter || undefined,
        limit: 100,
      });

      setOrders(result.orders || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      const errorMessage = err.message || err.error || 'Failed to load orders. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Orders</h1>
          <p className="mt-2 text-sm text-gray-400">
            View and manage all customer orders
          </p>
        </div>

        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 border border-red-700 p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-12 text-center">
            <p className="text-gray-400">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Product / Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-white">
                        {order.plans?.products?.name || 'N/A'}
                      </div>
                      <div className="text-gray-400">{order.plans?.name || 'N/A'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold capitalize ${
                          order.status === 'completed'
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : order.status === 'pending'
                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                            : order.status === 'failed'
                            ? 'bg-red-900/50 text-red-300 border border-red-700'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {order.guest_email || 'User account'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

