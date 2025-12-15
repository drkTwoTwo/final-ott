import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import ProductFormWithUpload from '@/components/admin/ProductFormWithUpload';

export default async function NewProductPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Create Product
        </h1>
        <ProductFormWithUpload />
      </div>
    </div>
  );
}
