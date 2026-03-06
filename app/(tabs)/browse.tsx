import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal,
  StyleSheet, SafeAreaView, Dimensions, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { conditionColors, conditionLabels, trustLevels, rarityColors } from '../../lib/theme';
import {
  ANON_USERS, PUBLIC_COLLECTIONS, PRICING_DB, METROS, SEED_LISTINGS,
  COLLECTIBLE_TYPES, AFFILIATE_PARTNERS, CATEGORY_CONDITIONS,
  PRIORITY_LABELS, CONDITION_RANK,
  getProximity, fuzzyMatch, getWantListMatches,
  generatePriceTrend, filterTrendByRange, getItemHistory,
  type VaultUser, type CollectibleType, type PricingEntry,
  type Condition, type WantPriority, type HistoryEntry, type TimeRange,
} from '../../lib/data';
import { CoverThumbnail, AffiliateLinks } from '../../components';
import { PriceTrendChart } from '../../components/PriceTrendChart';
import { getCoverUrl, toLargeCoverUrl, toOriginalCoverUrl } from '../../lib/comicvine';
import { useWantList } from '../../hooks/useWantList';

const USER_METRO = 'sf-bay';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DISTANCE_OPTIONS = [
  { id: 'any', label: 'Anywhere', miles: null },
  { id: 'local', label: 'Local', miles: 25 },
  { id: '50', label: '< 50 mi', miles: 50 },
  { id: '100', label: '< 100 mi', miles: 100 },
  { id: '250', label: '< 250 mi', miles: 250 },
];

type SearchTab = 'items' | 'vaults' | 'listings';

