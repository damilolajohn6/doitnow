'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { Sparkles } from 'lucide-react';

export default function ConciergeFloat() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return (
    <Link
      href="/concierge"
      className="concierge-float"
      aria-label="Ask the design concierge"
      onClick={() => track('concierge_open')}
    >
      <Sparkles size={22} />
      <span>Design concierge</span>
    </Link>
  );
}
