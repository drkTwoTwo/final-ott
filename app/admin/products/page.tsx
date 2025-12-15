import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminProductsPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/login');
  }

  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, category, active, image_url, created_at, updated_at')
    .order('created_at', { ascending: false });

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Product
          </Link>
        </div>

        {!products || products.length === 0 ? (
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-12 text-center">
            <p className="text-gray-400">No products found.</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300"
            >
              Create your first product →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-750">
                    <td className="whitespace-nowrap px-6 py-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-700 rounded"></div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {product.description ? (
                        <span className="line-clamp-1">{product.description}</span>
                      ) : (
                        <span className="text-gray-500">No description</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          product.active
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
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
