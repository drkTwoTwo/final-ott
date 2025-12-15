import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

export default async function AdminNavbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-xl font-bold text-white">
              Admin Panel
            </Link>
            <div className="hidden md:flex md:space-x-4">
              <Link
                href="/admin"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Orders
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white"
              target="_blank"
            >
              View Site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

