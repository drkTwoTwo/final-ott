import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ProductFormWithUpload from '@/components/admin/ProductFormWithUpload';

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  slug: string | null;
  image_url: string | null;
  active: boolean;
  stock_quantity: number | null;
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/');
  }

  const supabase = await createClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('id', id) as { data: Product[] | null };

  const product = (products ?? [])[0];

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Edit Product
        </h1>
        <ProductFormWithUpload product={product} />
      </div>
    </div>
  );
}

