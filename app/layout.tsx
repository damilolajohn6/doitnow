import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';
import { ScrollProgress } from '@/components/MotionPrimitives';
import { absoluteUrl, getBaseUrl } from '@/lib/site';

const brandFont = localFont({
  src: [
    { path: './fonts/DejaVuSans.ttf', weight: '400', style: 'normal' },
    { path: './fonts/DejaVuSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'Do It Now Furniture and Interior | Design. Build. Deliver.',
    template: '%s | Do It Now Furniture and Interior',
  },
  description:
    'Custom furniture and warm, functional interiors planned around your room, storage and daily routine. Explore wardrobes, kitchens, TV walls and more.',
  applicationName: 'Do It Now Furniture and Interior',
  keywords: ['custom furniture', 'interior design', 'wardrobes', 'kitchens', 'TV walls', 'Ondo', 'Ile-Ife'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Do It Now Furniture and Interior',
    description: 'Furniture that fits. Interiors that feel right.',
    type: 'website',
    siteName: 'Do It Now Furniture and Interior',
    locale: 'en_NG',
    url: '/',
    images: [
      { url: '/images/og-do-it-now.jpg', width: 1200, height: 630, alt: 'Do It Now Furniture and Interior' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Do It Now Furniture and Interior',
    description: 'Furniture that fits. Interiors that feel right.',
    images: ['/images/og-do-it-now.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: { icon: '/icon.png', apple: '/icons/icon-192.png' },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#252927',
  colorScheme: 'light',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': absoluteUrl('/#organization'),
      name: 'Do It Now Furniture and Interior',
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/brand/do-it-now-logo.png'),
        width: 3600,
        height: 900,
      },
      email: 'gabdidi52@gmail.com',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+2347017176611',
          contactType: 'customer enquiries',
          availableLanguage: 'English',
        },
        {
          '@type': 'ContactPoint',
          telephone: '+2348138701686',
          contactType: 'customer enquiries',
          availableLanguage: 'English',
        },
      ],
      address: [
        {
          '@type': 'PostalAddress',
          streetAddress: 'Orita Rd, Odigbo 350107',
          addressLocality: 'Ondo',
          addressCountry: 'NG',
        },
        {
          '@type': 'PostalAddress',
          streetAddress: 'Nasfat Area, Ibadan Road',
          addressLocality: 'Ile-Ife',
          addressRegion: 'Osun State',
          addressCountry: 'NG',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': absoluteUrl('/#website'),
      url: absoluteUrl('/'),
      name: 'Do It Now Furniture and Interior',
      publisher: { '@id': absoluteUrl('/#organization') },
      inLanguage: 'en',
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={brandFont.variable}>
        <StructuredData data={structuredData} />
        <ScrollProgress />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
