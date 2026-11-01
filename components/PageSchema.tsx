import StructuredData from './StructuredData';
import { absoluteUrl } from '@/lib/site';

interface PageSchemaProps {
  type: 'AboutPage' | 'CollectionPage' | 'ContactPage' | 'WebPage';
  name: string;
  description: string;
  path: string;
  additionalNodes?: Array<Record<string, unknown>>;
}

export default function PageSchema({ type, name, description, path, additionalNodes = [] }: PageSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type,
        name,
        description,
        url: absoluteUrl(path),
        isPartOf: { '@id': absoluteUrl('/#website') },
        about: { '@id': absoluteUrl('/#organization') },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
        ],
      },
      ...additionalNodes,
    ],
  };
  return <StructuredData data={data} />;
}
