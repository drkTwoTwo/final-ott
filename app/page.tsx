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
  stock_quantity: number | null;
  plans: Plan[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredProducts.filter((p) => p.category === category);
    return acc;
  }, {} as Record<string, Product[]>);

  const uncategorizedProducts = filteredProducts.filter((p) => !p.category);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black"></div>
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20 blur-sm"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-4">
              <span className="bg-yellow-500 text-black px-4 py-1 rounded text-sm font-bold">
                HOT DEALS
              </span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl mb-2">
              INSTANT DELIVERY
            </h1>
            <h2 className="text-5xl font-bold tracking-tight text-teal-400 sm:text-6xl mb-8">
              ALL PLATFORMS
            </h2>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all">
              Get Your Subscriptions Instantly
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Q Search products..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Category Icons - Horizontal Scrollable */}
      {categories.length > 0 && (
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => {
                const categoryProducts = productsByCategory[category] || [];
                const categoryCount = categoryProducts.length;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg p-3 flex flex-col items-center justify-center transition-all ${
                      selectedCategory === category
                        ? 'bg-teal-500 scale-105'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <span className={`text-xs font-medium text-center ${
                      selectedCategory === category ? 'text-black' : 'text-gray-300'
                    }`}>
                      {category}
                    </span>
                    <span className={`text-xs mt-1 ${
                      selectedCategory === category ? 'text-black' : 'text-gray-400'
                    }`}>
                      {categoryCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products by Category */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading products...</div>
        ) : (
          <>
            {selectedCategory ? (
              // Show products for selected category
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{selectedCategory}</h2>
                  <span className="text-gray-400">
                    {productsByCategory[selectedCategory]?.length || 0} items
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {productsByCategory[selectedCategory]?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ) : (
              // Show all categories
              <>
                {categories.map((category) => {
                  const categoryProducts = productsByCategory[category] || [];
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category} className="mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">{category}</h2>
                        <span className="text-gray-400">{categoryProducts.length} items</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                        {categoryProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {uncategorizedProducts.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Other</h2>
                      <span className="text-gray-400">{uncategorizedProducts.length} items</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                      {uncategorizedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock_quantity !== null && product.stock_quantity === 0;
  const cheapestPlan = product.plans?.[0];

  // Ensure we use a valid slug or fallback to ID
  const productSlug = product.slug && product.slug.trim() && !product.slug.includes('://') 
    ? product.slug 
    : product.id;

  return (
    <Link
      href={`/products/${productSlug}`}
      className="group flex-shrink-0 w-64"
    >
      <div className="relative rounded-lg bg-gray-900 border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
        {isOutOfStock && (
          <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold py-1 text-center z-10">
            Out of Stock
          </div>
        )}
        <div className="aspect-video w-full overflow-hidden bg-gray-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          {product.category && (
            <span className="text-xs text-gray-400 mb-1 block">{product.category}</span>
          )}
          <h3 className="text-white font-semibold mb-2 line-clamp-1">{product.name}</h3>
          {cheapestPlan && (
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-white font-bold">
                {formatCurrency(cheapestPlan.price)}
              </span>
              <span className="text-gray-400 text-sm">
                /{cheapestPlan.interval === 'month' ? 'mo' : 'yr'}
              </span>
            </div>
          )}
          <button
            disabled={isOutOfStock}
            className={`w-full py-2 rounded-md text-sm font-medium transition-all ${
              isOutOfStock
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
