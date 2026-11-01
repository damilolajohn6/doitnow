import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="container">
        <span className="section-kicker">404 — PAGE NOT FOUND</span>
        <h1>This page is not in the catalogue.</h1>
        <p>The design may have moved, or the address may be incorrect.</p>
        <Link href="/#designs" className="button">
          <ArrowLeft size={18} /> Return to the designs
        </Link>
      </div>
    </section>
  );
}
