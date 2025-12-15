import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminDashboard() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/');
  }

  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, active, created_at')
    .order('created_at', { ascending: false });

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, price, currency, active, created_at')
    .order('created_at', { ascending: false });

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage products, plans, and orders
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-400">Total Products</h3>
            <p className="mt-2 text-3xl font-bold text-white">
              {products?.length || 0}
            </p>
            <Link
              href="/admin/products"
              className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Manage products →
            </Link>
          </div>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-400">Total Plans</h3>
            <p className="mt-2 text-3xl font-bold text-white">
              {plans?.length || 0}
            </p>
            <Link
              href="/admin/plans"
              className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Manage plans →
            </Link>
          </div>

          <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">
            <h3 className="text-sm font-medium text-gray-400">Recent Orders</h3>
            <p className="mt-2 text-3xl font-bold text-white">
              {subscriptions?.length || 0}
            </p>
            <Link
              href="/admin/orders"
              className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-lg bg-gray-800 border border-gray-700">
            <div className="border-b border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin/products/new"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Create Product
                </Link>
                <Link
                  href="/admin/plans/new"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  Create Plan
                </Link>
                <Link
                  href="/admin/orders"
                  className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
                >
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

