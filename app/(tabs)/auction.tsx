import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { colors, conditionColors, conditionLabels, rarityColors, trustLevels } from '../../lib/theme';
import { CoverThumbnail } from '../../components';
import {
  SEED_LISTINGS, ANON_USERS, PRICING_DB, METROS, fuzzyMatch, getProximity,
  type Listing, type VaultUser,
} from '../../lib/data';

const USER_METRO = 'sf-bay';

export default function AuctionScreen() {
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locFilter, setLocFilter] = useState('all');
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [toast, setToast] = useState('');

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
        const prox = getProximity(USER_METRO, seller.metro);
        if (locFilter === 'local') return prox.label === 'Local';
        if (locFilter === 'state') return prox.label === 'Local' || prox.label === 'Same State';
        if (locFilter === 'region') return prox.label !== 'Other';
        return true;
      });
    }
    return r;
  }, [listings, search, typeFilter, locFilter]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const placeBid = () => {
    if (!activeListing) return;
    const amt = parseInt(bidAmount);
    const min = (activeListing.currentBid || activeListing.startPrice || 0) + 5;
    if (!amt || amt < min) return;
    const updated = {
      ...activeListing,
      currentBid: amt,
      bidCount: activeListing.bidCount + 1,
      bidHistory: [...activeListing.bidHistory, { user: 'Vault #8847', amount: amt, time: 'Just now' }],
    };
    setListings(prev => prev.map(l => l.id === activeListing.id ? updated : l));
    setActiveListing(updated);
    setBidAmount('');
    showToast(`Bid placed: $${amt.toLocaleString()}`);
  };

  const buyNow = () => {
    if (!activeListing) return;
    const data = PRICING_DB.find(d => d.db_id === activeListing.dbId);
    setListings(prev => prev.filter(l => l.id !== activeListing.id));
    setActiveListing(null);
    showToast(`Purchased: ${data?.title ?? 'Item'}`);
  };

  // ── LISTING DETAIL ────────────────────────────────────────────
  if (activeListing) {
    const data = PRICING_DB.find(d => d.db_id === activeListing.dbId);
    const seller = ANON_USERS.find(u => u.id === activeListing.sellerId);
    if (!data) return null;
    const isAuction = activeListing.listType === 'auction';
    const minBid = (activeListing.currentBid || activeListing.startPrice || 0) + 5;
    const mktVal = data.prices[activeListing.condition] || 0;
    const trust = trustLevels[seller?.trustLevel ?? 0];
    const prox = seller ? getProximity(USER_METRO, seller.metro) : null;
    const metro = seller ? METROS.find(m => m.id === seller.metro) : null;

    return (
      <SafeAreaView style={s.safe}>
        {toast ? <View style={s.toast}><Text style={s.toastText}>✓ {toast}</Text></View> : null}
        <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => { setActiveListing(null); setBidAmount(''); }} style={{ paddingVertical: 16 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>← Auction Block</Text>
          </TouchableOpacity>

          <Text style={s.detailTitle}>{data.title}</Text>
          <Text style={s.detailMeta}>{data.publisher} · {data.year} · {data.creators}</Text>

          <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={[s.badge, { borderColor: conditionColors[activeListing.condition] + '40', backgroundColor: conditionColors[activeListing.condition] + '10' }]}>
              <Text style={[s.badgeText, { color: conditionColors[activeListing.condition] }]}>{conditionLabels[activeListing.condition]?.short}</Text>
            </View>
            <View style={[s.badge, { borderColor: (rarityColors[data.rarity] ?? '#555') + '30', backgroundColor: (rarityColors[data.rarity] ?? '#555') + '10' }]}>
              <Text style={[s.badgeText, { color: rarityColors[data.rarity] ?? '#555', textTransform: 'uppercase', fontSize: 9 }]}>{data.rarity}</Text>
            </View>
            <View style={[s.badge, { borderColor: activeListing.endsIn.startsWith('1d') ? '#E5393530' : '#1a1a35', backgroundColor: activeListing.endsIn.startsWith('1d') ? '#E5393510' : '#1a1a30' }]}>
              <Text style={[s.badgeText, { color: activeListing.endsIn.startsWith('1d') ? colors.red : '#666' }]}>⏱ {activeListing.endsIn}</Text>
            </View>
          </View>

          {/* Seller card */}
          {seller && (
            <View style={s.sellerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.trustIcon, { borderColor: trust.color + '40', backgroundColor: trust.color + '15' }]}>
                  <Text style={{ fontSize: 12, color: trust.color }}>{trust.icon}</Text>
                </View>
                <View>
                  <Text style={s.sellerId}>{seller.vaultId}</Text>
                  <Text style={{ fontSize: 9, color: trust.color }}>{trust.name} · {seller.transactions} deals</Text>
                </View>
              </View>
              {metro && prox && (
                <View style={[s.locBadge, { borderColor: prox.color + '25', backgroundColor: prox.color + '10' }]}>
                  <Text style={[s.locText, { color: prox.color }]}>📍 {metro.label}, {metro.state} · {prox.label}</Text>
                </View>
              )}
            </View>
          )}

          {activeListing.sellerNotes ? (
            <View style={s.notesBox}>
              <Text style={s.notesLabel}>SELLER NOTES</Text>
              <Text style={s.notesText}>"{activeListing.sellerNotes}"</Text>
            </View>
          ) : null}

          {/* Price / Bid section */}
          <View style={s.priceBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 9, color: isAuction ? colors.textSecondary : colors.gold, textTransform: 'uppercase' }}>
                  {isAuction ? (activeListing.currentBid ? `Current (${activeListing.bidCount} bids)` : 'Starting Bid') : 'Buy Now'}
                </Text>
                <Text style={[s.priceMain, { color: isAuction ? colors.green : colors.gold }]}>
                  ${(activeListing.currentBid || activeListing.startPrice || activeListing.buyNowPrice || 0).toLocaleString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>Market</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#666' }}>${mktVal.toLocaleString()}</Text>
              </View>
            </View>

            {isAuction && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Text style={s.dollarSign}>$</Text>
                    <TextInput
                      value={bidAmount}
                      onChangeText={t => setBidAmount(t.replace(/[^0-9]/g, ''))}
                      placeholder={`${minBid}+`}
                      placeholderTextColor={colors.textDark}
                      keyboardType="numeric"
                      style={s.bidInput}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={placeBid}
                    disabled={!bidAmount || parseInt(bidAmount) < minBid}
                    style={[s.bidBtn, (!bidAmount || parseInt(bidAmount) < minBid) && { backgroundColor: '#2a2a4a' }]}
                  >
                    <Text style={[s.bidBtnText, (!bidAmount || parseInt(bidAmount) < minBid) && { color: '#555' }]}>Bid</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Min: ${minBid.toLocaleString()}</Text>
              </>
            )}

            {activeListing.buyNowPrice && (
              <TouchableOpacity onPress={buyNow} style={s.buyNowBtn}>
                <Text style={s.buyNowText}>💰 Buy Now — ${activeListing.buyNowPrice.toLocaleString()}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bid history */}
          {activeListing.bidHistory.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={s.sectionLabel}>BID HISTORY</Text>
              {[...activeListing.bidHistory].reverse().map((b, i) => (
                <View key={i} style={[s.bidRow, i === 0 && { backgroundColor: '#4CAF5008', borderColor: '#4CAF5020' }]}>
                  <Text style={[s.bidUser, i === 0 && { color: colors.green }]}>
                    {b.user} {i === 0 ? '← HIGH' : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={[s.bidAmt, i === 0 && { color: colors.green }]}>${b.amount.toLocaleString()}</Text>
                    <Text style={s.bidTime}>{b.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LISTINGS BROWSE ───────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {toast ? <View style={s.toast}><Text style={s.toastText}>✓ {toast}</Text></View> : null}
      <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 16, marginBottom: 12 }}>
          <Text style={s.pageTitle}>🔨 The Auction Block</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{filtered.length} listings · Anonymous marketplace</Text>
        </View>

        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="Search listings..."
          placeholderTextColor={colors.textDark}
          style={s.searchInput}
        />

        {/* Type filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[{ id: 'all', l: 'All' }, { id: 'auction', l: '🔨 Auctions' }, { id: 'buy_now', l: '💰 Buy Now' }, { id: 'ending', l: '⏱ Ending' }].map(f => (
              <TouchableOpacity key={f.id} onPress={() => setTypeFilter(f.id)}
                style={[s.filterBtn, typeFilter === f.id && s.filterActive]}>
                <Text style={[s.filterText, typeFilter === f.id && s.filterTextActive]}>{f.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Location filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[{ id: 'all', l: '🌎 Anywhere' }, { id: 'local', l: '📍 Local' }, { id: 'state', l: '🗺️ My State' }, { id: 'region', l: '🏔️ Region' }].map(f => (
              <TouchableOpacity key={f.id} onPress={() => setLocFilter(f.id)}
                style={[s.filterBtn, locFilter === f.id && s.filterLocActive]}>
                <Text style={[s.filterText, locFilter === f.id && { color: colors.green }]}>{f.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Listing cards */}
        {filtered.map(listing => {
          const data = PRICING_DB.find(d => d.db_id === listing.dbId);
          const seller = ANON_USERS.find(u => u.id === listing.sellerId);
          if (!data) return null;
          const isAuction = listing.listType === 'auction';
          const price = isAuction ? (listing.currentBid || listing.startPrice) : listing.buyNowPrice;
          const prox = seller ? getProximity(USER_METRO, seller.metro) : null;
          const metro = seller ? METROS.find(m => m.id === seller.metro) : null;
          return (
            <TouchableOpacity key={listing.id} onPress={() => setActiveListing(listing)} style={s.listingCard}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={s.thumb}><CoverThumbnail dbId={listing.dbId} size={52} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.listingTitle} numberOfLines={1}>{data.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{data.publisher} · {data.year}</Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                    <View style={[s.badge, { borderColor: conditionColors[listing.condition] + '40', backgroundColor: conditionColors[listing.condition] + '10' }]}>
                      <Text style={[s.badgeText, { color: conditionColors[listing.condition] }]}>{conditionLabels[listing.condition]?.short}</Text>
                    </View>
                    <View style={[s.badge, { borderColor: '#1a1a35', backgroundColor: listing.endsIn.startsWith('1d') ? '#E5393510' : '#1a1a30' }]}>
                      <Text style={[s.badgeText, { color: listing.endsIn.startsWith('1d') ? colors.red : '#666' }]}>⏱ {listing.endsIn}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.listingFooter}>
                <View>
                  {seller && <Text style={s.sellerSmall}>{seller.vaultId}</Text>}
                  {metro && prox && (
                    <Text style={[{ fontSize: 9, marginTop: 2 }, { color: prox.color }]}>📍 {metro.label} · {prox.label}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, color: isAuction ? colors.textSecondary : colors.gold, textTransform: 'uppercase' }}>
                    {isAuction ? `${listing.bidCount} bid${listing.bidCount !== 1 ? 's' : ''}` : 'Buy Now'}
                  </Text>
                  <Text style={[s.listingPrice, { color: isAuction ? colors.green : colors.gold }]}>
                    ${(price ?? 0).toLocaleString()}
                  </Text>
                  {isAuction && listing.buyNowPrice && (
                    <Text style={{ fontSize: 10, color: colors.gold, fontWeight: '600' }}>BIN: ${listing.buyNowPrice.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 32, opacity: 0.2 }}>🔨</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>No listings match</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  toast: {
    position: 'absolute', top: 60, left: 40, right: 40, zIndex: 999,
    padding: 12, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center',
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#F0F0F0' },
  searchInput: {
    width: '100%', padding: 12, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: '#0A0A18',
    color: colors.textPrimary, fontSize: 14,
  },
  filterBtn: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  filterActive: { borderColor: colors.gold, backgroundColor: '#FFD60010' },
  filterLocActive: { borderColor: colors.green, backgroundColor: '#4CAF5010' },
  filterText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.gold },
  listingCard: {
    padding: 16, borderRadius: 14, marginBottom: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  thumb: {
    width: 52, height: 70, borderRadius: 6, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  listingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  listingFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a1a30',
  },
  sellerSmall: { fontSize: 11, fontWeight: '600', color: '#AAA', fontFamily: 'Courier' },
  listingPrice: { fontSize: 22, fontWeight: '900' },
  badge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  detailTitle: { fontSize: 22, fontWeight: '900', color: '#F0F0F0' },
  detailMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  sellerCard: {
    marginTop: 14, padding: 14, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  trustIcon: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  sellerId: { fontSize: 12, fontWeight: '700', color: '#DDD', fontFamily: 'Courier' },
  locBadge: { marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  locText: { fontSize: 10, fontWeight: '600' },
  notesBox: {
    marginTop: 10, padding: 12, borderRadius: 8,
    backgroundColor: '#0A0A16', borderWidth: 1, borderColor: '#1a1a30',
  },
  notesLabel: { fontSize: 9, color: colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 12, color: '#999', fontStyle: 'italic', lineHeight: 18 },
  priceBox: {
    marginTop: 14, padding: 18, borderRadius: 12,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.borderSubtle,
  },
  priceMain: { fontSize: 30, fontWeight: '900' },
  dollarSign: { position: 'absolute', left: 12, top: 12, color: colors.textMuted, fontSize: 16, fontWeight: '700', zIndex: 1 },
  bidInput: {
    width: '100%', padding: 12, paddingLeft: 28, borderRadius: 8,
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: '#0A0A18',
    color: colors.textPrimary, fontSize: 18, fontWeight: '800',
  },
  bidBtn: {
    paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center',
    backgroundColor: colors.green,
  },
  bidBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  buyNowBtn: {
    width: '100%', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10,
    backgroundColor: colors.gold,
  },
  buyNowText: { fontSize: 14, fontWeight: '800', color: '#000' },
  sectionLabel: { fontSize: 9, letterSpacing: 1.5, color: colors.textMuted, marginBottom: 6 },
  bidRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 8,
    borderRadius: 4, borderWidth: 1, borderColor: 'transparent', marginBottom: 1,
  },
  bidUser: { fontSize: 10, fontWeight: '600', color: '#666', fontFamily: 'Courier' },
  bidAmt: { fontSize: 12, fontWeight: '700', color: '#888' },
  bidTime: { fontSize: 9, color: colors.textDark },
});
