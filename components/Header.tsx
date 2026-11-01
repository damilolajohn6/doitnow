'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const links = [
  { href: '/designs', label: 'Designs' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/process', label: 'Process' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  function isActive(href: string) {
    return pathname === href || (href === '/designs' && pathname.startsWith('/designs/'));
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand-link" aria-label="Do It Now home" onClick={() => setOpen(false)}>
          <Image
            src="/images/brand/do-it-now-logo.png"
            alt="Do It Now Furniture and Interior"
            width={720}
            height={180}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact#enquire" className="button button-small nav-cta">
          Start a project <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <button
          className="menu-button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
        >
          {open ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>
      <div id="mobile-navigation" className={`mobile-nav ${open ? 'is-open' : ''}`}>
        <nav className="container" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={isActive(link.href) ? 'active' : ''}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact#enquire" className="button" onClick={() => setOpen(false)}>
            Start a project <ArrowUpRight size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
