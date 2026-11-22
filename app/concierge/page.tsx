import type { Metadata } from 'next';
import DesignConcierge from '@/components/DesignConcierge';

export const metadata: Metadata = {
  title: 'Design Concierge',
  description:
    'Explore practical furniture and interior guidance grounded in the published Do It Now catalogue, with verified design recommendations.',
  alternates: { canonical: '/concierge' },
};

export default function ConciergePage() {
  return (
    <section className="section concierge-page">
      <div className="container container-narrow">
        <div className="section-heading">
          <span className="section-kicker">CATALOGUE-GROUNDED CONCIERGE</span>
          <h1>Start with your room, not a sales script.</h1>
          <p>
            Ask for design directions and practical starting points. Recommendations always come from the real
            published catalogue.
          </p>
        </div>
        <DesignConcierge />
      </div>
    </section>
  );
}
