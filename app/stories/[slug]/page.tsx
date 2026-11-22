import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { getPublishedStory } from '@/lib/stories';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const record = await getPublishedStory(slug);
  if (!record) notFound();
  return {
    title: record.story.title,
    description: record.story.summary,
    alternates: { canonical: `/stories/${slug}` },
    openGraph: {
      title: record.story.title,
      description: record.story.summary,
      images: [record.story.afterImage],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await getPublishedStory(slug);
  if (!record) notFound();
  const { story } = record;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.summary,
    image: [absoluteUrl(story.beforeImage), absoluteUrl(story.afterImage)],
    dateModified: record.updatedAt,
    about: story.projectType,
    author: { '@type': 'Organization', name: 'Do It Now Furniture and Interior' },
  };
  return (
    <article className="story-detail">
      <script type="application/ld+json">{JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
      <section className="section story-detail-hero">
        <div className="container">
          <Link className="text-link" href="/stories">
            <ArrowLeft size={16} /> All project stories
          </Link>
          <span className="section-kicker">
            {story.projectType}
            {story.location ? ` · ${story.location}` : ''}
          </span>
          <h1>{story.title}</h1>
          <p>{story.summary}</p>
        </div>
      </section>
      <section className="story-before-after">
        <div className="container story-comparison">
          <figure>
            <div>
              <Image
                src={story.beforeImage}
                alt={story.beforeAlt}
                width={1000}
                height={760}
                priority
                unoptimized={story.beforeImage.startsWith('http')}
              />
            </div>
            <figcaption>Before · verified starting condition</figcaption>
          </figure>
          <figure>
            <div>
              <Image
                src={story.afterImage}
                alt={story.afterAlt}
                width={1000}
                height={760}
                priority
                unoptimized={story.afterImage.startsWith('http')}
              />
            </div>
            <figcaption>After · completed project</figcaption>
          </figure>
        </div>
      </section>
      <section className="section story-narrative">
        <div className="container">
          <div className="story-narrative-grid">
            <section>
              <span>01</span>
              <h2>The starting condition</h2>
              <p>{story.challenge}</p>
            </section>
            <section>
              <span>02</span>
              <h2>Design and build decisions</h2>
              <p>{story.solution}</p>
            </section>
            <section>
              <span>03</span>
              <h2>The verified outcome</h2>
              <p>{story.outcome}</p>
            </section>
          </div>
          {story.testimonial && (
            <blockquote className="story-quote">
              <Quote size={30} />
              <p>“{story.testimonial}”</p>
              <cite>{story.clientName}</cite>
            </blockquote>
          )}
          <div className="page-cta-inner story-cta">
            <div>
              <span className="section-kicker">YOUR SPACE, YOUR BRIEF</span>
              <h2>Start with what your room needs.</h2>
            </div>
            <Link className="button" href="/studio">
              Open Smart Project Studio <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
