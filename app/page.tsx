import Link from 'next/link';
import { ArrowUpRight, Download, Layers3, Lamp, Mail, MapPin, Phone, Ruler } from 'lucide-react';
import DesignExplorer from '@/components/DesignExplorer';
import SpatialHero from '@/components/SpatialHero';
// import DownloadCentre from '@/components/DownloadCentre';
import EnquiryForm from '@/components/EnquiryForm';
import { designs, getDesign } from '@/lib/designs';
import StructuredData from '@/components/StructuredData';
import { absoluteUrl } from '@/lib/site';

const processSteps = [
  ['01', 'Discover + measure', 'Room use, priorities, budget, dimensions and site conditions.'],
  ['02', 'Design + palette', 'Layout direction, visual language, materials and lighting intent.'],
  ['03', 'Detail + confirm', 'Technical sizes, services, hardware, scope and final approvals.'],
  ['04', 'Build + coordinate', 'Production, finishing and coordination with relevant site trades.'],
  ['05', 'Install + handover', 'Fit, adjust, clean, inspect and review care or maintenance needs.'],
];

function SectionHeading({ kicker, title, copy }: { kicker: string; title: string; copy?: string }) {
  return (
    <div className="section-heading">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  );
}

type HomeProps = { searchParams: Promise<{ design?: string; q?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const parameters = await searchParams;
  const initialDesign = getDesign(parameters.design || '')?.slug || '';
  const initialQuery = parameters.q?.slice(0, 80) || '';
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Do It Now furniture and interior design catalogue',
    numberOfItems: designs.length,
    itemListElement: designs.map((design, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: design.title,
      url: absoluteUrl(`/designs/${design.slug}`),
      image: absoluteUrl(design.image),
    })),
  };

  return (
    <>
      <StructuredData data={itemList} />
      <SpatialHero
        eyebrow="CUSTOM FURNITURE · INTERIOR DESIGN"
        title={
          <>
            Furniture that fits.
            <br />
            <em>Interiors that feel right.</em>
          </>
        }
        copy="Warm, functional furniture and interiors planned around your room, storage and daily routine—from the first measurement to installation."
        image="/images/designs/living-01.webp"
        imageAlt="Warm minimal living room designed with soft curves and pale timber"
        sceneKicker="WARM MINIMAL INTERIORS"
        sceneTitle="Designed around real life."
        sceneNote="Soft forms, pale timber and room to breathe."
        sceneHref="/designs/soft-curves-warm-neutrals"
        sceneLinkLabel="View this direction"
        primaryHref="#designs"
        primaryLabel="Explore designs"
        secondaryHref="#enquire"
        secondaryLabel="Discuss your space"
        checks={['Custom sizing', 'Material guidance', 'Practical planning']}
      />

      <section className="proof-strip" aria-label="Catalogue facts">
        <div className="container proof-grid">
          <div>
            <strong>70</strong>
            <span>catalogue pages</span>
          </div>
          <div>
            <strong>26</strong>
            <span>web design directions</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Nigerian locations</span>
          </div>
          <div className="proof-tagline">DESIGN. BUILD. DELIVER.</div>
        </div>
      </section>

      <section className="section designs-section" id="designs">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading
              kicker="DESIGN CATALOGUE"
              title="Find a direction for your room."
              copy="Search by room, material or feature. Open any design for materials, planning notes and lighting guidance."
            />
            <span className="section-side-note">
              Made to be adapted
              <br />
              to your actual space.
            </span>
          </div>
          <DesignExplorer initialDesigns={designs} initialQuery={initialQuery} />
        </div>
      </section>

      <section className="section planning-section">
        <div className="container planning-grid">
          <div className="planning-intro">
            <span className="section-kicker">BEYOND THE FINISH</span>
            <h2>Good design works before it looks good.</h2>
            <p>
              Proportion, clearances, services and maintenance are part of the design—not details left until
              installation.
            </p>
            <Link href="#enquire" className="text-link">
              Plan your room with us <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="principle-list">
            <article>
              <span>
                <Ruler size={25} />
              </span>
              <div>
                <h3>Clearances first</h3>
                <p>
                  Door swings, drawer access, walkways, sightlines and landing space shape the layout before
                  the façade is approved.
                </p>
              </div>
            </article>
            <article>
              <span>
                <Layers3 size={25} />
              </span>
              <div>
                <h3>Materials in real light</h3>
                <p>
                  Door, worktop, floor and metal samples should be reviewed together in daylight and warm
                  evening lighting.
                </p>
              </div>
            </article>
            <article>
              <span>
                <Lamp size={25} />
              </span>
              <div>
                <h3>Concealed, accessible services</h3>
                <p>
                  Cables, drivers, sockets and ventilation stay visually quiet without making future repairs
                  unnecessarily difficult.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="container">
          <SectionHeading
            kicker="FROM IDEA TO INSTALLATION"
            title="A clear sequence. Fewer surprises."
            copy="Every stage builds on approved information so design decisions, production details and site work stay aligned."
          />
          <div className="process-grid">
            {processSteps.map(([number, title, copy]) => (
              <article key={number} className="process-card">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="section downloads-section" id="downloads">
        <div className="container">
          <div className="section-heading-row">
            <SectionHeading
              kicker="CATALOGUE + PRINT CENTRE"
              title="Take the designs with you."
              copy="Open the catalogue or download the A4, A3, flyer, business-card and logo packages for your next conversation or print workflow."
            />
            <span className="download-heading-icon">
              <Download size={32} />
            </span>
          </div>
          <DownloadCentre />
        </div>
      </section> */}

      <section className="section contact-section" id="contact">
        <div className="container contact-grid">
          <div className="contact-copy">
            <span className="section-kicker">START A CONVERSATION</span>
            <h2>Your room is the starting point.</h2>
            <p>
              Bring your measurements, photos and preferred design pages. We’ll use them to shape a practical
              direction for your space.
            </p>
            <div className="direct-contact">
              <a href="tel:+2347017176611">
                <Phone size={20} />
                <span>
                  <small>Call the primary line</small>+234 701 717 6611
                </span>
              </a>
              <a href="tel:+2348138701686">
                <Phone size={20} />
                <span>
                  <small>Alternative line</small>0813 870 1686
                </span>
              </a>
              <a href="mailto:gabdidi52@gmail.com">
                <Mail size={20} />
                <span>
                  <small>Email</small>gabdidi52@gmail.com
                </span>
              </a>
            </div>
            <div className="contact-addresses">
              <div>
                <MapPin size={20} />
                <p>
                  <strong>Ondo</strong>Orita Rd, Odigbo 350107,
                  <br />
                  Ondo, Nigeria
                </p>
              </div>
              <div>
                <MapPin size={20} />
                <p>
                  <strong>Osun</strong>Nasfat Area, Ibadan Road,
                  <br />
                  Ile-Ife, Osun State, Nigeria
                </p>
              </div>
            </div>
          </div>
          <div className="enquiry-wrap" id="enquire">
            <EnquiryForm designs={designs} initialDesign={initialDesign} />
          </div>
        </div>
      </section>
    </>
  );
}
