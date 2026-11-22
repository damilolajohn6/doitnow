import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, FolderKanban } from 'lucide-react';
import PortalLogin from '@/components/PortalLogin';
import PortalLogout from '@/components/PortalLogout';
import { listBookings } from '@/lib/bookings';
import { getCustomerSession, listCustomerProjects, projectStages } from '@/lib/portal';

export const metadata: Metadata = {
  title: 'Customer Project Portal',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, session] = await Promise.all([searchParams, getCustomerSession()]);
  if (!session)
    return (
      <section className="section portal-page">
        <div className="container container-narrow">
          <PortalLogin error={error} />
        </div>
      </section>
    );
  const [projects, bookings] = await Promise.all([
    listCustomerProjects(session.email),
    listBookings(session.email),
  ]);
  return (
    <section className="section portal-page">
      <div className="container">
        <div className="portal-header">
          <div>
            <span className="section-kicker">CUSTOMER PROJECT PORTAL</span>
            <h1>Welcome back.</h1>
            <p>Signed in as {session.email}. Review projects, appointments, files and design decisions.</p>
          </div>
          <PortalLogout />
        </div>
        <div className="portal-summary">
          <div>
            <FolderKanban size={23} />
            <strong>{projects.length}</strong>
            <span>project{projects.length === 1 ? '' : 's'}</span>
          </div>
          <div>
            <CalendarDays size={23} />
            <strong>{bookings.length}</strong>
            <span>appointment{bookings.length === 1 ? '' : 's'}</span>
          </div>
          <Link href="/studio">
            Start another brief <ArrowRight size={17} />
          </Link>
        </div>
        <div className="portal-content-grid">
          <section>
            <div className="portal-section-title">
              <h2>Your projects</h2>
              <span>Latest first</span>
            </div>
            {projects.length ? (
              <div className="portal-project-list">
                {projects.map(({ enquiry, profile }) => (
                  <Link href={`/portal/${enquiry.id}`} key={enquiry.id} className="portal-project-card">
                    <div>
                      <span>{enquiry.reference}</span>
                      <h3>{enquiry.projectType}</h3>
                      <p>{enquiry.message}</p>
                    </div>
                    <div className="project-stage-mini">
                      <strong>{profile.stage}</strong>
                      <div>
                        {projectStages.map((stage) => (
                          <i
                            key={stage}
                            className={
                              projectStages.indexOf(stage) <= projectStages.indexOf(profile.stage)
                                ? 'active'
                                : ''
                            }
                          />
                        ))}
                      </div>
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No projects found</h3>
                <p>Start a project brief with this email to see it here.</p>
                <Link className="button" href="/studio">
                  Open Project Studio
                </Link>
              </div>
            )}
          </section>
          <aside>
            <div className="portal-section-title">
              <h2>Appointments</h2>
            </div>
            {bookings.length ? (
              <div className="portal-booking-list">
                {bookings.map((booking) => (
                  <article key={booking.id}>
                    <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
                    <h3>{booking.service}</h3>
                    <p>
                      {new Intl.DateTimeFormat('en-NG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Africa/Lagos',
                      }).format(new Date(booking.startsAt))}
                    </p>
                    <small>Africa/Lagos</small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No appointments yet.</p>
                <Link className="button button-secondary" href="/book">
                  Book a consultation
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
