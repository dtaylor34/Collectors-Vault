/**
 * useWantList — Manages want list items and offers
 *
 * Local state for now, Supabase-ready structure.
 *
 * USAGE:
 *   const { wantList, offers, addWant, removeWant, makeOffer, ... } = useWantList();
 */

import { useState, useCallback, useMemo } from 'react';
import {
  SEED_WANT_LIST, SEED_LISTINGS, SEED_COLLECTIONS,
  getWantListMatches,
  type WantListItem, type Offer, type CollectionItem, type Condition,
  type WantPriority, type CollectibleType, type OfferStatus,
} from '../lib/data';

export function useWantList() {
  const [wantList, setWantList] = useState<WantListItem[]>(SEED_WANT_LIST);
  const [offers, setOffers] = useState<Offer[]>([]);

  // ── Want List CRUD ──────────────────────────────────────────
  const addWant = useCallback((item: Omit<WantListItem, 'id' | 'createdAt'>) => {
    const newItem: WantListItem = {
      ...item,
      id: `w-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWantList(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const removeWant = useCallback((id: string) => {
    setWantList(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateWant = useCallback((id: string, updates: Partial<WantListItem>) => {
    setWantList(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const isOnWantList = useCallback((dbId: string) => {
    return wantList.some(w => w.dbId === dbId);
  }, [wantList]);

  // ── Want List Matches ───────────────────────────────────────
  const wantListWithMatches = useMemo(() => {
    return wantList.map(want => ({
      ...want,
      matches: getWantListMatches(want, SEED_LISTINGS),
    }));
  }, [wantList]);

  const totalMatches = useMemo(() => {
    return wantListWithMatches.reduce((sum, w) => sum + w.matches.length, 0);
  }, [wantListWithMatches]);

  // ── Offers CRUD ─────────────────────────────────────────────
  const makeOffer = useCallback((offer: Omit<Offer, 'id' | 'createdAt' | 'status' | 'counterAmount'>) => {
    const newOffer: Offer = {
      ...offer,
      id: `o-${Date.now()}`,
      status: 'pending',
      counterAmount: null,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOffers(prev => [newOffer, ...prev]);
    return newOffer;
  }, []);

  const getOffersForItem = useCallback((dbId: string) => {
    return offers.filter(o => o.dbId === dbId);
  }, [offers]);

  const updateOfferStatus = useCallback((id: string, status: OfferStatus, counterAmount?: number) => {
    setOffers(prev => prev.map(o =>
      o.id === id ? { ...o, status, counterAmount: counterAmount ?? o.counterAmount } : o
    ));
  }, []);

  // ── Save to Collection ──────────────────────────────────────
  const [collections, setCollections] = useState(SEED_COLLECTIONS);

  const addToCollection = useCallback((collectionId: string, dbId: string, condition: Condition) => {
    const newItem: CollectionItem = {
      id: `i-${Date.now()}`,
      matchId: dbId,
      condition,
      photo: null,
      userNotes: '',
      source: 'database',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, items: [...c.items, newItem] } : c
    ));
    return newItem;
  }, []);

  const isInCollection = useCallback((dbId: string) => {
    return collections.some(c => c.items.some(i => i.matchId === dbId));
  }, [collections]);

  return {
    // Want List
    wantList,
    wantListWithMatches,
    totalMatches,
    addWant,
    removeWant,
    updateWant,
    isOnWantList,
    // Offers
    offers,
    makeOffer,
    getOffersForItem,
    updateOfferStatus,
    // Collections
    collections,
    setCollections,
    addToCollection,
    isInCollection,
  };
}
