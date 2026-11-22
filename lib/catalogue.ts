import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { categories, designs, type Design, type DesignCategory } from './designs';
import { platformQuery, platformRun } from './platform-store';

export const designInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(90),
  title: z.string().trim().min(3).max(120),
  category: z.enum(categories.slice(1) as [DesignCategory, ...DesignCategory[]]),
  image: z
    .string()
    .trim()
    .max(600)
    .refine((value) => value.startsWith('/') || value.startsWith('https://')),
  alt: z.string().trim().min(8).max(220),
  summary: z.string().trim().min(12).max(320),
  description: z.string().trim().min(20).max(2400),
  facts: z.array(z.string().trim().min(2).max(120)).max(8),
  materials: z.array(z.string().trim().min(2).max(160)).max(10),
  planning: z.array(z.string().trim().min(2).max(240)).max(12),
  lighting: z.string().trim().min(8).max(500),
  published: z.boolean(),
});

export type DesignInput = z.infer<typeof designInputSchema>;

interface OverrideRow {
  slug: string;
  payload: string;
  published: number;
  updated_at: string;
}

function safeParseDesign(row: OverrideRow): Design | null {
  try {
    const value = JSON.parse(row.payload) as Partial<Design>;
    const base = designs.find((item) => item.slug === row.slug);
    const merged = { ...base, ...value, slug: row.slug } as Design;
    const checked = designInputSchema.safeParse({ ...merged, published: Boolean(row.published) });
    return checked.success ? merged : null;
  } catch {
    return null;
  }
}

export async function getCatalogueDesigns(includeUnpublished = false): Promise<Design[]> {
  try {
    const rows = await platformQuery<OverrideRow>('SELECT * FROM design_overrides');
    const overrides = new Map(rows.map((row) => [row.slug, row]));
    const baseItems = designs
      .map((design) => {
        const row = overrides.get(design.slug);
        if (!row) return design;
        return row.published || includeUnpublished ? safeParseDesign(row) : null;
      })
      .filter((item): item is Design => Boolean(item));
    const customs = rows
      .filter((row) => !designs.some((design) => design.slug === row.slug))
      .filter((row) => includeUnpublished || Boolean(row.published))
      .map(safeParseDesign)
      .filter((item): item is Design => Boolean(item));
    return [...baseItems, ...customs];
  } catch {
    if (includeUnpublished) return designs;
    return designs;
  }
}

export async function getCatalogueDesign(slug: string, includeUnpublished = false) {
  const items = await getCatalogueDesigns(includeUnpublished);
  return items.find((item) => item.slug === slug) || null;
}

export async function getAdminDesigns() {
  try {
    const rows = await platformQuery<OverrideRow>('SELECT * FROM design_overrides');
    const overrides = new Map(rows.map((row) => [row.slug, row]));
    const baseItems = designs.map((design) => {
      const row = overrides.get(design.slug);
      return {
        design: row ? safeParseDesign(row) || design : design,
        published: row ? Boolean(row.published) : true,
        custom: false,
        updatedAt: row?.updated_at || '',
      };
    });
    const customs = rows
      .filter((row) => !designs.some((design) => design.slug === row.slug))
      .flatMap((row) => {
        const design = safeParseDesign(row);
        return design
          ? [{ design, published: Boolean(row.published), custom: true, updatedAt: row.updated_at }]
          : [];
      });
    return [...baseItems, ...customs];
  } catch {
    return designs.map((design) => ({ design, published: true, custom: false, updatedAt: '' }));
  }
}

export async function saveDesign(input: DesignInput) {
  const value = designInputSchema.parse(input);
  const { published, ...design } = value;
  await platformRun(
    `INSERT INTO design_overrides (slug, payload, published, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload,
       published = excluded.published, updated_at = excluded.updated_at`,
    [value.slug, JSON.stringify(design), published ? 1 : 0, new Date().toISOString()],
  );
  return design as Design;
}

export async function removeDesignOverride(slug: string) {
  await platformRun('DELETE FROM design_overrides WHERE slug = ?', [slug]);
}

export async function recordAudit(actor: string, action: string, entityId: string, details = '') {
  await platformRun(
    'INSERT INTO audit_logs (id, actor, action, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      randomUUID(),
      actor.slice(0, 160),
      action.slice(0, 120),
      entityId.slice(0, 160),
      details.slice(0, 1000),
      new Date().toISOString(),
    ],
  );
}
