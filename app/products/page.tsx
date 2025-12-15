'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProductsWithPlans } from '@/lib/api/edge-functions';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string | null;
  category: string | null;
  active: boolean;
  plans: Plan[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await getProductsWithPlans();
      const allProducts = result.products || [];
      setProducts(allProducts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allProducts.map((p: Product) => p.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      const errorMessage = error.message || 'Failed to load products. Please check your connection and try again.';
      
      // Check if it's a deployment issue
      if (errorMessage.includes('not be deployed') || errorMessage.includes('Failed to connect')) {
        console.error('⚠️ Edge Function deployment issue. Deploy functions using: supabase functions deploy get-products-with-plans');
      }
      
      // Set error state to show to users (optional - you can add error state if needed)
      // setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            All Products
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Choose a subscription plan that works for you
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <button
                onClick={() => setSelectedCategory('')}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'bg-white text-black'
                    : 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-400">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 transition-transform hover:scale-[1.01] hover:border-gray-700">
                  {product.image_url ? (
                    <div className="aspect-video w-full overflow-hidden bg-gray-800 flex items-center justify-center p-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition-opacity group-hover:opacity-80"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">No Image</span>
                    </div>
                  )}
                  <div className="p-3 sm:p-6">
                    <h3 className="text-[13px] sm:text-xl font-semibold text-white mb-1.5 sm:mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-[11px] sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3 mb-2.5 sm:mb-4">
                        {product.description}
                      </p>
                    )}
                    {product.plans && product.plans.length > 0 && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-3xl font-bold text-white">
                          {formatCurrency(product.plans[0].price)}
                        </span>
                        <span className="text-[11px] sm:text-sm text-gray-400">
                          /{product.plans[0].interval}
                        </span>
                      </div>
                    )}
                    <div className="mt-2.5 sm:mt-4 text-[11px] sm:text-sm font-medium text-blue-400 group-hover:text-blue-300">
                      View plans →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
