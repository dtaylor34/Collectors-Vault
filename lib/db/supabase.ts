import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
  ?? process.env.EXPO_PUBLIC_SUPABASE_URL
  ?? '';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ── Typed queries ───────────────────────────────────────────────

export async function getCollections(userId: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCollectionItems(collectionId: string) {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveListings(filters?: {
  category?: string;
  metro?: string;
  listType?: string;
}) {
  let query = supabase
    .from('listings')
    .select('*, users!seller_id(vault_id, trust_level, metro_id)')
    .eq('status', 'active')
    .order('ends_at', { ascending: true });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.listType) query = query.eq('list_type', filters.listType);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function placeBid(listingId: string, bidderId: string, amount: number) {
  const { data, error } = await supabase.functions.invoke('validate-bid', {
    body: { listing_id: listingId, bidder_id: bidderId, amount },
  });
  if (error) throw error;
  return data;
}

export async function searchComics(query: string) {
  const { data, error } = await supabase.rpc('search_comics', { query });
  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('vault_id, trust_level, metro_id, transaction_count, is_pro, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getPublicVaults() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, vault_id, trust_level, metro_id, transaction_count, created_at,
      collections(id, name, collectible_type, collection_items(count))
    `)
    .gte('trust_level', 1)
    .eq('collections.privacy', 'public');
  if (error) throw error;
  return data;
}

// ── Realtime subscriptions ──────────────────────────────────────

export function subscribeToBids(listingId: string, callback: (bid: any) => void) {
  return supabase
    .channel(`bids:${listingId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bids',
      filter: `listing_id=eq.${listingId}`,
    }, (payload) => callback(payload.new))
    .subscribe();
}

export function subscribeToConnections(userId: string, callback: (conn: any) => void) {
  return supabase
    .channel(`connections:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'connections',
      filter: `target_id=eq.${userId}`,
    }, (payload) => callback(payload.new))
    .subscribe();
}
