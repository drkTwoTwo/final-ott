import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import PlanForm from '@/components/admin/PlanForm';

export default async function NewPlanPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/');
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create Plan
        </h1>
        <PlanForm />
      </div>
    </div>
  );
}


