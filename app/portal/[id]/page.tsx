import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import ProjectApproval from '@/components/ProjectApproval';
import PortalUpload from '@/components/PortalUpload';
import { getCustomerSession, getCustomerProject, projectStages } from '@/lib/portal';
import { projectBriefUrl } from '@/lib/project-briefs';

export const metadata: Metadata = { title: 'Project Details', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CustomerProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [session, { id }] = await Promise.all([getCustomerSession(), params]);
  if (!session) redirect('/portal');
  const project = await getCustomerProject(session.email, id);
  if (!project) notFound();
  const { enquiry, profile, brief, files, activities } = project;
  return (
    <section className="section portal-page">
      <div className="container">
        <Link href="/portal" className="text-link">
          ← Back to all projects
        </Link>
        <div className="portal-project-header">
          <div>
            <span className="section-kicker">{enquiry.reference}</span>
            <h1>{enquiry.projectType}</h1>
            <p>
              Received{' '}
              {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'Africa/Lagos' }).format(
                new Date(enquiry.createdAt),
              )}
            </p>
          </div>
          <a className="button button-secondary" href={projectBriefUrl(enquiry.reference)}>
            <Download size={17} /> Download project brief
          </a>
        </div>
        <ol className="project-stage-timeline">
          {projectStages.map((stage, index) => (
            <li key={stage} className={index <= projectStages.indexOf(profile.stage) ? 'active' : ''}>
              <span>{index + 1}</span>
              {stage}
            </li>
          ))}
        </ol>
        <div className="portal-detail-grid">
          <div>
            <section className="portal-detail-card">
              <span className="section-kicker">YOUR BRIEF</span>
              <h2>Project requirements</h2>
              <p>{enquiry.message}</p>
              <dl>
                <dt>Dimensions</dt>
                <dd>{brief.dimensions || 'To be confirmed on site'}</dd>
                <dt>Style direction</dt>
                <dd>{brief.styles.join(', ') || 'Open to guidance'}</dd>
                <dt>Timeline</dt>
                <dd>{brief.timeline || 'To be discussed'}</dd>
                <dt>Shortlist</dt>
                <dd>
                  {brief.favourites.map((item) => item.replace(/-/g, ' ')).join(', ') ||
                    enquiry.design.replace(/-/g, ' ') ||
                    'No catalogue preference'}
                </dd>
              </dl>
            </section>
            <ProjectApproval projectId={enquiry.id} approvedAt={profile.approvedAt} />
          </div>
          <aside>
            <section className="portal-detail-card">
              <span className="section-kicker">PROJECT FILES</span>
              <h2>Documents and references</h2>
              {files.length ? (
                <div className="portal-file-list">
                  {files.map((file) => (
                    <a href={`/api/files/${file.id}`} key={file.id} target="_blank" rel="noreferrer">
                      <FileText size={18} />
                      <span>
                        {file.filename}
                        <small>
                          {file.kind} · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p>No files have been added yet.</p>
              )}
              <PortalUpload projectId={enquiry.id} />
            </section>
            <section className="portal-detail-card">
              <span className="section-kicker">ACTIVITY</span>
              <h2>Project history</h2>
              {activities.length ? (
                <ol className="project-activity-list">
                  {activities.map((item) => (
                    <li key={item.id}>
                      <strong>{item.action}</strong>
                      <span>
                        {new Intl.DateTimeFormat('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Africa/Lagos',
                        }).format(new Date(item.createdAt))}
                      </span>
                      {item.note && <p>{item.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Project updates will appear here.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
