'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/api/edge-functions';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string | null;
  category: string | null;
  stock_quantity: number | null;
  plans: Plan[];
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  active: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [params.slug]);

  const loadProduct = async () => {
    try {
      let slug = params.slug as string;
      
      // Sanitize slug - remove any protocol or invalid characters
      slug = slug.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      // Check if it's a UUID (old ID format) or invalid slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      if (isUUID) {
        // Fallback: redirect to products page if using old ID format
        window.location.href = '/products';
        return;
      }

      // Validate slug format (should be alphanumeric with hyphens)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        console.error('Invalid slug format:', slug);
        // Try to find product by cleaning the slug
        slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      }

      const result = await getProductBySlug(slug);
      if (!result.product) {
        throw new Error('Product not found');
      }
      setProduct(result.product);
    } catch (error: any) {
      console.error('Failed to load product:', error);
      const errorMessage = error.message || 'Failed to load product. Please check your connection and try again.';
      console.error('Error details:', errorMessage);
      // Error handled by loading state - product will be null and show not found
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Product not found</div>
      </div>
    );
  }

  const isInStock = product.stock_quantity == null || product.stock_quantity > 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            {product.image_url ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-gray-600">No Image</span>
              </div>
            )}
          </div>

          <div className="mt-10 lg:mt-0">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              {product.name}
            </h1>
            {product.category && (
              <span className="mt-2 inline-block rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
                {product.category}
              </span>
            )}
            {product.description && (
              <p className="mt-6 text-lg text-gray-400">{product.description}</p>
            )}

            {!isInStock && (
              <div className="mt-6 rounded-md bg-red-900/50 border border-red-700 p-4">
                <p className="text-sm text-red-200">Out of Stock</p>
              </div>
            )}

            {product.stock_quantity !== null && isInStock && (
              <p className="mt-4 text-sm text-gray-400">
                {product.stock_quantity} remaining
              </p>
            )}

            {product.plans && product.plans.length > 0 ? (
              <div className="mt-8 space-y-4">
                <h2 className="text-2xl font-semibold text-white">Choose Your Plan</h2>
                {product.plans.map((plan) => {
                  const isOutOfStock = false; // Add stock check per plan if needed
                  
                  return (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-gray-800 bg-gray-900 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                          {plan.description && (
                            <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                          )}
                          <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-bold text-white">
                              {formatCurrency(plan.price)}
                            </span>
                            <span className="ml-2 text-sm text-gray-400">
                              / {plan.interval}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Link
                          href={`/checkout/${plan.id}`}
                          className={`block w-full rounded-md px-4 py-3 text-sm font-semibold text-center shadow-sm transition-all ${
                            isOutOfStock
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-md bg-yellow-900/50 border border-yellow-700 p-4">
                <p className="text-sm text-yellow-200">
                  No active plans available for this product.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

