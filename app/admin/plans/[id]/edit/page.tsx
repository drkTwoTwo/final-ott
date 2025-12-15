import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PlanForm from '@/components/admin/PlanForm';

type Plan = {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  active: boolean;
};

export default async function EditPlanPage({
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
  
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id) as { data: Plan[] | null };

  const plan = (plans ?? [])[0];

  if (!plan) {
    notFound();
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Plan
        </h1>
        <PlanForm plan={plan} />
      </div>
    </div>
  );
}


