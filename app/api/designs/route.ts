import { designs, isCategory } from '@/lib/designs';

export function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const requestedCategory = parameters.get('category') || 'All';
  const category = isCategory(requestedCategory) ? requestedCategory : 'All';
  const query = (parameters.get('q') || '').trim().slice(0, 80).toLowerCase();
  const items = designs.filter((design) => {
    if (category !== 'All' && design.category !== category) return false;
    if (!query) return true;
    return [
      design.title,
      design.category,
      design.summary,
      design.description,
      ...design.facts,
      ...design.materials,
      ...design.planning,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  return Response.json(
    { items },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' } },
  );
}
