export interface DownloadAsset {
  slug: string;
  title: string;
  description: string;
  format: 'PDF' | 'ZIP' | 'PNG';
  href: string;
  preview?: string;
}

export const downloadAssets: DownloadAsset[] = [
  {
    slug: 'catalogue',
    title: 'Furniture & Interior Catalogue',
    description: '70 pages of furniture, interiors and practical planning.',
    format: 'PDF',
    href: '/api/downloads/catalogue',
    preview: '/api/downloads/catalogue?inline=1',
  },
  {
    slug: 'a4-pages',
    title: 'Individual A4 Print Pages',
    description: '70 separate A4 PDFs with 14 pt minimum typography.',
    format: 'ZIP',
    href: '/api/downloads/a4-pages',
  },
  {
    slug: 'a3-booklet',
    title: 'A3 Duplex Booklet Package',
    description: '36 imposed A3 sides with the full printer imposition manifest.',
    format: 'ZIP',
    href: '/api/downloads/a3-booklet',
  },
  {
    slug: 'a5-flyers',
    title: 'A5 Flyer Pair',
    description: 'Two separate A5 PDFs with 14 pt minimum typography.',
    format: 'ZIP',
    href: '/api/downloads/a5-flyers',
  },
  {
    slug: 'business-card',
    title: 'Business Card — Front + Back',
    description: 'Separate 85 × 55 mm PDFs for two Illustrator artboards.',
    format: 'ZIP',
    href: '/api/downloads/business-card',
  },
  {
    slug: 'logo',
    title: 'Do It Now Logo',
    description: 'High-resolution 3600 × 900 px brand logo.',
    format: 'PNG',
    href: '/api/downloads/logo',
  },
];
