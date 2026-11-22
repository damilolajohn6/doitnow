import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import StoryManager from '@/components/StoryManager';
import { getAdminSession } from '@/lib/auth';
import { listStories } from '@/lib/stories';

export const metadata: Metadata = { title: 'Project Stories', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminStoriesPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · PROJECT EVIDENCE</span>
              <h1>Project stories</h1>
              <p>
                Publish genuine before-and-after evidence and optional permissioned client testimonials. No
                stock transformations or invented claims.
              </p>
            </div>
          </div>
          <StoryManager items={await listStories(true)} owner={session.role === 'owner'} />
        </div>
      </section>
    </>
  );
}
