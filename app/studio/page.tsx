import type { Metadata } from 'next';
import ProjectStudio from '@/components/ProjectStudio';
import SpatialHero from '@/components/SpatialHero';
import { getCatalogueDesigns } from '@/lib/catalogue';

export const metadata: Metadata = {
  title: 'Smart Project Studio',
  description:
    'Build a detailed furniture or interior project brief with dimensions, style choices, a design shortlist, 3D configuration and room references.',
  alternates: { canonical: '/studio' },
};

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ config?: string }> }) {
  const { config = '' } = await searchParams;
  let configuration: Record<string, unknown> = {};
  if (config.length < 3000) {
    try {
      const parsed = JSON.parse(config);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) configuration = parsed;
    } catch {
      configuration = {};
    }
  }
  const designs = await getCatalogueDesigns();
  return (
    <>
      <SpatialHero
        eyebrow="SMART PROJECT STUDIO"
        title={
          <>
            A better brief.
            <br />
            <em>A clearer project.</em>
          </>
        }
        copy="Turn your room, practical priorities and favourite directions into one organised project brief. Add dimensions, references and a real 3D configuration without creating an account."
        image="/images/designs/wardrobe-01.webp"
        imageAlt="Warm ivory and walnut wardrobe design"
        sceneKicker="FIVE GUIDED STEPS"
        sceneTitle="From inspiration to a usable brief."
        sceneNote="Shortlist, uploads, PDF and consultation in one flow."
        sceneHref="#project-studio"
        sceneLinkLabel="Start below"
        primaryHref="#project-studio"
        primaryLabel="Build my brief"
        secondaryHref="/configurator"
        secondaryLabel="Try the 3D configurator"
        stats={[
          { value: '5', label: 'guided steps' },
          { value: '6', label: 'design shortlist slots' },
          { value: 'PDF', label: 'portable project brief' },
        ]}
      />
      <section className="section studio-section" id="project-studio">
        <div className="container">
          <ProjectStudio designs={designs} initialConfiguration={configuration} />
        </div>
      </section>
    </>
  );
}
