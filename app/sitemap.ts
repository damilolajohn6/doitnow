import type { MetadataRoute } from 'next';
import { designs } from '@/lib/designs';
import { absoluteUrl } from '@/lib/site';

const corePages = [
  { path: '/designs', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/services', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/process', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.9 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...corePages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...designs.map((design) => ({
      url: absoluteUrl(`/designs/${design.slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
