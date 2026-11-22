import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminUsers from '@/components/AdminUsers';
import { listAdminUsers } from '@/lib/admin-users';
import { getAdminSession } from '@/lib/auth';

export const metadata: Metadata = { title: 'Team and MFA', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'owner') redirect('/admin');
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · SECURITY</span>
              <h1>Team and MFA</h1>
              <p>
                Create owner or manager accounts with scrypt passwords and optional authenticator-app
                verification.
              </p>
            </div>
          </div>
          <AdminUsers initialUsers={await listAdminUsers()} />
        </div>
      </section>
    </>
  );
}
