'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/admin', 'Enquiries'],
  ['/admin/projects', 'Projects'],
  ['/admin/bookings', 'Bookings'],
  ['/admin/content', 'Content CMS'],
  ['/admin/stories', 'Project stories'],
  ['/admin/users', 'Team & MFA'],
  ['/admin/system', 'System & audit'],
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin workspace">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
