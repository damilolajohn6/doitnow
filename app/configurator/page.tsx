import type { Metadata } from 'next';
import Configurator from '@/components/Configurator';

export const metadata: Metadata = {
  title: 'Interactive 3D Furniture Configurator',
  description:
    'Adjust a wardrobe or TV feature wall in real 3D, explore finishes and shelving, export the specification and attach it to your project brief.',
  alternates: { canonical: '/configurator' },
};

export default function ConfiguratorPage() {
  return (
    <section className="section configurator-page">
      <div className="container">
        <div className="section-heading-row">
          <div className="section-heading">
            <span className="section-kicker">INTERACTIVE 3D STUDIO</span>
            <h1>Shape the idea. See the geometry.</h1>
            <p>
              Explore proportion, shelving and finishes in a browser-based 3D model. Every configuration can
              be exported or carried into the Smart Project Studio.
            </p>
          </div>
          <span className="section-side-note">
            Real-time geometry.
            <br />
            No external model downloads.
          </span>
        </div>
        <Configurator />
      </div>
    </section>
  );
}
