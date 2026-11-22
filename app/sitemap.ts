import type { MetadataRoute } from 'next';
import { getCatalogueDesigns } from '@/lib/catalogue';
import { absoluteUrl } from '@/lib/site';
import { listStories } from '@/lib/stories';

const corePages = [
  { path: '/designs', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/studio', changeFrequency: 'monthly' as const, priority: 0.95 },
  { path: '/configurator', changeFrequency: 'monthly' as const, priority: 0.85 },
  { path: '/book', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/concierge', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/stories', changeFrequency: 'weekly' as const, priority: 0.85 },
  { path: '/services', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/process', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.9 },
];

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lastModified, designs, stories] = await Promise.all([
    Promise.resolve(new Date()),
    getCatalogueDesigns(),
    listStories(),
  ]);
  return [
    { url: absoluteUrl('/'), lastModified, changeFrequency: 'weekly', priority: 1 },
    ...corePages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...stories.map(({ story, updatedAt }) => ({
      url: absoluteUrl(`/stories/${story.slug}`),
      lastModified: updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...designs.map((design) => ({
      url: absoluteUrl(`/designs/${design.slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
