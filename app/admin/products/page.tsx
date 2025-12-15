import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminProductsPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select(
      'id, name, description, category, active, image_url, created_at, updated_at'
    )
    .order('created_at', { ascending: false }) as {
      data: Product[] | null;
    };

  const safeProducts: Product[] = products ?? [];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Products
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Manage your product catalog
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create Product
          </Link>
        </div>

        {/* Empty State */}
        {safeProducts.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-12 text-center">
            <p className="text-gray-400">No products found.</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300"
            >
              Create your first product →
            </Link>
          </div>
        ) : (
          /* Table */
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {safeProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-700" />
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-300">
                      {product.category ?? '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-300">
                      {product.description ? (
                        <span className="line-clamp-1">
                          {product.description}
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          No description
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          product.active
                            ? 'border border-green-700 bg-green-900/50 text-green-300'
                            : 'border border-gray-600 bg-gray-700 text-gray-400'
                        }`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </Link>
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
