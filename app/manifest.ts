import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Do It Now Furniture and Interior',
    short_name: 'Do It Now',
    description: 'Custom furniture and warm, functional interiors planned around your space.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F3EB',
    theme_color: '#252927',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
