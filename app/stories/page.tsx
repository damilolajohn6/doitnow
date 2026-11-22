import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listStories } from '@/lib/stories';

export const metadata: Metadata = {
  title: 'Project Stories',
  description:
    'Genuine before-and-after Do It Now projects, with verified starting conditions, design decisions, outcomes and permissioned client voices.',
  alternates: { canonical: '/stories' },
};
export const revalidate = 60;

export default async function StoriesPage() {
  const stories = await listStories();
  return (
    <section className="section stories-page">
      <div className="container">
        <div className="section-heading-row">
          <div className="section-heading">
            <span className="section-kicker">REAL PROJECT EVIDENCE</span>
            <h1>Before, after, and what changed.</h1>
            <p>
              Only genuine project photography, verified scope and approved client attribution appear here. No
              stock transformations or invented testimonials.
            </p>
          </div>
          <Link className="text-link" href="/studio">
            Start your project <ArrowRight size={16} />
          </Link>
        </div>
        {stories.length ? (
          <div className="story-grid">
            {stories.map(({ story }) => (
              <Link className="story-card" href={`/stories/${story.slug}`} key={story.slug}>
                <div className="story-card-images">
                  <div>
                    <Image
                      src={story.beforeImage}
                      alt={story.beforeAlt}
                      width={600}
                      height={440}
                      unoptimized={story.beforeImage.startsWith('http')}
                    />
                    <span>Before</span>
                  </div>
                  <div>
                    <Image
                      src={story.afterImage}
                      alt={story.afterAlt}
                      width={600}
                      height={440}
                      unoptimized={story.afterImage.startsWith('http')}
                    />
                    <span>After</span>
                  </div>
                </div>
                <div className="story-card-body">
                  <span className="section-kicker">
                    {story.projectType}
                    {story.location ? ` · ${story.location}` : ''}
                  </span>
                  <h2>{story.title}</h2>
                  <p>{story.summary}</p>
                  <strong>
                    Read the project story <ArrowRight size={15} />
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state story-empty">
            <h2>Genuine project stories are being prepared.</h2>
            <p>
              We will publish before-and-after work only when the photography, project details and any client
              words are approved for public use. Meanwhile, explore the design catalogue for adaptable
              directions.
            </p>
            <Link className="button" href="/designs">
              Explore design directions
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
