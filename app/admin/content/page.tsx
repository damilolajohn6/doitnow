import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import CmsManager from '@/components/CmsManager';
import { getAdminSession } from '@/lib/auth';
import { getAdminDesigns } from '@/lib/catalogue';

export const metadata: Metadata = { title: 'Catalogue CMS', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · CONTENT</span>
              <h1>Catalogue CMS</h1>
              <p>
                Edit approved directions, create drafts, upload imagery and publish without a code deployment.
              </p>
            </div>
          </div>
          <CmsManager items={await getAdminDesigns()} owner={session.role === 'owner'} />
        </div>
      </section>
    </>
  );
}
