import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const assets = {
  catalogue: {
    file: 'catalogue.pdf',
    filename: 'Do-It-Now-Catalogue.pdf',
    type: 'application/pdf',
  },
  'a4-pages': {
    file: 'do-it-now-catalogue-70-a4-pages-14pt.zip',
    filename: 'Do-It-Now-A4-Pages-14pt.zip',
    type: 'application/zip',
  },
  'a3-booklet': {
    file: 'do-it-now-catalogue-a3-booklet-illustrator-artboards.zip',
    filename: 'Do-It-Now-A3-Booklet.zip',
    type: 'application/zip',
  },
  'a5-flyers': {
    file: 'A5-Flyers-14pt.zip',
    filename: 'Do-It-Now-A5-Flyers-14pt.zip',
    type: 'application/zip',
  },
  'business-card': {
    file: 'do-it-now-business-card-front-back-14pt.zip',
    filename: 'Do-It-Now-Business-Card-Front-Back-14pt.zip',
    type: 'application/zip',
  },
  logo: { file: 'logo.png', filename: 'Do-It-Now-Logo.png', type: 'image/png' },
} as const;

type RouteContext = { params: Promise<{ asset: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { asset: slug } = await context.params;
  const asset = assets[slug as keyof typeof assets];
  if (!asset) return Response.json({ ok: false, message: 'Download not found.' }, { status: 404 });
  const inline = new URL(request.url).searchParams.get('inline') === '1' && asset.type === 'application/pdf';

  if (process.env.VERCEL === '1') {
    const base = process.env.DO_IT_NOW_BLOB_BASE_URL?.replace(/\/$/, '');
    if (!base) {
      return Response.json({ ok: false, message: 'Collateral storage is not configured.' }, { status: 503 });
    }
    try {
      const target = new URL(`${base}/${asset.filename}`);
      if (!inline) target.searchParams.set('download', '1');
      return new Response(null, {
        status: 302,
        headers: { Location: target.toString(), 'Cache-Control': 'public, max-age=300' },
      });
    } catch {
      return Response.json({ ok: false, message: 'Collateral storage URL is invalid.' }, { status: 503 });
    }
  }

  try {
    const root = process.env.DO_IT_NOW_ASSET_ROOT || path.resolve(process.cwd(), '..');
    const file = await readFile(
      /* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ root, asset.file),
    );
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': asset.type,
        'Content-Length': String(file.byteLength),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asset.filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return Response.json({ ok: false, message: 'Download is not available.' }, { status: 404 });
  }
}
