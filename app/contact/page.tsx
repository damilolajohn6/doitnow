import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check, Mail, MapPin, MessageSquareText, Phone, Ruler } from 'lucide-react';
import EnquiryForm from '@/components/EnquiryForm';
import { Reveal } from '@/components/MotionPrimitives';
import PageSchema from '@/components/PageSchema';
import SpatialHero from '@/components/SpatialHero';
import { designs, getDesign } from '@/lib/designs';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Discuss your furniture or interior project with Do It Now. Call, email or send a room brief with photos, dimensions and priorities.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Do It Now Furniture and Interior',
    description: 'Bring the room. We’ll bring the next step.',
    url: '/contact',
  },
};

type ContactProps = { searchParams: Promise<{ design?: string }> };

const nextSteps = [
  {
    title: 'We review the brief',
    copy: 'We look at the room, contact details, preferred direction and the practical priorities you share.',
  },
  {
    title: 'We clarify the scope',
    copy: 'Any missing dimensions, materials, services or site questions are identified before final confirmation.',
  },
  {
    title: 'We agree the next step',
    copy: 'The project moves forward around a clearer design direction, confirmed information and practical coordination.',
  },
];

export default async function ContactPage({ searchParams }: ContactProps) {
  const parameters = await searchParams;
  const initialDesign = getDesign(parameters.design || '')?.slug || '';

  return (
    <>
      <PageSchema
        type="ContactPage"
        name="Contact Do It Now Furniture and Interior"
        description="Call, email or send a detailed furniture and interior project brief."
        path="/contact"
      />
      <SpatialHero
        eyebrow="LET’S TALK ABOUT YOUR ROOM"
        title={
          <>
            Bring the room.
            <br />
            <em>We’ll bring the next step.</em>
          </>
        }
        copy="A photograph, a few approximate dimensions and what you want to change are enough to begin. Call, email or shape a clearer brief with our project form."
        image="/images/designs/dining-01.webp"
        imageAlt="Warm dining room with timber furniture and coordinated lighting"
        sceneKicker="START WITH WHAT YOU HAVE"
        sceneTitle="Photos. Dimensions. Priorities."
        sceneNote="A useful brief can start simply."
        sceneHref="#enquire"
        sceneLinkLabel="Go to the project form"
        primaryHref="#enquire"
        primaryLabel="Send a project brief"
        secondaryHref="tel:+2347017176611"
        secondaryLabel="Call +234 701 717 6611"
        checks={[
          'No finished brief required',
          'Design references welcome',
          'Production sizes confirmed later',
        ]}
        stats={[
          { value: '2', label: 'direct phone lines' },
          { value: '2', label: 'Nigerian locations' },
          { value: '1', label: 'clear project brief' },
        ]}
      />

      <section className="section contact-direct-page">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">CHOOSE YOUR ROUTE</span>
            <h2>Direct, simple and human.</h2>
            <p>Use whichever contact method works for you, or visit one of our two locations.</p>
          </Reveal>
          <div className="contact-direct-grid">
            <Reveal>
              <article className="contact-direct-card">
                <span>
                  <Phone size={26} />
                </span>
                <small>CALL DIRECTLY</small>
                <h2>+234 701 717 6611</h2>
                <p>For an initial conversation about your room, scope and preferred direction.</p>
                <a href="tel:+2347017176611">
                  <strong>
                    Call this line <ArrowUpRight size={16} />
                  </strong>
                </a>
              </article>
            </Reveal>
            <Reveal delay={0.08}>
              <article className="contact-direct-card">
                <span>
                  <Mail size={26} />
                </span>
                <small>EMAIL YOUR BRIEF</small>
                <h2>gabdidi52@gmail.com</h2>
                <p>Send photos, dimensions, reference designs and a short description of what you need.</p>
                <a href="mailto:gabdidi52@gmail.com">
                  <strong>
                    Start an email <ArrowUpRight size={16} />
                  </strong>
                </a>
              </article>
            </Reveal>
            <Reveal delay={0.16}>
              <article className="contact-direct-card">
                <span>
                  <MapPin size={26} />
                </span>
                <small>OUR LOCATIONS</small>
                <h2>Ondo + Ile-Ife</h2>
                <p>Orita Rd, Odigbo, Ondo · Nasfat Area, Ibadan Road, Ile-Ife, Osun State.</p>
                <Link href="#enquire">
                  <strong>
                    Prepare before you visit <ArrowUpRight size={16} />
                  </strong>
                </Link>
              </article>
            </Reveal>
          </div>
          <p className="contact-alternate-line">
            Alternative phone line:{' '}
            <a href="tel:+2348138701686">
              0813 870 1686 <ArrowUpRight size={14} />
            </a>
          </p>
        </div>
      </section>

      <section className="section contact-section" id="enquire">
        <div className="container contact-grid">
          <Reveal className="contact-copy">
            <span className="section-kicker">A BETTER PROJECT BRIEF</span>
            <h2>Share what you know. Leave what you don’t.</h2>
            <p>
              The form helps organise the useful details, but you do not need a finished specification.
              Approximate information is welcome at this stage.
            </p>
            <div className="contact-brief-list">
              <span>
                <Check size={17} /> Room photos or approximate dimensions
              </span>
              <span>
                <Check size={17} /> Storage, layout or practical priorities
              </span>
              <span>
                <Check size={17} /> A preferred catalogue direction, if you have one
              </span>
            </div>
            <div className="direct-contact">
              <a href="tel:+2347017176611">
                <MessageSquareText size={20} />
                <span>
                  <small>Prefer to talk?</small>+234 701 717 6611
                </span>
              </a>
            </div>
          </Reveal>
          <Reveal className="enquiry-wrap" delay={0.08}>
            <EnquiryForm designs={designs} initialDesign={initialDesign} />
          </Reveal>
        </div>
      </section>

      <section className="section contact-next-section">
        <div className="container">
          <Reveal className="section-heading">
            <span className="section-kicker">AFTER YOU SEND THE FORM</span>
            <h2>What happens next.</h2>
          </Reveal>
          <div className="contact-next-grid">
            {nextSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.08}>
                <article>
                  <span>0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="field-hint">
            <Ruler size={15} /> Final dimensions, specifications and scope are confirmed before production.
          </p>
        </div>
      </section>
    </>
  );
}
