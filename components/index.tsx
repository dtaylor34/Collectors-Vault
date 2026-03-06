import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { colors, conditionColors, trustLevels } from '../lib/theme';
import {
  COLLECTIBLE_TYPES, CATEGORY_CONDITIONS, AFFILIATE_PARTNERS, PRICING_DB,
  type CollectibleType, type PricingEntry,
} from '../lib/data';
import { getCoverUrl } from '../lib/comicvine';

// ── Cover Thumbnail ─────────────────────────────────────────────
// Loads real cover art from Comic Vine, falls back to stylized placeholder
export function CoverThumbnail({ dbId, size = 52 }: { dbId?: string | null; size?: number }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const entry = dbId ? PRICING_DB.find(e => e.db_id === dbId) : null;

  useEffect(() => {
    if (!dbId || !entry) return;
    let cancelled = false;
    getCoverUrl(dbId).then(url => {
      if (!cancelled && url) setCoverUrl(url);
    });
    return () => { cancelled = true; };
  }, [dbId]);

  // Real cover loaded
  if (coverUrl && !failed) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={{ width: size, height: size * 1.35, borderRadius: 6 }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback: styled placeholder
  const bg = entry?.coverColor ?? '#333';
  const isMarvel = entry?.publisher === 'Marvel';
  const isDC = entry?.publisher === 'DC';
  const shortTitle = entry
    ? entry.title.replace(/^The\s+/, '').replace(/\s*#\d+$/, '').substring(0, 14)
    : '?';
  const issue = entry?.issueNum ?? '';

  return (
    <View style={[ct.wrap, { width: size, height: size * 1.35, backgroundColor: bg }]}>
      <View style={[ct.pubStripe, { backgroundColor: isMarvel ? '#EC1D24' : isDC ? '#0476F2' : '#555' }]}>
        <Text style={ct.pubText}>{entry?.publisher?.toUpperCase() ?? '—'}</Text>
      </View>
      <View style={ct.issueWrap}>
        <Text style={ct.issueText}>{issue}</Text>
      </View>
      <View style={ct.titleWrap}>
        <Text style={ct.titleText} numberOfLines={2}>{shortTitle}</Text>
      </View>
      <Text style={ct.yearText}>{entry?.year ?? ''}</Text>
    </View>
  );
}

// For non-comic items (cards, shoes, etc)
export function ItemThumbnail({ icon, title, size = 52 }: { icon: string; title: string; size?: number }) {
  return (
    <View style={[ct.wrap, { width: size, height: size * 1.35, backgroundColor: '#1a1a2e' }]}>
      <Text style={{ fontSize: size * 0.4, marginTop: size * 0.15 }}>{icon}</Text>
      <View style={ct.titleWrap}>
        <Text style={ct.titleText} numberOfLines={2}>{title.substring(0, 16)}</Text>
      </View>
    </View>
  );
}

const ct = StyleSheet.create({
  wrap: {
    borderRadius: 6, overflow: 'hidden', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pubStripe: {
    width: '100%', paddingVertical: 2, alignItems: 'center',
  },
  pubText: { fontSize: 6, fontWeight: '900', color: '#FFF', letterSpacing: 0.8 },
  issueWrap: { position: 'absolute', top: 14, right: 3 },
  issueText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  titleWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  titleText: { fontSize: 8, fontWeight: '700', color: '#FFF', textAlign: 'center', lineHeight: 10 },
  yearText: { fontSize: 7, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
});

// ── Vault ID Badge ──────────────────────────────────────────────
export function VaultIdBadge({ vaultId, trustLevel, size = 'md' }: {
  vaultId: string; trustLevel: number; size?: 'sm' | 'md' | 'lg';
}) {
  const trust = trustLevels[trustLevel] ?? trustLevels[0];
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[cs.trustDot, { borderColor: trust.color + '60', backgroundColor: trust.color + '15', width: size === 'sm' ? 20 : 28, height: size === 'sm' ? 20 : 28, borderRadius: size === 'sm' ? 10 : 14 }]}>
        <Text style={{ fontSize: fontSize - 2, color: trust.color }}>{trust.icon}</Text>
      </View>
      <View>
        <Text style={{ fontSize, fontWeight: '700', color: '#DDD', fontFamily: 'Courier' }}>{vaultId}</Text>
        <Text style={{ fontSize: fontSize - 3, color: trust.color, fontWeight: '600' }}>{trust.name}</Text>
      </View>
    </View>
  );
}

// ── Location Badge ──────────────────────────────────────────────
export function LocationBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[cs.locBadge, { borderColor: color + '25', backgroundColor: color + '10' }]}>
      <Text style={{ fontSize: 10, fontWeight: '600', color }}>📍 {label}</Text>
    </View>
  );
}

