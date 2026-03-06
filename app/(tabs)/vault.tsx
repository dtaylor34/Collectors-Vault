import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { colors, conditionColors, conditionLabels, trustLevels } from '../../lib/theme';
import { CoverThumbnail, ItemThumbnail, AffiliateLinks } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import {
  SEED_COLLECTIONS, PRICING_DB, getCollectionValue, getItemPrice,
  COLLECTIBLE_TYPES, CATEGORY_CONDITIONS, AFFILIATE_PARTNERS,
  type Collection, type CollectionItem, type Condition, type CollectibleType,
} from '../../lib/data';

export default function VaultScreen() {
  const { colors: tc } = useTheme();
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS);
  const [activeCollId, setActiveCollId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'private' | 'public'>('private');
  const [newCategory, setNewCategory] = useState<CollectibleType>('comics');

  const currentUser = {
    vaultId: 'Vault #8847',
    trustLevel: 1,
    metro: 'SF Bay Area, CA',
    transactions: 2,
  };

  const totalVal = collections.reduce((s, c) => s + getCollectionValue(c), 0);
  const totalItems = collections.reduce((s, c) => s + c.items.length, 0);
  const activeColl = collections.find(c => c.id === activeCollId);
  const trust = trustLevels[currentUser.trustLevel];

  const createCollection = () => {
    if (!newName.trim()) return;
    const nc: Collection = {
      id: `c-${Date.now()}`, name: newName.trim(), privacy: newPrivacy,
      collectibleType: newCategory, items: [], createdAt: new Date().toISOString(),
      members: [{ vaultId: 'Vault #8847', role: 'owner', addedAt: new Date().toISOString(), addedBy: 'Vault #8847' }],
    };
    setCollections(prev => [...prev, nc]);
    setNewName('');
    setShowCreate(false);
    setActiveCollId(nc.id);
  };

  // ── ITEM DETAIL VIEW ──────────────────────────────────────────
  const activeItem = activeColl?.items.find(i => i.id === activeItemId);
  if (activeColl && activeItem) {
    const data = PRICING_DB.find(d => d.db_id === activeItem.matchId);
    const price = getItemPrice(activeItem);
    const condColor = conditionColors[activeItem.condition] ?? colors.textMuted;
    const condFull = conditionLabels[activeItem.condition]?.full ?? activeItem.condition;
    const title = data?.title ?? activeItem.customData?.title ?? 'Unknown';
    const catType = activeColl.collectibleType ?? 'comics';

    return (
      <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
          <TouchableOpacity onPress={() => setActiveItemId(null)} style={s.backBtn}>
            <Text style={s.backText}>← {activeColl.name}</Text>
          </TouchableOpacity>

          {/* Large cover */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <CoverThumbnail dbId={activeItem.matchId} size={160} />
          </View>

          {/* Title & Publisher */}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#F0F0F0', marginBottom: 4 }}>{title}</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>
            {data?.publisher ?? activeItem.customData?.publisher ?? ''} · {data?.year ?? activeItem.customData?.year ?? ''}
          </Text>
          {data?.creators ? (
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12 }}>
              {data.creators}
            </Text>
          ) : null}

          {/* Significance */}
          {data?.significance ? (
            <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#FFD60008', borderWidth: 1, borderColor: '#FFD60020', marginBottom: 14 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gold, letterSpacing: 1.5, marginBottom: 4 }}>KEY ISSUE</Text>
              <Text style={{ fontSize: 13, color: '#DDD', lineHeight: 19 }}>{data.significance}</Text>
            </View>
          ) : null}

          {/* Condition & Value row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: condColor + '30' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, marginBottom: 4 }}>CONDITION</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: condColor }}>{condFull}</Text>
            </View>
            <View style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#FFD60025' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, marginBottom: 4 }}>VALUE</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.gold }}>
                {price ? `$${price.toLocaleString()}` : '—'}
              </Text>
            </View>
          </View>

          {/* Rarity */}
          {data?.rarity ? (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#8E24AA15', borderWidth: 1, borderColor: '#8E24AA30' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#CE93D8' }}>{data.rarity}</Text>
              </View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#1a1a30', borderWidth: 1, borderColor: colors.surfaceBorder }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Source: {activeItem.source}</Text>
              </View>
            </View>
          ) : null}

          {/* Price table — all conditions */}
          {data ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>PRICE GUIDE</Text>
              <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceBorder }}>
                {Object.entries(data.prices).map(([cond, val], idx) => {
                  const isActive = cond === activeItem.condition;
                  const label = conditionLabels[cond]?.short ?? cond;
                  return (
                    <View key={cond} style={{
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      padding: 10, paddingHorizontal: 14,
                      backgroundColor: isActive ? '#FFD60010' : (idx % 2 === 0 ? colors.surface : '#0C0C1A'),
                      borderLeftWidth: isActive ? 3 : 0, borderLeftColor: colors.gold,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: isActive ? '800' : '500', color: isActive ? colors.gold : colors.textMuted }}>
                        {label} {isActive ? '← yours' : ''}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isActive ? colors.gold : '#BBB' }}>
                        ${val.toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Notes */}
          {activeItem.userNotes ? (
            <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 14 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 4 }}>NOTES</Text>
              <Text style={{ fontSize: 13, color: '#CCC', lineHeight: 19 }}>{activeItem.userNotes}</Text>
            </View>
          ) : null}

          {/* Affiliate links */}
          <AffiliateLinks category={catType} searchTerms={title} />

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            <TouchableOpacity style={[s.scanBtn, { flex: 1 }]}>
              <Text style={s.scanBtnText}>🔨 List for Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.searchBtn, { flex: 1 }]}>
              <Text style={s.searchBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 10, color: colors.textDark, marginTop: 12, textAlign: 'center' }}>
            Added {activeItem.createdAt}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── COLLECTION DETAIL VIEW ────────────────────────────────────
  if (activeColl) {
    const collVal = getCollectionValue(activeColl);
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => setActiveCollId(null)} style={s.backBtn}>
            <Text style={s.backText}>← Dashboard</Text>
          </TouchableOpacity>

          <View style={s.collHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.collTitle}>{activeColl.name}</Text>
              <Text style={s.collMeta}>
                {activeColl.items.length} items · {activeColl.privacy}
              </Text>
            </View>
            <View style={s.valueChip}>
              <Text style={s.valueLabel}>VALUE</Text>
              <Text style={s.valueAmount}>${collVal.toLocaleString()}</Text>
            </View>
          </View>

          {/* Add buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity style={s.scanBtn}>
              <Text style={s.scanBtnText}>📷 Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.searchBtn}>
              <Text style={s.searchBtnText}>🔍 Search</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          {activeColl.items.map(item => {
            const data = PRICING_DB.find(d => d.db_id === item.matchId);
            const price = getItemPrice(item);
            const condColor = conditionColors[item.condition] ?? colors.textMuted;
            const condLabel = conditionLabels[item.condition]?.short ?? '?';
            return (
              <TouchableOpacity key={item.id} onPress={() => setActiveItemId(item.id)} style={s.itemCard}>
                <CoverThumbnail dbId={item.matchId} size={48} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.itemTitle} numberOfLines={1}>
                    {data?.title ?? item.customData?.title ?? 'Unknown'}
                  </Text>
                  <Text style={s.itemMeta}>
                    {data?.publisher ?? item.customData?.publisher} · {data?.year ?? item.customData?.year}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginTop: 5 }}>
                    <View style={[s.condBadge, { borderColor: condColor + '40', backgroundColor: condColor + '10' }]}>
                      <Text style={[s.condText, { color: condColor }]}>{condLabel}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.itemPrice, !price && { color: colors.textDark }]}>
                    {price ? `$${price.toLocaleString()}` : '—'}
                  </Text>
                  <TouchableOpacity style={s.sellBtn}>
                    <Text style={s.sellBtnText}>🔨 Sell</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          {activeColl.items.length === 0 && (
            <View style={s.empty}>
              <Text style={{ fontSize: 32, opacity: 0.2 }}>📦</Text>
              <Text style={s.emptyText}>No items yet — scan or search to add</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── DASHBOARD VIEW ────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Identity card */}
        <View style={s.identityCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.trustIcon, { borderColor: trust.color + '60', backgroundColor: trust.color + '15' }]}>
                  <Text style={{ fontSize: 14, color: trust.color }}>{trust.icon}</Text>
                </View>
                <View>
                  <Text style={s.vaultIdText}>{currentUser.vaultId}</Text>
                  <Text style={[s.trustName, { color: trust.color }]}>{trust.name} · {currentUser.transactions} deals</Text>
                </View>
              </View>
              <View style={s.locationBadge}>
                <Text style={s.locationText}>📍 {currentUser.metro}</Text>
              </View>
            </View>
            <View style={s.valueChip}>
              <Text style={s.valueLabel}>PORTFOLIO</Text>
              <Text style={s.valueAmount}>${totalVal.toLocaleString()}</Text>
            </View>
          </View>
          <Text style={s.statsText}>
            {totalItems} items · {collections.length} collections
          </Text>
        </View>

        {/* Collections header */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Collections</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={s.newBtn}>
            <Text style={s.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Create collection form */}
        {showCreate && (
          <View style={s.createForm}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={colors.textDark}
              autoFocus
              onSubmitEditing={createCollection}
              style={s.input}
            />
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              {(['private', 'public'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setNewPrivacy(p)}
                  style={[s.privacyBtn, newPrivacy === p && s.privacyBtnActive]}
                >
                  <Text style={[s.privacyText, newPrivacy === p && s.privacyTextActive]}>
                    {p === 'private' ? '🔒 Private' : '🌐 Public'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {COLLECTIBLE_TYPES.map(ct => (
                  <TouchableOpacity
                    key={ct.id}
                    onPress={() => setNewCategory(ct.id)}
                    style={[s.privacyBtn, newCategory === ct.id && { borderColor: colors.gold, backgroundColor: '#FFD60012' }]}
                  >
                    <Text style={[s.privacyText, newCategory === ct.id && { color: colors.gold }]}>
                      {ct.icon} {ct.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={createCollection} style={s.createBtn}>
                <Text style={s.createBtnText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Collection cards */}
        {collections.map(col => {
          const val = getCollectionValue(col);
          return (
            <TouchableOpacity
              key={col.id}
              onPress={() => setActiveCollId(col.id)}
              style={s.collCard}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.collCardName}>{col.name}</Text>
                  <Text style={{ fontSize: 9, color: col.privacy === 'public' ? colors.green : colors.red }}>
                    {col.privacy === 'public' ? '🌐' : '🔒'}
                  </Text>
                </View>
                <Text style={s.collCardMeta}>{col.items.length} items · {COLLECTIBLE_TYPES.find(c => c.id === col.collectibleType)?.icon} {COLLECTIBLE_TYPES.find(c => c.id === col.collectibleType)?.label}</Text>
              </View>
              <Text style={s.collCardValue}>${val.toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  identityCard: {
    padding: 18, borderRadius: 14, marginTop: 16, marginBottom: 16,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.borderSubtle,
  },
  trustIcon: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  vaultIdText: { fontSize: 14, fontWeight: '700', color: '#DDD', fontFamily: 'Courier' },
  trustName: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  locationBadge: {
    marginTop: 8, paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 6, backgroundColor: '#4CAF5010', borderWidth: 1, borderColor: '#4CAF5025',
    alignSelf: 'flex-start',
  },
  locationText: { fontSize: 11, fontWeight: '600', color: colors.green },
  statsText: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
  valueChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: '#FFD60010', borderWidth: 1, borderColor: '#FFD60025',
  },
  valueLabel: { fontSize: 8, color: colors.textSecondary, textTransform: 'uppercase' as const },
  valueAmount: { fontSize: 22, fontWeight: '900', color: colors.gold },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  newBtn: {
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.gold, backgroundColor: '#FFD60010',
  },
  newBtnText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  createForm: {
    padding: 16, borderRadius: 12, marginBottom: 12,
    backgroundColor: colors.surfaceLight, borderWidth: 1.5, borderColor: '#FFD60030',
  },
  input: {
    width: '100%', padding: 12, borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: colors.borderSubtle,
    backgroundColor: '#0A0A18', color: colors.textPrimary, fontSize: 14,
  },
  privacyBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  privacyBtnActive: { borderColor: colors.gold, backgroundColor: '#FFD60012' },
  privacyText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  privacyTextActive: { color: colors.gold },
  createBtn: {
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: colors.gold,
  },
  createBtnText: { fontSize: 12, fontWeight: '700', color: '#000' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSubtle },
  cancelText: { fontSize: 11, color: colors.textMuted },
  collCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, borderRadius: 12, marginBottom: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  collCardName: { fontSize: 15, fontWeight: '800', color: '#E8E8E8' },
  collCardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  collCardValue: { fontSize: 18, fontWeight: '900', color: colors.gold },
  backBtn: { paddingVertical: 16 },
  backText: { fontSize: 11, color: colors.textMuted },
  collHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14, gap: 10,
  },
  collTitle: { fontSize: 22, fontWeight: '900', color: '#F0F0F0' },
  collMeta: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  scanBtn: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: colors.gold,
  },
  scanBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  searchBtn: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderWidth: 1.5, borderColor: colors.borderSubtle,
  },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: '#AAA' },
  itemCard: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, marginBottom: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  itemThumb: {
    width: 44, height: 58, borderRadius: 6, backgroundColor: '#1A1A30',
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  itemMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  condBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, borderWidth: 1 },
  condText: { fontSize: 10, fontWeight: '700' },
  itemPrice: { fontSize: 16, fontWeight: '800', color: colors.gold },
  sellBtn: {
    marginTop: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 5,
    borderWidth: 1, borderColor: '#4CAF5030', backgroundColor: '#4CAF5008',
  },
  sellBtnText: { fontSize: 9, fontWeight: '700', color: colors.green },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
});
