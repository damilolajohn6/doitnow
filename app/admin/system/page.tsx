import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import AdminSystem from '@/components/AdminSystem';
import { isAdminAuthenticated } from '@/lib/auth';
import { listEmailOutbox } from '@/lib/email-outbox';
import { platformQuery } from '@/lib/platform-store';

export const metadata: Metadata = { title: 'System and Audit', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminSystemPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const [emails, audits] = await Promise.all([
    listEmailOutbox(),
    platformQuery<{
      id: string;
      actor: string;
      action: string;
      entity_id: string;
      details: string;
      created_at: string;
    }>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100'),
  ]);
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · RELIABILITY</span>
              <h1>System and audit</h1>
              <p>Monitor durable email delivery, retry failures and review administrative activity.</p>
            </div>
          </div>
          <AdminSystem emails={emails} audits={audits} />
        </div>
      </section>
    </>
  );
}
