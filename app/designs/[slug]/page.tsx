import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Layers3, Lamp, Ruler } from 'lucide-react';
import DesignCard from '@/components/DesignCard';
import { Reveal } from '@/components/MotionPrimitives';
import StructuredData from '@/components/StructuredData';
import { designs, getDesign } from '@/lib/designs';
import { absoluteUrl } from '@/lib/site';

type DesignPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return designs.map((design) => ({ slug: design.slug }));
}

export async function generateMetadata({ params }: DesignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) return { title: 'Design not found', robots: { index: false, follow: false } };
  return {
    title: design.title,
    description: design.summary,
    alternates: { canonical: `/designs/${design.slug}` },
    openGraph: {
      title: `${design.title} | Do It Now`,
      description: design.summary,
      url: `/designs/${design.slug}`,
      images: [{ url: design.image, alt: design.alt }],
    },
  };
}

export default async function DesignPage({ params }: DesignPageProps) {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) notFound();
  const related = designs
    .filter((item) => item.slug !== design.slug)
    .sort((a, b) => Number(b.category === design.category) - Number(a.category === design.category))
    .slice(0, 3);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: design.title,
        description: design.description,
        image: absoluteUrl(design.image),
        url: absoluteUrl(`/designs/${design.slug}`),
        genre: design.category,
        creator: { '@id': absoluteUrl('/#organization') },
        about: design.facts,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Designs', item: absoluteUrl('/designs') },
          {
            '@type': 'ListItem',
            position: 3,
            name: design.title,
            item: absoluteUrl(`/designs/${design.slug}`),
          },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <section className="detail-hero">
        <div className="container detail-grid">
          <div className="detail-image">
            <Image src={design.image} alt={design.alt} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
          </div>
          <div className="detail-copy">
            <Link href="/designs" className="text-link">
              <ArrowLeft size={16} /> Back to all designs
            </Link>
            <span className="section-kicker">{design.category}</span>
            <h1>{design.title}</h1>
            <p className="detail-summary">{design.summary}</p>
            <div className="fact-list">
              {design.facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <p>{design.description}</p>
            <Link href={`/contact?design=${design.slug}#enquire`} className="button">
              Enquire about this design <ArrowUpRight size={18} />
            </Link>
            <p className="detail-note">
              This is a design direction, not a fixed production template. Dimensions, materials and scope are
              adapted and confirmed for your room.
            </p>
          </div>
        </div>
      </section>

      <section className="section detail-specs">
        <div className="container spec-grid">
          <Reveal>
            <article className="spec-card">
              <span className="spec-icon">
                <Layers3 size={24} />
              </span>
              <h2>Material palette</h2>
              <ul>
                {design.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={0.08}>
            <article className="spec-card">
              <span className="spec-icon">
                <Ruler size={24} />
              </span>
              <h2>Planning notes</h2>
              <ul>
                {design.planning.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={0.16}>
            <article className="spec-card spec-card-dark">
              <span className="spec-icon">
                <Lamp size={24} />
              </span>
              <h2>Lighting intent</h2>
              <p>{design.lighting}</p>
              <span className="lighting-temperature">WARM · LAYERED · ROOM-SPECIFIC</span>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="section related-section">
        <div className="container">
          <div className="section-heading-row related-heading">
            <div className="section-heading">
              <span className="section-kicker">CONTINUE EXPLORING</span>
              <h2>More design directions.</h2>
            </div>
            <Link href="/designs" className="text-link">
              View the full catalogue <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="design-grid">
            {related.map((item) => (
              <DesignCard key={item.slug} design={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
