'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Search, SearchX, X } from 'lucide-react';
import { categories } from '@/lib/designs';
import type { Category, Design } from '@/lib/designs';
import DesignCard from './DesignCard';

interface DesignExplorerProps {
  initialDesigns: Design[];
  initialQuery?: string;
}

export default function DesignExplorer({ initialDesigns, initialQuery = '' }: DesignExplorerProps) {
  const [items, setItems] = useState<Design[]>(initialDesigns);
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState(initialQuery);
  const [visible, setVisible] = useState(9);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstRender = useRef(!initialQuery);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const parameters = new URLSearchParams({ category, q: query });
        const response = await fetch(`/api/designs?${parameters.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Filter request failed');
        const data = (await response.json()) as { items: Design[] };
        setItems(data.items);
      } catch (requestError) {
        if (!(requestError instanceof Error && requestError.name === 'AbortError'))
          setError('We could not update the designs. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [category, query]);

  function chooseCategory(value: Category) {
    setCategory(value);
    setVisible(9);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setVisible(9);
  }

  function reset() {
    setCategory('All');
    setQuery('');
    setItems(initialDesigns);
    setVisible(9);
    setError('');
  }

  return (
    <div className="design-explorer">
      <div className="explorer-tools">
        <div className="search-field">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search walnut, island, wardrobe…"
            aria-label="Search designs"
          />
          {query && (
            <button type="button" onClick={() => updateQuery('')} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="results-status" aria-live="polite">
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} /> Updating
            </>
          ) : (
            <>
              {items.length} {items.length === 1 ? 'design' : 'designs'}
            </>
          )}
        </div>
      </div>
      <fieldset className="category-tabs" aria-label="Filter designs by category">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'active' : ''}
            onClick={() => chooseCategory(item)}
            aria-pressed={category === item}
          >
            {item}
          </button>
        ))}
      </fieldset>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {items.length > 0 ? (
        <>
          <div className={`design-grid ${loading ? 'is-loading' : ''}`}>
            {items.slice(0, visible).map((design, index) => (
              <DesignCard
                key={design.slug}
                design={design}
                priority={index < 3 && category === 'All' && !query}
              />
            ))}
          </div>
          {visible < items.length && (
            <div className="show-more-wrap">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setVisible((count) => count + 9)}
              >
                Show more designs
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="empty-state">
            <SearchX size={36} aria-hidden="true" />
            <h3>No designs match that search</h3>
            <p>Try a different material, room or category.</p>
            <button type="button" className="button button-secondary" onClick={reset}>
              Clear filters
            </button>
          </div>
        )
      )}
    </div>
  );
}
