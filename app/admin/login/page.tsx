import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/AdminLoginForm';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin');
  return (
    <section className="admin-login-page">
      <AdminLoginForm />
    </section>
  );
}
