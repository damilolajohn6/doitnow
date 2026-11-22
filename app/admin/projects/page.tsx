import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminProjects from '@/components/AdminProjects';
import { isAdminAuthenticated } from '@/lib/auth';
import { listAdminProjects } from '@/lib/portal';

export const metadata: Metadata = { title: 'Project Pipeline', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · PROJECTS</span>
              <h1>Project pipeline</h1>
              <p>Coordinate stages, ownership, follow-ups, customer decisions and portal documents.</p>
            </div>
          </div>
          <AdminProjects initialProjects={await listAdminProjects()} />
        </div>
      </section>
    </>
  );
}
