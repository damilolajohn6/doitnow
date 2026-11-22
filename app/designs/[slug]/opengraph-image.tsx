import { ImageResponse } from 'next/og';
import { getCatalogueDesign } from '@/lib/catalogue';

export const alt = 'Do It Now design direction';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const design = await getCatalogueDesign(slug);
  const title = design?.title || 'Do It Now Furniture and Interior';
  const category = design?.category || 'Custom furniture and interiors';
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: '#f7f3eb',
        color: '#252927',
        fontFamily: 'Arial, sans-serif',
        borderTop: '18px solid #9a6b3f',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, letterSpacing: 3 }}>
        <span>DO IT NOW</span>
        <span style={{ color: '#9a6b3f' }}>DESIGN. BUILD. DELIVER.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 990 }}>
        <span style={{ fontSize: 23, color: '#9a6b3f', marginBottom: 22, textTransform: 'uppercase' }}>
          {category}
        </span>
        <strong style={{ fontSize: title.length > 38 ? 54 : 68, lineHeight: 1.08, letterSpacing: -2 }}>
          {title}
        </strong>
        <span style={{ fontSize: 25, color: '#646762', marginTop: 26, lineHeight: 1.45 }}>
          {design?.summary || 'Furniture that fits. Interiors that feel right.'}
        </span>
      </div>
      <div style={{ display: 'flex', fontSize: 21, color: '#646762' }}>
        Ondo · Osun · +234 701 717 6611 · +234 813 870 1686
      </div>
    </div>,
    size,
  );
}
