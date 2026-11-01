import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Camera, ClipboardCheck, Ruler } from 'lucide-react';
import { Reveal } from '@/components/MotionPrimitives';
import PageSchema from '@/components/PageSchema';
import ServiceExplorer from '@/components/ServiceExplorer';
import SpatialHero from '@/components/SpatialHero';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Custom furniture, kitchens, wardrobes, TV walls, material direction and installation coordination shaped around your actual space.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Furniture & Interior Design Services | Do It Now',
    description: 'One room or a whole plan. Every detail has a place.',
    url: '/services',
  },
};

const serviceSchema = {
  '@type': 'Service',
  name: 'Custom furniture and interior design coordination',
  provider: { '@id': absoluteUrl('/#organization') },
  areaServed: { '@type': 'Country', name: 'Nigeria' },
  serviceType: [
    'Custom furniture',
    'Kitchen design',
    'Wardrobes and storage',
    'TV and feature walls',
    'Materials and interior direction',
    'Planning and installation coordination',
  ],
};

const preparation = [
  {
    title: 'Show us the room',
    copy: 'Photos, a short video and a few reference directions help us understand the fixed conditions and what you want to change.',
    icon: Camera,
  },
  {
    title: 'Start with approximate sizes',
    copy: 'Early dimensions make the conversation more useful. Production measurements are separately confirmed before manufacture.',
    icon: Ruler,
  },
  {
    title: 'Align the scope',
    copy: 'We clarify the furniture, finishes, services and coordination involved so the approved direction has a practical next step.',
    icon: ClipboardCheck,
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageSchema
        type="WebPage"
        name="Furniture and Interior Design Services"
        description="Explore six connected service paths for furniture, interiors, planning and installation."
        path="/services"
        additionalNodes={[serviceSchema]}
      />
      <SpatialHero
        eyebrow="SERVICES, SHAPED AROUND YOUR SCOPE"
        title={
          <>
            One room or a whole plan.
            <br />
            <em>Every detail has a place.</em>
          </>
        }
        copy="From a single wardrobe to a coordinated interior direction, we connect layout, furniture, finishes and practical site decisions in one brief. Explore what each service can include."
        image="/images/designs/kitchen-02.webp"
        imageAlt="Ivory and walnut kitchen with an island and coordinated windows"
        sceneKicker="DESIGN + BUILD THINKING"
        sceneTitle="A beautiful room with a working logic."
        sceneNote="Workflow, clearances and materials in one brief."
        sceneHref="/designs/ivory-walnut-kitchen-island"
        sceneLinkLabel="See the kitchen direction"
        primaryHref="#service-explorer"
        primaryLabel="Explore services"
        secondaryHref="/process"
        secondaryLabel="See how it works"
        stats={[
          { value: '6', label: 'service paths' },
          { value: '5', label: 'clear project stages' },
          { value: '2', label: 'Nigerian locations' },
        ]}
      />

      <section className="section" id="service-explorer">
        <div className="container">
          <Reveal className="section-heading-row">
            <div className="section-heading">
              <span className="section-kicker">EXPLORE THE WORK</span>
              <h2>Choose a service. See the thinking inside it.</h2>
              <p>
                Each service connects visual direction with practical decisions. Select one to explore what we
                shape and what we consider.
              </p>
            </div>
            <span className="section-side-note">
              Six connected services.
              <br />
              One coordinated brief.
            </span>
          </Reveal>
          <ServiceExplorer />
        </div>
      </section>

      <section className="section preparation-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">A USEFUL FIRST CONVERSATION</span>
            <h2>You can start before everything is decided.</h2>
            <p>These three inputs help us move from a broad idea to a room-specific discussion.</p>
          </Reveal>
          <div className="preparation-grid">
            {preparation.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.09}>
                  <article>
                    <span>
                      <Icon size={25} />
                    </span>
                    <small>0{index + 1}</small>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-cta-band">
        <div className="container page-cta-inner">
          <div>
            <span className="section-kicker">NOT SURE WHICH SERVICE FITS?</span>
            <h2>Describe the room, not the technical scope.</h2>
            <p>Tell us what you want to change and we can help identify the most useful starting point.</p>
          </div>
          <Link href="/contact#enquire" className="button">
            Discuss your project <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
