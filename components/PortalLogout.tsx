'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function PortalLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="button button-secondary"
      onClick={async () => {
        await fetch('/api/portal/logout', { method: 'POST' });
        router.replace('/portal');
        router.refresh();
      }}
    >
      <LogOut size={17} /> Sign out
    </button>
  );
}
