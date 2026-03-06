const API_KEY = process.env.EXPO_PUBLIC_COMICVINE_API_KEY ?? '';

const BASE = 'https://comicvine.gamespot.com/api';

// CORS proxy needed for web — Comic Vine doesn't send CORS headers.
// On native (iOS/Android) this isn't needed. In production, route through your Edge Function.
const PROXY = 'https://corsproxy.io/?';

function buildUrl(path: string, params: Record<string, string> = {}) {
  const allParams = new URLSearchParams({
    api_key: API_KEY,
    format: 'json',
    ...params,
  });
  const url = `${BASE}${path}?${allParams.toString()}`;
  // Use proxy on web, direct on native
  if (typeof window !== 'undefined' && window.document) {
    return `${PROXY}${encodeURIComponent(url)}`;
  }
  return url;
}

export interface ComicVineIssue {
  id: number;
  name: string | null;
  issue_number: string;
  cover_date: string | null;
  image: {
    icon_url: string;
    medium_url: string;
    screen_url: string;
    screen_large_url: string;
    small_url: string;
    super_url: string;
    thumb_url: string;
    tiny_url: string;
    original_url: string;
  };
  volume: {
    id: number;
    name: string;
  };
  description: string | null;
}

export interface ComicVineSearchResult {
  error: string;
  number_of_total_results: number;
  results: ComicVineIssue[];
}

/**
 * Search Comic Vine for an issue by title.
 * Returns the best match with cover image URL.
 */
export async function searchIssue(query: string): Promise<ComicVineIssue | null> {
  try {
    const url = buildUrl('/search', {
      resources: 'issue',
      query,
      field_list: 'id,name,issue_number,cover_date,image,volume,description',
      limit: '5',
    });

    const res = await fetch(url);
    const data: ComicVineSearchResult = await res.json();

    if (data.error === 'OK' && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error('Comic Vine search error:', err);
    return null;
  }
}

/**
 * Get a specific issue by Comic Vine ID.
 */
export async function getIssue(cvId: number): Promise<ComicVineIssue | null> {
  try {
    const url = buildUrl(`/issue/4000-${cvId}`, {
      field_list: 'id,name,issue_number,cover_date,image,volume,description',
    });

    const res = await fetch(url);
    const data = await res.json();

    if (data.error === 'OK' && data.results) {
      return data.results;
    }
    return null;
  } catch (err) {
    console.error('Comic Vine get issue error:', err);
    return null;
  }
}

/**
 * Search for cover image URL by title string.
 * Returns the medium_url (300px wide) or null.
 */
export async function getCoverUrl(title: string): Promise<string | null> {
  const issue = await searchIssue(title);
  return issue?.image?.medium_url ?? null;
}

// ── Batch: map our pricing DB ids to Comic Vine covers ──────────

// Pre-mapped Comic Vine IDs for our seed data (saves API calls)
// These are the actual Comic Vine issue IDs for each book
export const CV_ISSUE_MAP: Record<string, number> = {
  'hulk-181': 23551,    // Incredible Hulk #181
  'hulk-180': 23550,    // Incredible Hulk #180
  'hulk-182': 23552,    // Incredible Hulk #182
  'wls-1': 38924,       // Wolverine Limited Series #1
  'wls-2': 38925,       // Wolverine Limited Series #2
  'wls-3': 38926,       // Wolverine Limited Series #3
  'wls-4': 38927,       // Wolverine Limited Series #4
  'gsx-1': 21463,       // Giant-Size X-Men #1
  'ms5': 18498,         // Marvel Spotlight #5
  'asm-129': 22625,     // Amazing Spider-Man #129
  'asm-121': 22617,     // Amazing Spider-Man #121
  'wbn-32': 26330,      // Werewolf by Night #32
  'hfh-1': 22001,       // Hero for Hire #1
  'gl-76': 14966,       // Green Lantern #76
  'hos-92': 16741,      // House of Secrets #92
  'xmen-94': 14543,     // X-Men #94
  'tomb-10': 18746,     // Tomb of Dracula #10
  'if-14': 25414,       // Iron Fist #14
};

// In-memory cache so we don't re-fetch
const coverCache: Record<string, string> = {};

/**
 * Get cover URL for a pricing DB entry.
 * Uses pre-mapped CV IDs for seed data, falls back to search.
 */
export async function getCoverForDbId(dbId: string, title: string): Promise<string | null> {
  // Check cache first
  if (coverCache[dbId]) return coverCache[dbId];

  const cvId = CV_ISSUE_MAP[dbId];

  try {
    let coverUrl: string | null = null;

    if (cvId) {
      // Use direct ID lookup (faster, more accurate)
      const issue = await getIssue(cvId);
      coverUrl = issue?.image?.medium_url ?? null;
    } else {
      // Fall back to search
      coverUrl = await getCoverUrl(title);
    }

    if (coverUrl) {
      coverCache[dbId] = coverUrl;
    }
    return coverUrl;
  } catch {
    return null;
  }
}
