import { getCatalogueDesigns } from './catalogue';
import type { Design } from './designs';

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export function recommendDesigns(message: string, items: Design[]) {
  const text = message.toLowerCase();
  const groups: Array<[RegExp, number, string[]]> = [
    [/wardrobe|closet|clothes|storage/, 7, ['Wardrobes', 'Office & Storage']],
    [/kitchen|cook|island|pantry/, 8, ['Kitchens']],
    [/tv|television|media|console/, 8, ['TV Feature Walls', 'Bedroom TV Walls']],
    [/bedroom|bed|headboard/, 6, ['Bedroom Furniture', 'Bedroom TV Walls', 'Wardrobes']],
    [/living|dining|sofa|lounge/, 6, ['Living & Dining']],
    [/bathroom|shower|vanity/, 8, ['Bathrooms']],
    [/stair|staircase/, 8, ['Staircases']],
  ];
  return items
    .map((design) => {
      let score = 0;
      for (const [pattern, weight, categories] of groups)
        if (pattern.test(text) && categories.includes(design.category)) score += weight;
      const searchable = [
        design.title,
        design.summary,
        design.description,
        ...design.materials,
        ...design.facts,
      ]
        .join(' ')
        .toLowerCase();
      for (const keyword of [
        'walnut',
        'ivory',
        'oak',
        'sage',
        'marble',
        'curve',
        'island',
        'open shelf',
        'fluted',
        'upholstered',
      ]) {
        if (text.includes(keyword) && searchable.includes(keyword)) score += 3;
      }
      if (text.includes('simple') && /simple|restrained|quiet|clean|minimal/.test(searchable)) score += 3;
      if (text.includes('warm') && /warm|walnut|oak|timber/.test(searchable)) score += 2;
      return { design, score };
    })
    .sort((a, b) => b.score - a.score || a.design.title.localeCompare(b.design.title))
    .slice(0, 3)
    .map((item) => item.design);
}

export async function askDesignConcierge(message: string, history: HistoryItem[]) {
  const catalogue = await getCatalogueDesigns();
  const recommendations = recommendDesigns(message, catalogue);
  const fallback = `Based on your brief, start with ${recommendations.map((item) => item.title).join(', ')}. These are adaptable directions rather than fixed specifications. Confirm the room dimensions, storage needs and site conditions in the Smart Project Studio, then discuss materials and scope with the team. I do not generate prices or construction-ready specifications.`;
  const key = process.env.AI_GATEWAY_API_KEY;
  const model = process.env.AI_MODEL;
  if (!key || !model) return { answer: fallback, mode: 'catalogue' as const, recommendations };
  try {
    const context = recommendations.map((design) => ({
      title: design.title,
      category: design.category,
      summary: design.summary,
      materials: design.materials,
      planning: design.planning,
    }));
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          {
            role: 'system',
            content:
              'You are the Do It Now design concierge. Use only the supplied verified catalogue context for design claims. Never invent products, prices, discounts, availability, dimensions or completed work. Give concise warm guidance under 180 words. Explain that final dimensions and scope need confirmation. Mention only supplied design titles. Do not use markdown links or HTML.',
          },
          ...history.slice(-6).map((item) => ({ role: item.role, content: item.content.slice(0, 1000) })),
          {
            role: 'user',
            content: `Customer message: ${message}\n\nVerified catalogue options: ${JSON.stringify(context)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('AI gateway unavailable.');
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('AI gateway returned no guidance.');
    // Do not let generated wording introduce a price even if a model ignores the system brief.
    if (/₦|\bNGN\s*[\d,]|\b\d[\d,]*\s*(?:naira|usd|dollars?)\b|\$\s*\d/i.test(answer)) {
      return { answer: fallback, mode: 'catalogue' as const, recommendations };
    }
    return { answer: answer.slice(0, 6000), mode: 'ai' as const, recommendations };
  } catch {
    return { answer: fallback, mode: 'catalogue' as const, recommendations };
  }
}
