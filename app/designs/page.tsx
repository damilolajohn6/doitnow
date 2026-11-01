import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import DesignExplorer from '@/components/DesignExplorer';
import { Reveal } from '@/components/MotionPrimitives';
import PageSchema from '@/components/PageSchema';
import SpatialHero from '@/components/SpatialHero';
import { categories, designs } from '@/lib/designs';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Design Catalogue',
  description:
    'Explore 26 furniture and interior design directions with material palettes, planning notes and lighting guidance for real rooms.',
  alternates: { canonical: '/designs' },
  openGraph: {
    title: 'Furniture & Interior Design Catalogue | Do It Now',
    description: 'Design directions made for real rooms, practical routines and confirmed dimensions.',
    url: '/designs',
  },
};

const catalogueList = {
  '@type': 'ItemList',
  numberOfItems: designs.length,
  itemListElement: designs.map((design, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: design.title,
    url: absoluteUrl(`/designs/${design.slug}`),
    image: absoluteUrl(design.image),
  })),
};

export default function DesignsPage() {
  return (
    <>
      <PageSchema
        type="CollectionPage"
        name="Furniture and Interior Design Catalogue"
        description="Twenty-six adaptable design directions with practical material, planning and lighting guidance."
        path="/designs"
        additionalNodes={[catalogueList]}
      />
      <SpatialHero
        eyebrow="THE DESIGN CATALOGUE"
        title={
          <>
            Design directions.
            <br />
            <em>Made for real rooms.</em>
          </>
        }
        copy="Explore by space, material or feature. Every direction includes practical planning notes, material guidance and lighting intent—ready to be adapted to your dimensions."
        image="/images/designs/living-01.webp"
        imageAlt="Warm minimal living room with curved seating and pale timber"
        sceneKicker="CURATED STARTING POINTS"
        sceneTitle="Inspiration with a practical layer."
        sceneNote="Materials, clearances and lighting included."
        sceneHref="/designs/soft-curves-warm-neutrals"
        sceneLinkLabel="Open this direction"
        primaryHref="#catalogue"
        primaryLabel="Explore all 26"
        secondaryHref="/about"
        secondaryLabel="Our point of view"
        stats={[
          { value: '26', label: 'design directions' },
          { value: String(categories.length - 1), label: 'space categories' },
          { value: '6', label: 'kitchen studies' },
        ]}
      />

      <section className="section page-catalogue" id="catalogue">
        <div className="container">
          <Reveal className="section-heading-row">
            <div className="section-heading">
              <span className="section-kicker">FIND YOUR STARTING POINT</span>
              <h2>Search the complete collection.</h2>
              <p>
                Filter by room or search for a material, feature or mood. Open a direction for the decisions
                that sit beneath the image.
              </p>
            </div>
            <span className="section-side-note">
              Curated inspiration.
              <br />
              Room-specific execution.
            </span>
          </Reveal>
          <DesignExplorer initialDesigns={designs} />
        </div>
      </section>

      <section className="page-cta-band">
        <div className="container page-cta-inner">
          <div>
            <span className="section-kicker">ADAPT, DON’T IMITATE</span>
            <h2>Your room does not need to copy a catalogue.</h2>
            <p>
              Choose the directions that feel right, then let actual dimensions, storage needs and site
              conditions shape the final design.
            </p>
          </div>
          <Link href="/contact#enquire" className="button">
            Discuss your space <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
