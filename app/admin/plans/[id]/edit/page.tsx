import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PlanForm from '@/components/admin/PlanForm';
import type { Database } from '@/types/database.types';

type PlanRow = Database['public']['Tables']['plans']['Row'];

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

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single<PlanRow>();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Plan
        </h1>
        <PlanForm plan={data} />
      </div>
    </div>
  );
}