export default function BrowseScreen() {
  const { colors } = useTheme();
  const {
    wantList, addWant, removeWant, isOnWantList,
    offers, makeOffer, getOffersForItem,
    collections, addToCollection, isInCollection,
  } = useWantList();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('items');
  const [typeFilter, setTypeFilter] = useState<CollectibleType | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('any');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingReqs, setPendingReqs] = useState<string[]>([]);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWantModal, setShowWantModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [saveCondition, setSaveCondition] = useState<Condition>('nm');
  const [saveCollId, setSaveCollId] = useState<string | null>(null);
  const [wantMinCond, setWantMinCond] = useState<Condition>('good');
  const [wantMaxPrice, setWantMaxPrice] = useState('');
  const [wantPriority, setWantPriority] = useState<WantPriority>(3);
  const [wantNotes, setWantNotes] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerCondition, setOfferCondition] = useState<Condition>('nm');
  const [offerTargetVault, setOfferTargetVault] = useState('');
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  }, []);

  // Load cover for detail view
  useEffect(() => {
    if (viewingItemId) {
      setCoverUrl(null);
      getCoverUrl(viewingItemId).then(url => setCoverUrl(url));
    }
  }, [viewingItemId]);

  // ── Search results ──────────────────────────────────────────
  const itemResults = useMemo(() => {
    let results = query.length < 2 ? PRICING_DB.slice(0, 12) : fuzzyMatch(query);
    if (typeFilter !== 'all') {
      // Filter by publisher mapping for comics
      // In production this would be a proper category field
      results = results.filter(r => {
        if (typeFilter === 'comics') return true; // all seed data is comics
        return false;
      });
    }
    return results;
  }, [query, typeFilter]);

  const vaultResults = useMemo(() => {
    let results = ANON_USERS.filter(u => {
      const colls = PUBLIC_COLLECTIONS.filter(c => c.ownerId === u.id);
      return colls.length > 0;
    });
    if (locationFilter !== 'any') {
      results = results.filter(u => {
        const prox = getProximity(USER_METRO, u.metro);
        if (locationFilter === 'local') return prox.label === 'Local';
        if (locationFilter === '50') return prox.label === 'Local' || prox.label === 'Same State';
        if (locationFilter === '100') return prox.label !== 'Other';
        return true;
      });
    }
    if (query.length >= 2) {
      const q = query.toLowerCase();
      results = results.filter(u => {
        const colls = PUBLIC_COLLECTIONS.filter(c => c.ownerId === u.id);
        return u.vaultId.toLowerCase().includes(q) ||
          colls.some(c => c.name.toLowerCase().includes(q));
      });
    }
    return results;
  }, [query, locationFilter]);

  const listingResults = useMemo(() => {
    let results = [...SEED_LISTINGS];
    if (query.length >= 2) {
      const ids = fuzzyMatch(query).map(m => m.db_id);
      results = results.filter(l => ids.includes(l.dbId));
    }
    if (locationFilter !== 'any') {
      results = results.filter(l => {
        const seller = ANON_USERS.find(u => u.id === l.sellerId);
        if (!seller) return false;
        const prox = getProximity(USER_METRO, seller.metro);
        if (locationFilter === 'local') return prox.label === 'Local';
        return true;
      });
    }
    return results;
  }, [query, locationFilter]);


  // ══════════════════════════════════════════════════════════════
  // LIGHTBOX MODAL
  // ══════════════════════════════════════════════════════════════
  const lightboxUrl = toOriginalCoverUrl(coverUrl) ?? toLargeCoverUrl(coverUrl);

  const renderLightbox = () => (
    <Modal visible={showLightbox} transparent animationType="fade" onRequestClose={() => setShowLightbox(false)}>
      <Pressable onPress={() => setShowLightbox(false)} style={[s.lightboxOverlay, { backgroundColor: colors.scrim }]}>
        <View style={s.lightboxContainer}>
          {/* Close button */}
          <TouchableOpacity onPress={() => setShowLightbox(false)} style={s.lightboxClose}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Zoomable image */}
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            centerContent
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {lightboxUrl ? (
              <Image
                source={{ uri: lightboxUrl }}
                style={{ width: SCREEN_W * 0.9, height: SCREEN_H * 0.75 }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="image-not-supported" size={48} color="#555" />
                <Text style={{ color: '#888', marginTop: 10 }}>No cover available</Text>
              </View>
            )}
          </ScrollView>

          {/* Zoom hint */}
          <View style={s.lightboxHint}>
            <MaterialIcons name="pinch" size={14} color="#aaa" />
            <Text style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>Pinch or scroll to zoom</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );


  // ══════════════════════════════════════════════════════════════
  // ITEM DETAIL VIEW
  // ══════════════════════════════════════════════════════════════
  const viewingItem = PRICING_DB.find(d => d.db_id === viewingItemId);
  if (viewingItem) {
    const rarColor = rarityColors[viewingItem.rarity] ?? colors.onSurfaceVariant;
    const largeCover = toLargeCoverUrl(coverUrl);

    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        {renderLightbox()}
        <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Back */}
          <TouchableOpacity onPress={() => setViewingItemId(null)}
            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Search Results</Text>
          </TouchableOpacity>

          {/* Large cover with zoom button */}
          <TouchableOpacity
            onPress={() => setShowLightbox(true)}
            activeOpacity={0.8}
            style={[s.coverContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}
          >
            {largeCover ? (
              <Image
                source={{ uri: largeCover }}
                style={{ width: '100%', height: 380 }}
                resizeMode="contain"
              />
            ) : (
              <CoverThumbnail dbId={viewingItem.db_id} size={200} />
            )}
            {/* Zoom overlay */}
            <View style={s.zoomBadge}>
              <MaterialIcons name="zoom-in" size={18} color="#fff" />
              <Text style={{ fontSize: 10, color: '#fff', marginLeft: 4 }}>Tap to zoom</Text>
            </View>
          </TouchableOpacity>

          {/* Title & Publisher */}
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.onSurface, marginTop: 16 }}>
            {viewingItem.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 }}>
            {viewingItem.publisher} · {viewingItem.year}
          </Text>
          {viewingItem.creators ? (
            <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 }}>
              {viewingItem.creators}
            </Text>
          ) : null}

          {/* Rarity + badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <View style={[s.badge, { borderColor: rarColor + '40', backgroundColor: rarColor + '15' }]}>
              <MaterialIcons name="diamond" size={12} color={rarColor} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: rarColor, marginLeft: 4 }}>{viewingItem.rarity}</Text>
            </View>
            <View style={[s.badge, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}>
              <MaterialIcons name="menu-book" size={12} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginLeft: 4 }}>Comics</Text>
            </View>
          </View>

          {/* Key Issue / Significance */}
          {viewingItem.significance ? (
            <View style={[s.significanceBox, { backgroundColor: colors.primaryContainer, borderColor: colors.gold + '30' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MaterialIcons name="star" size={14} color={colors.gold} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.gold, letterSpacing: 1 }}>KEY ISSUE</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.onSurface, lineHeight: 20 }}>
                {viewingItem.significance}
              </Text>
            </View>
          ) : null}

          {/* ── COMIC DETAILS ────────────────────────────── */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <MaterialIcons name="info-outline" size={16} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>DETAILS</Text>
            </View>
            <View style={[s.detailsGrid, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              {/* Row 1 */}
              <View style={s.detailsRow}>
                {viewingItem.writer && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.success }]}>Writer</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.writer}</Text>
                  </View>
                )}
                {viewingItem.artist && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.success }]}>Artist</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.artist}</Text>
                  </View>
                )}
                {viewingItem.coverArtist && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.success }]}>Cover Artist</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.coverArtist}</Text>
                  </View>
                )}
                <View style={s.detailCell}>
                  <Text style={[s.detailLabel, { color: colors.success }]}>Publisher</Text>
                  <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.publisher}</Text>
                </View>
              </View>

              {/* Row 2 — more credits */}
              {(viewingItem.inker || viewingItem.colorist || viewingItem.letterer) && (
                <View style={[s.detailsRow, { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: 12 }]}>
                  {viewingItem.inker && (
                    <View style={s.detailCell}>
                      <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Inker</Text>
                      <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.inker}</Text>
                    </View>
                  )}
                  {viewingItem.colorist && (
                    <View style={s.detailCell}>
                      <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Colorist</Text>
                      <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.colorist}</Text>
                    </View>
                  )}
                  {viewingItem.letterer && (
                    <View style={s.detailCell}>
                      <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Letterer</Text>
                      <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.letterer}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Row 3 — publication info */}
              <View style={[s.detailsRow, { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: 12 }]}>
                {viewingItem.editor && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Editor</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.editor}</Text>
                  </View>
                )}
                {viewingItem.publicationDate && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Publication Date</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.publicationDate}</Text>
                  </View>
                )}
                {viewingItem.coverPrice && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Cover Price</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.coverPrice}</Text>
                  </View>
                )}
                {viewingItem.pageCount && (
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>Page Count</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.pageCount} pages</Text>
                  </View>
                )}
              </View>

              {/* About row */}
              {viewingItem.about && (
                <View style={[s.detailsRow, { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: 12 }]}>
                  <View style={s.detailCell}>
                    <Text style={[s.detailLabel, { color: colors.onSurfaceVariant }]}>About</Text>
                    <Text style={[s.detailValue, { color: colors.onSurface }]}>{viewingItem.about}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Price Guide Table */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MaterialIcons name="analytics" size={16} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>PRICE GUIDE</Text>
            </View>
            <View style={[s.priceTable, { borderColor: colors.outline }]}>
              {Object.entries(viewingItem.prices).map(([cond, val], idx) => {
                const condColor = conditionColors[cond] ?? '#888';
                const label = conditionLabels[cond]?.full ?? cond;
                const shortLabel = conditionLabels[cond]?.short ?? cond;
                const isTop = cond === 'cgc_9_8';
                return (
                  <View key={cond} style={[s.priceRow, {
                    backgroundColor: idx % 2 === 0 ? colors.surface : colors.surfaceContainer,
                    borderBottomWidth: idx < 5 ? 1 : 0,
                    borderBottomColor: colors.outline,
                  }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={[s.condDot, { backgroundColor: condColor }]} />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurface }}>{shortLabel}</Text>
                        <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{label}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: isTop ? colors.gold : colors.onSurface }}>
                      ${val.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Market summary */}
          <View style={[s.marketRow, { borderColor: colors.outline }]}>
            <View style={[s.marketCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>LOW</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.error, marginTop: 4 }}>
                ${viewingItem.prices.poor?.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 }}>Poor</Text>
            </View>
            <View style={[s.marketCard, { backgroundColor: colors.surface, borderColor: colors.gold + '30', borderWidth: 1 }]}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gold, letterSpacing: 1 }}>MID</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.gold, marginTop: 4 }}>
                ${viewingItem.prices.nm?.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 }}>Near Mint</Text>
            </View>
            <View style={[s.marketCard, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>HIGH</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.success, marginTop: 4 }}>
                ${viewingItem.prices.cgc_9_8?.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 }}>CGC 9.8</Text>
            </View>
          </View>

          {/* ── PRICE TREND CHART ────────────────────────── */}
          {(() => {
            const trend = generatePriceTrend(viewingItem);
            return (
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <MaterialIcons name="trending-up" size={16} color={colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>PRICE TRENDS</Text>
                </View>
                <View style={[s.chartContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                  <PriceTrendChart
                    colors={colors}
                    trendData={trend}
                    lineConfig={[
                      { label: 'Good (Low)', color: colors.error, key: 'low' },
                      { label: 'NM (Mid)', color: colors.gold, key: 'mid' },
                      { label: 'CGC 9.8 (High)', color: colors.success, key: 'high' },
                    ]}
                    height={180}
                  />
                </View>
              </View>
            );
          })()}

          {/* ── ITEM HISTORY ─────────────────────────────── */}
          {(() => {
            const history = getItemHistory(viewingItem.db_id);
            if (history.length === 0) return null;
            const showAll = history.length <= 5;
            const displayed = showAll ? history : history.slice(0, 5);
            return (
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <MaterialIcons name="history" size={16} color={colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>
                    HISTORY & NOTABLE EVENTS
                  </Text>
                </View>
                {displayed.map((h, idx) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => {
                      if (h.sourceUrl) {
                        import('react-native').then(({ Linking }) => Linking.openURL(h.sourceUrl));
                      }
                    }}
                    style={[s.historyCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      {/* Timeline dot */}
                      <View style={{ alignItems: 'center', paddingTop: 2 }}>
                        <View style={[s.timelineDot, { backgroundColor: idx === 0 ? colors.gold : colors.onSurfaceVariant }]} />
                        {idx < displayed.length - 1 && (
                          <View style={[s.timelineLine, { backgroundColor: colors.outline }]} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, color: colors.onSurfaceVariant, marginBottom: 2 }}>
                          {h.date}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface, marginBottom: 4 }}>
                          {h.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 6 }}>
                          {h.summary}
                        </Text>
                        {h.sourceUrl ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="open-in-new" size={12} color={colors.secondary} />
                            <Text style={{ fontSize: 10, color: colors.secondary, fontWeight: '600' }}>{h.source}</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{h.source}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {!showAll && (
                  <TouchableOpacity style={[s.viewAllBtn, { borderColor: colors.outline }]}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.secondary }}>
                      View All History ({history.length} entries)
                    </Text>
                    <MaterialIcons name="arrow-forward" size={14} color={colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}

          {/* Affiliate links */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MaterialIcons name="storefront" size={16} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>BUY / RESEARCH</Text>
            </View>
            <AffiliateLinks category="comics" searchTerms={viewingItem.title} />
          </View>

          {/* ── ACTION BUTTONS ────────────────────────────── */}
          <View style={{ marginTop: 20, gap: 8 }}>
            {/* Save to Collection */}
            <TouchableOpacity
              onPress={() => { setSaveCollId(collections[0]?.id ?? null); setShowSaveModal(true); }}
              style={[s.actionBtn, {
                backgroundColor: isInCollection(viewingItem.db_id) ? colors.success + '15' : colors.primaryContainer,
                borderColor: isInCollection(viewingItem.db_id) ? colors.success : colors.gold,
              }]}
            >
              <MaterialIcons
                name={isInCollection(viewingItem.db_id) ? 'check-circle' : 'add-circle-outline'}
                size={20}
                color={isInCollection(viewingItem.db_id) ? colors.success : colors.gold}
              />
              <Text style={{ fontSize: 14, fontWeight: '700', color: isInCollection(viewingItem.db_id) ? colors.success : colors.gold, marginLeft: 8 }}>
                {isInCollection(viewingItem.db_id) ? 'In Your Collection' : 'Save to Collection'}
              </Text>
            </TouchableOpacity>

            {/* Add to Want List */}
            <TouchableOpacity
              onPress={() => {
                if (isOnWantList(viewingItem.db_id)) {
                  const existing = wantList.find(w => w.dbId === viewingItem.db_id);
                  if (existing) removeWant(existing.id);
                  showToast('Removed from Want List');
                } else {
                  setWantMaxPrice(String(viewingItem.prices.nm));
                  setWantMinCond('good');
                  setWantPriority(3);
                  setWantNotes('');
                  setShowWantModal(true);
                }
              }}
              style={[s.actionBtn, {
                backgroundColor: isOnWantList(viewingItem.db_id) ? '#FF980015' : colors.surface,
                borderColor: isOnWantList(viewingItem.db_id) ? colors.warning : colors.outline,
              }]}
            >
              <MaterialIcons
                name={isOnWantList(viewingItem.db_id) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isOnWantList(viewingItem.db_id) ? colors.warning : colors.onSurfaceVariant}
              />
              <Text style={{ fontSize: 14, fontWeight: '700', color: isOnWantList(viewingItem.db_id) ? colors.warning : colors.onSurfaceVariant, marginLeft: 8 }}>
                {isOnWantList(viewingItem.db_id) ? 'On Your Want List' : 'Add to Want List'}
              </Text>
            </TouchableOpacity>

            {/* Make Offer */}
            <TouchableOpacity
              onPress={() => {
                setOfferAmount('');
                setOfferNotes('');
                setOfferCondition('nm');
                setOfferTargetVault('');
                setShowOfferModal(true);
              }}
              style={[s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.secondary }]}
            >
              <MaterialIcons name="local-offer" size={20} color={colors.secondary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.secondary, marginLeft: 8 }}>Make an Offer</Text>
            </TouchableOpacity>
          </View>

          {/* Toast */}
          {actionToast && (
            <View style={[s.toast, { backgroundColor: colors.success }]}>
              <MaterialIcons name="check-circle" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>{actionToast}</Text>
            </View>
          )}

          {/* ── SAVE TO COLLECTION MODAL ─────────────────── */}
          <Modal visible={showSaveModal} transparent animationType="slide" onRequestClose={() => setShowSaveModal(false)}>
            <Pressable onPress={() => setShowSaveModal(false)} style={[s.modalOverlay, { backgroundColor: colors.scrim }]}>
              <Pressable onPress={() => {}} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
                <View style={s.modalHandle} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 4 }}>Save to Collection</Text>
                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16 }}>{viewingItem.title}</Text>

                {/* Condition picker */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>CONDITION YOU OWN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {CATEGORY_CONDITIONS.comics.map(c => (
                      <TouchableOpacity key={c.id} onPress={() => setSaveCondition(c.id as Condition)}
                        style={[s.chip, {
                          borderColor: saveCondition === c.id ? conditionColors[c.id] : colors.outline,
                          backgroundColor: saveCondition === c.id ? conditionColors[c.id] + '15' : 'transparent',
                        }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: saveCondition === c.id ? conditionColors[c.id] : colors.onSurfaceVariant }}>
                          {c.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Collection picker */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>COLLECTION</Text>
                {collections.map(col => (
                  <TouchableOpacity key={col.id} onPress={() => setSaveCollId(col.id)}
                    style={[s.collOption, {
                      borderColor: saveCollId === col.id ? colors.gold : colors.outline,
                      backgroundColor: saveCollId === col.id ? colors.primaryContainer : 'transparent',
                    }]}>
                    <Text style={{ fontSize: 13, fontWeight: saveCollId === col.id ? '700' : '400', color: saveCollId === col.id ? colors.gold : colors.onSurface }}>
                      {col.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{col.items.length} items</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => {
                    if (saveCollId) {
                      addToCollection(saveCollId, viewingItem.db_id, saveCondition);
                      setShowSaveModal(false);
                      showToast('Added to collection!');
                    }
                  }}
                  style={[s.modalPrimaryBtn, { backgroundColor: colors.gold }]}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#000' }}>Save Item</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* ── WANT LIST MODAL ──────────────────────────── */}
          <Modal visible={showWantModal} transparent animationType="slide" onRequestClose={() => setShowWantModal(false)}>
            <Pressable onPress={() => setShowWantModal(false)} style={[s.modalOverlay, { backgroundColor: colors.scrim }]}>
              <Pressable onPress={() => {}} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
                <View style={s.modalHandle} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 4 }}>Add to Want List</Text>
                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16 }}>{viewingItem.title}</Text>

                {/* Minimum condition */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>MINIMUM CONDITION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {CATEGORY_CONDITIONS.comics.map(c => (
                      <TouchableOpacity key={c.id} onPress={() => setWantMinCond(c.id as Condition)}
                        style={[s.chip, {
                          borderColor: wantMinCond === c.id ? conditionColors[c.id] : colors.outline,
                          backgroundColor: wantMinCond === c.id ? conditionColors[c.id] + '15' : 'transparent',
                        }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: wantMinCond === c.id ? conditionColors[c.id] : colors.onSurfaceVariant }}>
                          {c.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Max price */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>MAX PRICE</Text>
                <View style={[s.modalInput, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
                  <Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>$</Text>
                  <TextInput
                    value={wantMaxPrice}
                    onChangeText={setWantMaxPrice}
                    keyboardType="numeric"
                    style={{ flex: 1, fontSize: 16, color: colors.onSurface, marginLeft: 4, padding: 0 }}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                </View>

                {/* Priority */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>PRIORITY</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                  {([1, 2, 3, 4, 5] as WantPriority[]).map(p => {
                    const pl = PRIORITY_LABELS[p];
                    return (
                      <TouchableOpacity key={p} onPress={() => setWantPriority(p)}
                        style={[s.chip, { flex: 1, justifyContent: 'center',
                          borderColor: wantPriority === p ? pl.color : colors.outline,
                          backgroundColor: wantPriority === p ? pl.color + '15' : 'transparent',
                        }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: wantPriority === p ? pl.color : colors.onSurfaceVariant, textAlign: 'center' }}>
                          {pl.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Notes */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>DETAILS (OPTIONAL)</Text>
                <TextInput
                  value={wantNotes}
                  onChangeText={setWantNotes}
                  placeholder="CGC preferred, blue label only, etc."
                  placeholderTextColor={colors.onSurfaceVariant}
                  multiline
                  style={[s.modalTextArea, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]}
                />

                <TouchableOpacity
                  onPress={() => {
                    addWant({
                      dbId: viewingItem.db_id,
                      title: viewingItem.title,
                      category: 'comics',
                      minCondition: wantMinCond,
                      maxPrice: parseInt(wantMaxPrice) || viewingItem.prices.nm,
                      priority: wantPriority,
                      notes: wantNotes,
                    });
                    setShowWantModal(false);
                    showToast('Added to Want List!');
                  }}
                  style={[s.modalPrimaryBtn, { backgroundColor: colors.warning }]}>
                  <MaterialIcons name="bookmark-add" size={18} color="#000" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginLeft: 6 }}>Add to Want List</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* ── MAKE OFFER MODAL ─────────────────────────── */}
          <Modal visible={showOfferModal} transparent animationType="slide" onRequestClose={() => setShowOfferModal(false)}>
            <Pressable onPress={() => setShowOfferModal(false)} style={[s.modalOverlay, { backgroundColor: colors.scrim }]}>
              <Pressable onPress={() => {}} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
                <View style={s.modalHandle} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 4 }}>Make an Offer</Text>
                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 6 }}>{viewingItem.title}</Text>
                <Text style={{ fontSize: 11, color: colors.gold, marginBottom: 16 }}>
                  Market: ${viewingItem.prices.nm.toLocaleString()} (NM)
                </Text>

                {/* Condition desired */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>CONDITION DESIRED</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {CATEGORY_CONDITIONS.comics.map(c => (
                      <TouchableOpacity key={c.id} onPress={() => setOfferCondition(c.id as Condition)}
                        style={[s.chip, {
                          borderColor: offerCondition === c.id ? conditionColors[c.id] : colors.outline,
                          backgroundColor: offerCondition === c.id ? conditionColors[c.id] + '15' : 'transparent',
                        }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: offerCondition === c.id ? conditionColors[c.id] : colors.onSurfaceVariant }}>
                          {c.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Offer amount */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>YOUR OFFER</Text>
                <View style={[s.modalInput, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.onSurfaceVariant }}>$</Text>
                  <TextInput
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                    keyboardType="numeric"
                    style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.onSurface, marginLeft: 4, padding: 0 }}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                  />
                </View>

                {/* Target vault (optional — for direct offers) */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>TO VAULT (OPTIONAL)</Text>
                <TextInput
                  value={offerTargetVault}
                  onChangeText={setOfferTargetVault}
                  placeholder="Leave blank for open offer to any seller"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[s.modalTextArea, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface, height: 44 }]}
                />

                {/* Notes */}
                <Text style={[s.modalLabel, { color: colors.onSurfaceVariant }]}>MESSAGE</Text>
                <TextInput
                  value={offerNotes}
                  onChangeText={setOfferNotes}
                  placeholder="Interested in this book, flexible on condition..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  multiline
                  style={[s.modalTextArea, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]}
                />

                <TouchableOpacity
                  onPress={() => {
                    const amt = parseInt(offerAmount);
                    if (!amt || amt <= 0) return;
                    makeOffer({
                      dbId: viewingItem.db_id,
                      fromVaultId: 'u-self',
                      toVaultId: offerTargetVault || 'open',
                      listingId: null,
                      condition: offerCondition,
                      offerAmount: amt,
                      notes: offerNotes,
                    });
                    setShowOfferModal(false);
                    showToast(`Offer of $${amt.toLocaleString()} sent!`);
                  }}
                  style={[s.modalPrimaryBtn, { backgroundColor: colors.secondary }]}>
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginLeft: 6 }}>Send Offer</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Active listings for this item */}
          {(() => {
            const listings = SEED_LISTINGS.filter(l => l.dbId === viewingItem.db_id);
            if (listings.length === 0) return null;
            return (
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <MaterialIcons name="gavel" size={16} color={colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>
                    ACTIVE LISTINGS ({listings.length})
                  </Text>
                </View>
                {listings.map(listing => {
                  const seller = ANON_USERS.find(u => u.id === listing.sellerId);
                  const price = listing.listType === 'auction' ? (listing.currentBid || listing.startPrice) : listing.buyNowPrice;
                  return (
                    <View key={listing.id} style={[s.listingCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          <View style={[s.tinyBadge, { borderColor: conditionColors[listing.condition] + '40', backgroundColor: conditionColors[listing.condition] + '10' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: conditionColors[listing.condition] }}>
                              {conditionLabels[listing.condition]?.short ?? listing.condition}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                            {listing.listType === 'auction' ? 'Auction' : 'Buy Now'} · {listing.endsIn}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 }}>
                          {seller?.vaultId}
                          {listing.bidCount > 0 ? ` · ${listing.bidCount} bids` : ''}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.gold }}>${price?.toLocaleString()}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}

        </ScrollView>
      </SafeAreaView>
    );
  }


  // ══════════════════════════════════════════════════════════════
  // VAULT PROFILE DETAIL
  // ══════════════════════════════════════════════════════════════
  const viewingUser = ANON_USERS.find(u => u.id === viewingId);
  if (viewingUser) {
    const trust = trustLevels[viewingUser.trustLevel];
    const metro = METROS.find(m => m.id === viewingUser.metro);
    const prox = getProximity(USER_METRO, viewingUser.metro);
    const colls = PUBLIC_COLLECTIONS.filter(c => c.ownerId === viewingUser.id);
    const isPending = pendingReqs.includes(viewingUser.id);

    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => setViewingId(null)}
            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Search Results</Text>
          </TouchableOpacity>

          <View style={[s.profileCard, { backgroundColor: colors.surface, borderColor: trust.color + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.bigTrustIcon, { borderColor: trust.color + '60', backgroundColor: trust.color + '15' }]}>
                <MaterialIcons name={trust.icon as any} size={22} color={trust.color} />
              </View>
              <View>
                <Text style={[s.profileVaultId, { color: colors.onSurface }]}>{viewingUser.vaultId}</Text>
                <Text style={{ fontSize: 10, color: trust.color, fontWeight: '600' }}>{trust.name} · {viewingUser.transactions} deals</Text>
              </View>
            </View>
            {metro && (
              <View style={[s.locBadge, { borderColor: prox.color + '25', backgroundColor: prox.color + '10' }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: prox.color }}>{metro.label}, {metro.state} · {prox.label}</Text>
              </View>
            )}
            <View style={s.statsRow}>
              {[
                { num: viewingUser.transactions, label: 'Deals', color: colors.onSurface },
                { num: viewingUser.publicCollections, label: 'Public', color: colors.onSurface },
                { num: trust.name, label: 'Trust', color: trust.color },
              ].map(st => (
                <View key={st.label} style={[s.statBox, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[s.statNum, { color: st.color }]}>{st.num}</Text>
                  <Text style={[s.statLabel, { color: colors.onSurfaceVariant }]}>{st.label}</Text>
                </View>
              ))}
            </View>
            {!isPending ? (
              <TouchableOpacity onPress={() => setPendingReqs(prev => [...prev, viewingUser.id])}
                style={[s.connectBtn, { borderColor: colors.gold }]}>
                <Text style={[s.connectBtnText, { color: colors.gold }]}>Request Connection</Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.pendingBadge, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={{ fontSize: 11, color: colors.onSecondaryContainer, fontWeight: '600' }}>Connection request pending...</Text>
              </View>
            )}
          </View>

          {colls.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { color: colors.onSurfaceVariant }]}>PUBLIC COLLECTIONS</Text>
              {colls.map(col => (
                <View key={col.id} style={[s.collCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.collName, { color: colors.onSurface }]}>{col.name}</Text>
                    <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{col.itemCount} items</Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {col.topItems.map(dbId => {
                        const d = PRICING_DB.find(x => x.db_id === dbId);
                        return d ? (
                          <View key={dbId} style={[s.topItemChip, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
                            <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{d.title.replace('The ', '').split(' #')[0]}</Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.gold }}>${col.totalValue.toLocaleString()}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }


  // ══════════════════════════════════════════════════════════════
  // MAIN SEARCH VIEW
  // ══════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={{ paddingTop: 16, marginBottom: 14 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.onSurface }}>Search</Text>
        </View>

        {/* Search bar */}
        <View style={[s.searchBar, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
          <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search comics, cards, vaults, listings..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[s.searchInput, { color: colors.onSurface }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter toggle */}
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}
          style={[s.filterToggle, { borderColor: showFilters ? colors.gold : colors.outline }]}>
          <MaterialIcons name="tune" size={16} color={showFilters ? colors.gold : colors.onSurfaceVariant} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: showFilters ? colors.gold : colors.onSurfaceVariant }}>Filters</Text>
          <MaterialIcons name={showFilters ? 'expand-less' : 'expand-more'} size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Filters panel */}
        {showFilters && (
          <View style={[s.filtersPanel, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <Text style={[s.filterLabel, { color: colors.onSurfaceVariant }]}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => setTypeFilter('all')}
                  style={[s.chip, { borderColor: typeFilter === 'all' ? colors.gold : colors.outline }, typeFilter === 'all' && { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[s.chipText, { color: typeFilter === 'all' ? colors.gold : colors.onSurfaceVariant }]}>All</Text>
                </TouchableOpacity>
                {COLLECTIBLE_TYPES.slice(0, 6).map(ct => (
                  <TouchableOpacity key={ct.id} onPress={() => setTypeFilter(ct.id)}
                    style={[s.chip, { borderColor: typeFilter === ct.id ? colors.gold : colors.outline }, typeFilter === ct.id && { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[s.chipText, { color: typeFilter === ct.id ? colors.gold : colors.onSurfaceVariant }]}>{ct.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[s.filterLabel, { color: colors.onSurfaceVariant }]}>LOCATION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {DISTANCE_OPTIONS.map(d => (
                  <TouchableOpacity key={d.id} onPress={() => setLocationFilter(d.id)}
                    style={[s.chip, { borderColor: locationFilter === d.id ? colors.success : colors.outline },
                      locationFilter === d.id && { backgroundColor: colors.success + '15' }]}>
                    {d.id !== 'any' && <MaterialIcons name="near-me" size={12} color={locationFilter === d.id ? colors.success : colors.onSurfaceVariant} style={{ marginRight: 3 }} />}
                    <Text style={[s.chipText, { color: locationFilter === d.id ? colors.success : colors.onSurfaceVariant }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Result tabs */}
        <View style={{ flexDirection: 'row', gap: 0, marginTop: 14, marginBottom: 14 }}>
          {([
            { id: 'items' as SearchTab, label: 'Items', count: itemResults.length },
            { id: 'vaults' as SearchTab, label: 'Vaults', count: vaultResults.length },
            { id: 'listings' as SearchTab, label: 'Listings', count: listingResults.length },
          ]).map(tab => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)}
              style={[s.resultTab, { borderBottomColor: activeTab === tab.id ? colors.gold : 'transparent', borderBottomWidth: activeTab === tab.id ? 2 : 0 }]}>
              <Text style={{ fontSize: 13, fontWeight: activeTab === tab.id ? '700' : '500', color: activeTab === tab.id ? colors.gold : colors.onSurfaceVariant }}>
                {tab.label}
              </Text>
              <View style={[s.countBadge, { backgroundColor: activeTab === tab.id ? colors.primaryContainer : colors.surfaceContainer }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: activeTab === tab.id ? colors.gold : colors.onSurfaceVariant }}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── ITEMS TAB ──────────────────────────────────────── */}
        {activeTab === 'items' && itemResults.map(item => (
          <TouchableOpacity key={item.db_id} onPress={() => setViewingItemId(item.db_id)}
            style={[s.itemCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <CoverThumbnail dbId={item.db_id} size={50} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                {isOnWantList(item.db_id) && <MaterialIcons name="bookmark" size={14} color={colors.warning} />}
                {isInCollection(item.db_id) && <MaterialIcons name="check-circle" size={14} color={colors.success} />}
              </View>
              <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 }}>{item.publisher} · {item.year}</Text>
              {item.significance ? (
                <Text style={{ fontSize: 10, color: colors.gold, marginTop: 3 }} numberOfLines={1}>{item.significance}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>NM</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.gold }}>${item.prices.nm?.toLocaleString()}</Text>
              <MaterialIcons name="chevron-right" size={16} color={colors.onSurfaceVariant} style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>
        ))}
        {activeTab === 'items' && itemResults.length === 0 && (
          <View style={s.emptyState}>
            <MaterialIcons name="search-off" size={40} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8 }}>No items match "{query}"</Text>
          </View>
        )}

        {/* ── VAULTS TAB ─────────────────────────────────────── */}
        {activeTab === 'vaults' && vaultResults.map(user => {
          const trust = trustLevels[user.trustLevel];
          const colls = PUBLIC_COLLECTIONS.filter(c => c.ownerId === user.id);
          const totalVal = colls.reduce((sum, c) => sum + c.totalValue, 0);
          const metro = METROS.find(m => m.id === user.metro);
          const prox = getProximity(USER_METRO, user.metro);
          return (
            <TouchableOpacity key={user.id} onPress={() => setViewingId(user.id)}
              style={[s.vaultCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.smallTrustIcon, { borderColor: trust.color + '40', backgroundColor: trust.color + '15' }]}>
                    <MaterialIcons name={trust.icon as any} size={14} color={trust.color} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface, fontFamily: 'Courier' }}>{user.vaultId}</Text>
                    {metro && <Text style={{ fontSize: 10, color: prox.color, marginTop: 2 }}>{metro.label} · {prox.label}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 8, color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>Value</Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.gold }}>${totalVal.toLocaleString()}</Text>
                </View>
              </View>
              {colls.map(col => (
                <View key={col.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.outline }}>
                  <Text style={{ fontSize: 12, color: colors.onSurface }}>{col.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant }}>{col.itemCount} items</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
        {activeTab === 'vaults' && vaultResults.length === 0 && (
          <View style={s.emptyState}>
            <MaterialIcons name="person-search" size={40} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8 }}>No vaults found</Text>
          </View>
        )}

        {/* ── LISTINGS TAB ───────────────────────────────────── */}
        {activeTab === 'listings' && listingResults.map(listing => {
          const data = PRICING_DB.find(d => d.db_id === listing.dbId);
          if (!data) return null;
          const seller = ANON_USERS.find(u => u.id === listing.sellerId);
          const prox = seller ? getProximity(USER_METRO, seller.metro) : null;
          const price = listing.listType === 'auction' ? (listing.currentBid || listing.startPrice) : listing.buyNowPrice;
          return (
            <TouchableOpacity key={listing.id} onPress={() => setViewingItemId(listing.dbId)}
              style={[s.itemCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <CoverThumbnail dbId={listing.dbId} size={50} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface }} numberOfLines={1}>{data.title}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <View style={[s.tinyBadge, { borderColor: conditionColors[listing.condition] + '40', backgroundColor: conditionColors[listing.condition] + '10' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: conditionColors[listing.condition] }}>
                      {conditionLabels[listing.condition]?.short ?? listing.condition}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>
                    {listing.listType === 'auction' ? 'Auction' : 'Buy Now'} · {listing.endsIn}
                  </Text>
                </View>
                {prox && <Text style={{ fontSize: 9, color: prox.color, marginTop: 3 }}>{seller?.vaultId} · {prox.label}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.gold }}>${price?.toLocaleString()}</Text>
                {listing.bidCount > 0 && <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>{listing.bidCount} bids</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
        {activeTab === 'listings' && listingResults.length === 0 && (
          <View style={s.emptyState}>
            <MaterialIcons name="storefront" size={40} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8 }}>No listings found</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  filtersPanel: { marginTop: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  filterLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '600' },
  resultTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  countBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 10 },
  itemCard: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, marginBottom: 6, borderWidth: 1 },
  vaultCard: { padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  smallTrustIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tinyBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1 },
  emptyState: { alignItems: 'center', padding: 40 },
  // Item detail
  coverContainer: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, position: 'relative', alignItems: 'center', paddingVertical: 16 },
  zoomBadge: {
    position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  significanceBox: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  // Details grid
  detailsGrid: { padding: 16, borderRadius: 12, borderWidth: 1 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  detailCell: { minWidth: '22%', flex: 1, marginBottom: 4 },
  detailLabel: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  detailValue: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  priceTable: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingHorizontal: 14 },
  condDot: { width: 8, height: 8, borderRadius: 4 },
  marketRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  marketCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  listingCard: { padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Lightbox
  lightboxOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lightboxContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  lightboxHint: { flexDirection: 'row', alignItems: 'center', position: 'absolute', bottom: 40 },
  // Vault profile
  profileCard: { padding: 20, borderRadius: 14, borderWidth: 1.5, marginBottom: 20 },
  bigTrustIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  profileVaultId: { fontSize: 18, fontWeight: '800', fontFamily: 'Courier' },
  locBadge: { marginTop: 10, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statBox: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, marginTop: 2 },
  connectBtn: { marginTop: 14, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  connectBtnText: { fontSize: 13, fontWeight: '700' },
  pendingBadge: { marginTop: 14, padding: 14, borderRadius: 10, alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  collCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  collName: { fontSize: 14, fontWeight: '700' },
  topItemChip: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1 },
  // Action buttons
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderRadius: 10, marginTop: 12,
  },
  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingTop: 12, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 16 },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  modalInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  modalTextArea: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  modalPrimaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 8 },
  collOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  // Chart
  chartContainer: { padding: 14, paddingTop: 14, borderRadius: 12, borderWidth: 1 },
  // History
  historyCard: { padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { width: 1, height: 30, marginTop: 4 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 10, borderWidth: 1, marginTop: 4 },
});
