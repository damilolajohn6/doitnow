import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, PackageCheck, Ruler } from 'lucide-react';
import FaqList from '@/components/FaqList';
import type { FaqItem } from '@/components/FaqList';
import { Reveal } from '@/components/MotionPrimitives';
import PageSchema from '@/components/PageSchema';
import ProcessJourney from '@/components/ProcessJourney';
import SpatialHero from '@/components/SpatialHero';

export const metadata: Metadata = {
  title: 'Our Process',
  description:
    'Follow the Do It Now process from discovery and measurement through design, confirmation, production, installation and handover.',
  alternates: { canonical: '/process' },
  openGraph: {
    title: 'From First Measurement to Final Fit | Do It Now',
    description: 'A calm, clear five-stage route for furniture and interior projects.',
    url: '/process',
  },
};

const stages = [
  ['Discover + measure', 'Understand room use, priorities, fixed conditions and approximate dimensions.'],
  ['Design + palette', 'Align layout, proportion, storage, materials and lighting intent.'],
  ['Detail + confirm', 'Confirm dimensions, clearances, hardware, services, scope and approvals.'],
  ['Build + coordinate', 'Carry approved information into production, finishing and site coordination.'],
  ['Install + handover', 'Fit, adjust, inspect and review care or maintenance needs.'],
];

const howToSchema = {
  '@type': 'HowTo',
  name: 'How a Do It Now furniture or interior project progresses',
  description: 'Five connected stages from the first room conversation to installation and handover.',
  totalTime: 'P28D',
  step: stages.map(([name, text], index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name,
    text,
  })),
};

const preparation = [
  {
    title: 'Before design',
    copy: 'Gather room photos, approximate dimensions, practical priorities and any catalogue directions that match your taste.',
    icon: Ruler,
  },
  {
    title: 'Before production',
    copy: 'Review confirmed measurements, materials, internal storage, hardware, services and the agreed project scope.',
    icon: CheckCircle2,
  },
  {
    title: 'Before installation',
    copy: 'Confirm access, site readiness and relevant trade coordination so delivery and fitting can proceed clearly.',
    icon: PackageCheck,
  },
];

const faqs: FaqItem[] = [
  {
    question: 'Do I need exact measurements before the first conversation?',
    answer:
      'No. Photos and approximate dimensions are enough to begin. Exact production dimensions and fixed site conditions must be confirmed before manufacture.',
  },
  {
    question: 'Can I use one of the catalogue designs for my own room?',
    answer:
      'Yes. A catalogue page is a useful starting point for discussing layout, finishes and features. We adapt the direction to your dimensions, routine and practical requirements.',
  },
  {
    question: 'How is the project price determined?',
    answer:
      'Pricing depends on scope, dimensions, materials, hardware, finishing and installation requirements. Once those decisions are sufficiently clear, the project can be priced against a defined scope.',
  },
  {
    question: 'Can you coordinate with other work happening on site?',
    answer:
      'Relevant services, access and trade dependencies are considered during planning. The required coordination is clarified before installation so responsibilities and site readiness are understood.',
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageSchema
        type="WebPage"
        name="Our Furniture and Interior Design Process"
        description="A five-stage journey from discovery and measurement to final installation."
        path="/process"
        additionalNodes={[howToSchema]}
      />
      <SpatialHero
        eyebrow="FROM IDEA TO INSTALLATION"
        title={
          <>
            A calm route from first measurement.
            <br />
            <em>To the final fit.</em>
          </>
        }
        copy="Good work feels clearer when each stage has a purpose. Explore the five steps we use to keep design decisions, production details and site conditions aligned."
        image="/images/designs/tv-wall-02.webp"
        imageAlt="Fluted walnut and stone-look TV wall with coordinated shelving"
        sceneKicker="DETAILS, IN SEQUENCE"
        sceneTitle="Resolve the right thing at the right time."
        sceneNote="Measure. Design. Confirm. Build. Install."
        sceneHref="/designs/white-marble-walnut-tv-wall"
        sceneLinkLabel="See a resolved feature wall"
        primaryHref="#journey"
        primaryLabel="Explore the five stages"
        secondaryHref="/contact#enquire"
        secondaryLabel="Start your brief"
        stats={[
          { value: '5', label: 'clear project stages' },
          { value: '3', label: 'decision layers: layout, palette, services' },
          { value: '1', label: 'shared project brief' },
        ]}
      />

      <section className="section process-page-section" id="journey">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">THE PROJECT JOURNEY</span>
            <h2>Five stages. No mystery in the middle.</h2>
            <p>Select a stage to see what we align and what the stage is intended to achieve.</p>
          </Reveal>
          <ProcessJourney />
        </div>
      </section>

      <section className="section preparation-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">WHAT TO PREPARE</span>
            <h2>The right information at the right moment.</h2>
            <p>You do not need everything on day one. These checkpoints keep the process practical.</p>
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

      <section className="section faq-section">
        <div className="container faq-grid">
          <Reveal>
            <span className="section-kicker">COMMON QUESTIONS</span>
            <h2>Before we begin.</h2>
            <p>
              A few practical answers about measurements, catalogue designs, pricing and site coordination.
            </p>
            <Link href="/contact" className="text-link">
              Ask about your own room <ArrowUpRight size={17} />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <FaqList items={faqs} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
