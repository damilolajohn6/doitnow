import { z } from 'zod';
import { platformQuery, platformRun } from './platform-store';

const imageValue = z
  .string()
  .trim()
  .max(600)
  .refine((value) => value.startsWith('/') || value.startsWith('https://'));

export const storyInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(90),
    title: z.string().trim().min(3).max(140),
    location: z.string().trim().max(120).default(''),
    projectType: z.string().trim().min(3).max(120),
    summary: z.string().trim().min(20).max(400),
    beforeImage: imageValue,
    beforeAlt: z.string().trim().min(8).max(220),
    afterImage: imageValue,
    afterAlt: z.string().trim().min(8).max(220),
    challenge: z.string().trim().min(20).max(2400),
    solution: z.string().trim().min(20).max(2400),
    outcome: z.string().trim().min(20).max(2400),
    testimonial: z.string().trim().max(1600).default(''),
    clientName: z.string().trim().max(140).default(''),
    published: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.testimonial && !value.clientName) {
      context.addIssue({
        code: 'custom',
        path: ['clientName'],
        message: 'Add the approved client attribution or remove the testimonial.',
      });
    }
  });

export type StoryInput = z.infer<typeof storyInputSchema>;
export type Story = Omit<StoryInput, 'published'>;
export interface StoryRecord {
  story: Story;
  published: boolean;
  updatedAt: string;
}

interface StoryRow {
  slug: string;
  payload: string;
  published: number;
  updated_at: string;
}

function mapStory(row: StoryRow): StoryRecord | null {
  try {
    const parsed = storyInputSchema.safeParse({
      ...JSON.parse(row.payload),
      slug: row.slug,
      published: Boolean(row.published),
    });
    if (!parsed.success) return null;
    const { published, ...story } = parsed.data;
    return { story, published, updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function listStories(includeUnpublished = false): Promise<StoryRecord[]> {
  const rows = await platformQuery<StoryRow>('SELECT * FROM project_stories ORDER BY updated_at DESC');
  return rows
    .filter((row) => includeUnpublished || Boolean(row.published))
    .map(mapStory)
    .filter((item): item is StoryRecord => Boolean(item));
}

export async function getPublishedStory(slug: string) {
  const rows = await platformQuery<StoryRow>(
    'SELECT * FROM project_stories WHERE slug = ? AND published = 1 LIMIT 1',
    [slug],
  );
  return rows[0] ? mapStory(rows[0]) : null;
}

export async function saveStory(input: StoryInput) {
  const value = storyInputSchema.parse(input);
  const { published, ...story } = value;
  await platformRun(
    `INSERT INTO project_stories (slug, payload, published, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload, published = excluded.published, updated_at = excluded.updated_at`,
    [value.slug, JSON.stringify(story), published ? 1 : 0, new Date().toISOString()],
  );
  return story;
}

export async function removeStory(slug: string) {
  await platformRun('DELETE FROM project_stories WHERE slug = ?', [slug]);
}
