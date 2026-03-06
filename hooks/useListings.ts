import { useState, useMemo, useCallback } from 'react';
import {
  SEED_LISTINGS, ANON_USERS, PRICING_DB, METROS,
  fuzzyMatch, getProximity,
  type Listing,
} from '../lib/data';

export function useListings(userMetro: string = 'sf-bay') {
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locFilter, setLocFilter] = useState('all');

  const filtered = useMemo(() => {
    let r = [...listings];

    if (search.length >= 2) {
      const ids = fuzzyMatch(search).map(m => m.db_id);
      r = r.filter(l => ids.includes(l.dbId));
    }

    if (typeFilter === 'auction') r = r.filter(l => l.listType === 'auction');
    if (typeFilter === 'buy_now') r = r.filter(l => l.buyNowPrice !== null);
    if (typeFilter === 'ending') r.sort((a, b) => parseFloat(a.endsIn) - parseFloat(b.endsIn));

    if (locFilter !== 'all') {
      r = r.filter(l => {
        const seller = ANON_USERS.find(u => u.id === l.sellerId);
        if (!seller) return false;
        const prox = getProximity(userMetro, seller.metro);
        if (locFilter === 'local') return prox.label === 'Local';
        if (locFilter === 'state') return prox.label === 'Local' || prox.label === 'Same State';
        if (locFilter === 'region') return prox.label !== 'Other';
        return true;
      });
    }

    return r;
  }, [listings, search, typeFilter, locFilter, userMetro]);

  const placeBid = useCallback((listingId: string, amount: number, vaultId: string = 'Vault #8847') => {
    setListings(prev =>
      prev.map(l => {
        if (l.id !== listingId) return l;
        return {
          ...l,
          currentBid: amount,
          bidCount: l.bidCount + 1,
          bidHistory: [...l.bidHistory, { user: vaultId, amount, time: 'Just now' }],
        };
      })
    );
  }, []);

  const buyNow = useCallback((listingId: string) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
  }, []);

  return {
    listings: filtered,
    allListings: listings,
    search, setSearch,
    typeFilter, setTypeFilter,
    locFilter, setLocFilter,
    placeBid,
    buyNow,
  };
}
