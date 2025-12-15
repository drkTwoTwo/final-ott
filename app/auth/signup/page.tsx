import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignUpForm from '@/components/auth/SignUpForm';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.redirect || '/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>
        <SignUpForm redirect={searchParams.redirect} />
      </div>
    </div>
  );
}


