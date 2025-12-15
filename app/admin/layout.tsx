import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import AdminNavbar from '@/components/admin/AdminNavbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't check auth on login page - middleware handles it
  // This layout is only applied to routes under /admin that aren't /admin/login
  
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      <main>{children}</main>
    </div>
  );
}

