import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_KEY =
  Constants.expoConfig?.extra?.comicvineApiKey ??
  process.env.EXPO_PUBLIC_COMICVINE_API_KEY ??
  '';

const BASE = 'https://comicvine.gamespot.com/api';

// On web, Comic Vine blocks browser requests (CORS).
// Use corsproxy.io as a dev workaround. Remove for production.
function proxyUrl(url: string): string {
  if (Platform.OS === 'web') {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  return url;
}

// Cache to avoid re-fetching
const coverCache: Record<string, string | null> = {};

// Pre-mapped Comic Vine issue IDs for our seed database
// VERIFIED from comicvine.gamespot.com URLs (4000-XXXXX)
const COMICVINE_IDS: Record<string, number> = {
  'hulk-181': 14760,   // Incredible Hulk #181 — 1st Wolverine
  'hulk-180': 14667,   // Incredible Hulk #180 — Wolverine cameo
  'wls-1': 22463,      // Wolverine Limited Series #1
  'gsx-1': 14890,      // Giant-Size X-Men #1
  'asm-129': 105443,   // Amazing Spider-Man #129 — 1st Punisher
};

// For issues not in the verified map, we use title search.
// Maps db_id -> search query for Comic Vine API
const SEARCH_QUERIES: Record<string, string> = {
  'hulk-182': 'Incredible Hulk 182 1974',
  'wls-2': 'Wolverine 2 1982 Claremont Miller',
  'wls-3': 'Wolverine 3 1982 Claremont Miller',
  'wls-4': 'Wolverine 4 1982 Claremont Miller',
  'ms5': 'Marvel Spotlight 5 1972 Ghost Rider',
  'asm-121': 'Amazing Spider-Man 121 Death Gwen Stacy',
  'wbn-32': 'Werewolf by Night 32 Moon Knight',
  'hfh-1': 'Hero for Hire 1 Luke Cage 1972',
  'gl-76': 'Green Lantern 76 1970 Neal Adams',
  'hos-92': 'House of Secrets 92 Swamp Thing',
  'xmen-94': 'X-Men 94 1975 New team',
  'tomb-10': 'Tomb of Dracula 10 Blade 1973',
  'if-14': 'Iron Fist 14 Sabretooth 1977',
};

/**
 * Fetch a cover image URL from Comic Vine by our db_id.
 * Returns the thumb/small URL or null on failure.
 */
export async function getCoverUrl(dbId: string): Promise<string | null> {
  // Check cache first
  if (dbId in coverCache) return coverCache[dbId];

  if (!API_KEY) {
    coverCache[dbId] = null;
    return null;
  }

  // Strategy 1: Use verified Comic Vine ID
  const cvId = COMICVINE_IDS[dbId];
  if (cvId) {
    try {
      const url = `${BASE}/issue/4000-${cvId}/?api_key=${API_KEY}&format=json&field_list=image`;
      const res = await fetch(proxyUrl(url), {
        headers: { 'User-Agent': 'CollectorsVault/1.0' },
      });
      const data = await res.json();
      const imageUrl =
        data?.results?.image?.small_url ??
        data?.results?.image?.thumb_url ??
        data?.results?.image?.medium_url ??
        null;
      if (imageUrl) {
        coverCache[dbId] = imageUrl;
        return imageUrl;
      }
    } catch (err) {
      console.warn('Comic Vine fetch failed for', dbId, err);
    }
  }

  // Strategy 2: Search by title (for unverified IDs)
  const searchQuery = SEARCH_QUERIES[dbId];
  if (searchQuery) {
    try {
      const url = `${BASE}/search/?api_key=${API_KEY}&format=json&resources=issue&query=${encodeURIComponent(searchQuery)}&field_list=image,name&limit=1`;
      const res = await fetch(proxyUrl(url), {
        headers: { 'User-Agent': 'CollectorsVault/1.0' },
      });
      const data = await res.json();
      const imageUrl = data?.results?.[0]?.image?.small_url ?? null;
      coverCache[dbId] = imageUrl;
      return imageUrl;
    } catch (err) {
      console.warn('Comic Vine search failed for', dbId, err);
    }
  }

  coverCache[dbId] = null;
  return null;
}

/**
 * Batch fetch covers for multiple db_ids.
 * Returns a map of dbId -> imageUrl.
 */
export async function batchGetCovers(dbIds: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  // Fetch in parallel but respect rate limit (200/hr = ~3/sec)
  const BATCH_SIZE = 5;
  for (let i = 0; i < dbIds.length; i += BATCH_SIZE) {
    const batch = dbIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (id) => {
      results[id] = await getCoverUrl(id);
    });
    await Promise.all(promises);
    // Small delay between batches
    if (i + BATCH_SIZE < dbIds.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return results;
}

/**
 * Search Comic Vine for an issue by title.
 * Useful for AI-identified items that aren't in our seed DB.
 */
export async function searchCover(query: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const url = `${BASE}/search/?api_key=${API_KEY}&format=json&resources=issue&query=${encodeURIComponent(query)}&field_list=image,name&limit=1`;
    const res = await fetch(proxyUrl(url), {
      headers: { 'User-Agent': 'CollectorsVault/1.0' },
    });
    const data = await res.json();
    return data?.results?.[0]?.image?.small_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Convert a small Comic Vine cover URL to a large version.
 * Comic Vine URLs use /scale_small/, /scale_medium/, /scale_large/, /original/
 */
export function toLargeCoverUrl(smallUrl: string | null): string | null {
  if (!smallUrl) return null;
  return smallUrl
    .replace('/scale_small/', '/scale_large/')
    .replace('/scale_medium/', '/scale_large/')
    .replace('/scale_avatar/', '/scale_large/');
}

export function toOriginalCoverUrl(smallUrl: string | null): string | null {
  if (!smallUrl) return null;
  return smallUrl
    .replace('/scale_small/', '/original/')
    .replace('/scale_medium/', '/original/')
    .replace('/scale_large/', '/original/')
    .replace('/scale_avatar/', '/original/');
}
