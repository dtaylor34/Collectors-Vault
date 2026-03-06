import { PRICING_DB, type PricingEntry, type CollectibleType } from '../data';

export interface SearchResult extends PricingEntry {
  _score: number;
}

/**
 * Client-side fuzzy search against seed pricing data.
 * In production, use Supabase full-text search + pg_trgm.
 */
export function fuzzySearch(
  query: string,
  category?: CollectibleType,
  db: PricingEntry[] = PRICING_DB,
  limit: number = 10
): SearchResult[] {
  if (!query || query.length < 2) return [];

  const tokens = query
    .toLowerCase()
    .replace(/[#\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return db
    .map(item => {
      const searchable = [
        item.title,
        item.significance,
        item.creators,
        item.publisher,
        String(item.year),
      ].join(' ').toLowerCase();

      let score = 0;

      tokens.forEach(t => {
        if (searchable.includes(t)) score += 10;
        if (item.title.toLowerCase().includes(t)) score += 20;
        if (item.significance?.toLowerCase().includes(t)) score += 15;
      });

      // Bonus for exact title substring match
      if (item.title.toLowerCase().includes(query.toLowerCase())) score += 50;

      return { ...item, _score: score };
    })
    .filter(r => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}
