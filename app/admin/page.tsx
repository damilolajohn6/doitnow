import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import EnquiryDashboard from '@/components/EnquiryDashboard';
import { isAdminAuthenticated } from '@/lib/auth';
import { listEnquiries } from '@/lib/enquiries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enquiry Administration',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return <EnquiryDashboard initialEnquiries={await listEnquiries()} />;
}