// ── Condition Picker ────────────────────────────────────────────
export function ConditionPicker({ category, selected, onSelect }: {
  category: CollectibleType;
  selected: string;
  onSelect: (condition: string) => void;
}) {
  const conditions = CATEGORY_CONDITIONS[category] ?? CATEGORY_CONDITIONS.other;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 5, padding: 4 }}>
        {conditions.map(c => {
          const isActive = selected === c.id;
          const color = conditionColors[c.id] ?? colors.textSecondary;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => onSelect(c.id)}
              style={[cs.condBtn, isActive && { borderColor: color + '60', backgroundColor: color + '12' }]}
            >
              <Text style={[cs.condShort, { color: isActive ? color : colors.textMuted }]}>{c.short}</Text>
              <Text style={[cs.condFull, { color: isActive ? color : colors.textDark }]}>{c.full}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Category Selector ───────────────────────────────────────────
export function CategorySelector({ selected, onSelect }: {
  selected: CollectibleType;
  onSelect: (cat: CollectibleType) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 5, padding: 4 }}>
        {COLLECTIBLE_TYPES.map(ct => (
          <TouchableOpacity
            key={ct.id}
            onPress={() => onSelect(ct.id)}
            style={[cs.catBtn, selected === ct.id && cs.catBtnActive]}
          >
            <Text style={{ fontSize: 16 }}>{ct.icon}</Text>
            <Text style={[cs.catLabel, selected === ct.id && { color: colors.gold }]}>{ct.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Affiliate Links ─────────────────────────────────────────────
export function AffiliateLinks({ category, searchTerms }: {
  category: CollectibleType;
  searchTerms?: string;
}) {
  const partners = AFFILIATE_PARTNERS[category] ?? AFFILIATE_PARTNERS.other;
  const query = encodeURIComponent(searchTerms || '');

  return (
    <View style={cs.affiliateContainer}>
      <Text style={cs.affiliateLabel}>CHECK PRICES</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {partners.map(p => (
          <TouchableOpacity
            key={p.name}
            onPress={() => Linking.openURL(`${p.url}/search?q=${query}`)}
            style={cs.affiliateBtn}
          >
            <Text style={cs.affiliateText}>{p.icon} {p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  trustDot: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  locBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  condBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', minWidth: 52,
  },
  condShort: { fontSize: 13, fontWeight: '800' },
  condFull: { fontSize: 8, marginTop: 2 },
  catBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface,
  },
  catBtnActive: { borderColor: colors.gold, backgroundColor: '#FFD60010' },
  catLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 3 },
  affiliateContainer: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#0A0A16', borderWidth: 1, borderColor: '#1a1a30' },
  affiliateLabel: { fontSize: 9, letterSpacing: 1.5, color: colors.textMuted, marginBottom: 8 },
  affiliateBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6,
    borderWidth: 1, borderColor: '#2196F330', backgroundColor: '#2196F308',
  },
  affiliateText: { fontSize: 11, fontWeight: '600', color: colors.blue },
});
