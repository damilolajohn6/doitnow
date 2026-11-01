import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Layers3, Lamp, MapPin, Ruler } from 'lucide-react';
import { Reveal } from '@/components/MotionPrimitives';
import PageSchema from '@/components/PageSchema';
import PaletteStudio from '@/components/PaletteStudio';
import SpatialHero from '@/components/SpatialHero';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet Do It Now Furniture and Interior: room-first planning, restrained material palettes and practical detailing in Ondo and Ile-Ife.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Do It Now Furniture and Interior',
    description: 'Made for the way you live—not just the way a room looks.',
    url: '/about',
  },
};

const principles = [
  {
    title: 'Function before façade',
    copy: 'We begin with circulation, storage, routine and fixed conditions. The visual direction becomes stronger when it resolves those practical needs first.',
    icon: Ruler,
  },
  {
    title: 'A restrained material story',
    copy: 'Timber, colour, stone-look surfaces, textiles and metal should belong to one composition. Fewer, better-related finishes create a calmer room.',
    icon: Layers3,
  },
  {
    title: 'Details that stay useful',
    copy: 'Lighting, cable access, hardware, ventilation and maintenance belong in the design conversation—not in a last-minute site improvisation.',
    icon: Lamp,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageSchema
        type="AboutPage"
        name="About Do It Now Furniture and Interior"
        description="Our room-first approach to custom furniture, material direction and interior coordination."
        path="/about"
      />
      <SpatialHero
        eyebrow="ABOUT DO IT NOW"
        title={
          <>
            Made for the way you live.
            <br />
            <em>Not just the way a room looks.</em>
          </>
        }
        copy="Do It Now Furniture and Interior brings furniture planning, material decisions and interior coordination into one clear process—so each choice feels considered and each piece belongs in the room."
        image="/images/designs/living-01.webp"
        imageAlt="Warm minimal interior with soft curved furniture and natural light"
        sceneKicker="OUR POINT OF VIEW"
        sceneTitle="Useful can still be beautiful."
        sceneNote="Warm minimal, resolved around daily life."
        sceneHref="/designs"
        sceneLinkLabel="See our design directions"
        primaryHref="/services"
        primaryLabel="Explore our services"
        secondaryHref="/contact"
        secondaryLabel="Start a conversation"
        checks={['Room-first planning', 'Restrained material palettes', 'Practical detailing']}
        stats={[
          { value: '2', label: 'Nigerian locations' },
          { value: '26', label: 'design directions' },
          { value: '5', label: 'clear project stages' },
        ]}
      />

      <section className="section">
        <div className="container editorial-grid">
          <Reveal>
            <span className="section-kicker">HOW WE THINK</span>
            <h2>The room and the routine come first.</h2>
          </Reveal>
          <Reveal className="editorial-copy" delay={0.1}>
            <p className="editorial-lead">
              A beautiful reference image is a beginning. The real work is understanding what needs to fit,
              open, store, move and endure in your particular space.
            </p>
            <p>
              We use catalogue directions to make preferences easier to discuss, then adapt the ideas around
              actual dimensions and practical priorities. A wardrobe interior should reflect the clothing it
              holds. A kitchen should support its working sequence. A TV wall should account for devices,
              cables and sightlines.
            </p>
            <p>
              This approach keeps the visual language warm and restrained without losing the functional detail
              that makes a finished room comfortable to use.
            </p>
            <blockquote>Good design is not more decoration. It is fewer unresolved decisions.</blockquote>
          </Reveal>
        </div>
      </section>

      <section className="section about-principles">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">THREE WORKING PRINCIPLES</span>
            <h2>Clear thinking, carried through.</h2>
            <p>These principles connect the first conversation to the final installation review.</p>
          </Reveal>
          <div className="about-principle-grid">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <Reveal key={principle.title} delay={index * 0.09}>
                  <article>
                    <span className="about-principle-number">0{index + 1}</span>
                    <span className="about-principle-icon">
                      <Icon size={27} />
                    </span>
                    <h3>{principle.title}</h3>
                    <p>{principle.copy}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section palette-section">
        <div className="container">
          <PaletteStudio />
        </div>
      </section>

      <section className="section about-locations">
        <div className="container">
          <Reveal className="section-heading-row">
            <div className="section-heading">
              <span className="section-kicker">WHERE TO FIND US</span>
              <h2>Two real locations. One clear process.</h2>
              <p>Start with whichever location or contact route is most convenient for your project.</p>
            </div>
          </Reveal>
          <div className="location-card-grid">
            <Reveal>
              <article className="location-card">
                <MapPin size={25} />
                <span>ONDO</span>
                <h3>Orita Road, Odigbo</h3>
                <p>Orita Rd, Odigbo 350107, Ondo, Nigeria.</p>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="location-card">
                <MapPin size={25} />
                <span>OSUN</span>
                <h3>Nasfat Area, Ile-Ife</h3>
                <p>Nasfat Area, Ibadan Road, Ile-Ife, Osun State, Nigeria.</p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="page-cta-band">
        <div className="container page-cta-inner">
          <div>
            <span className="section-kicker">MAKE IT PERSONAL</span>
            <h2>Bring the room. We’ll bring the next step.</h2>
            <p>Share your photos, approximate dimensions and the directions that feel most like you.</p>
          </div>
          <Link href="/contact#enquire" className="button">
            Start your brief <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
