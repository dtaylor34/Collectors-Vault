import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TextInput, Modal, Pressable, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { conditionColors, conditionLabels } from '../../lib/theme';
import {
  COLLECTIBLE_TYPES, PRICING_DB, SEED_COLLECTIONS, SEED_WANT_LIST, SEED_LISTINGS,
  CATEGORY_CONDITIONS, ROLE_INFO, fuzzyMatch,
  type CollectibleType, type PricingEntry, type Condition, type Collection, type CollectionRole,
} from '../../lib/data';
import { CoverThumbnail } from '../../components';

// ── AI Prompt: ask for top 3 guesses ─────────────────────────────
const buildPrompt = (category: CollectibleType) =>
  `You are an expert collectibles appraiser with deep knowledge of market values. Look at this ${category === 'comics' ? 'comic book' : category} photo carefully.

Identify the item and provide your TOP 3 best guesses ranked by confidence. For each guess, include estimated market values at different condition grades based on your knowledge of recent sales data.

Respond ONLY with a JSON array — no markdown, no backticks, no preamble.
[
  {
    "rank": 1,
    "confidence": "high" | "medium" | "low",
    "title": "exact title with issue number",
    "publisher": "publisher name",
    "year": 1968,
    "significance": "why this item matters to collectors",
    "creators": "writer / artist",
    "writer": "writer name",
    "artist": "interior artist name",
    "cover_artist": "cover artist name",
    "editor": "editor name",
    "cover_price": "$0.25",
    "page_count": 36,
    "condition_estimate": "poor" | "good" | "fine" | "vf" | "nm",
    "condition_notes": "specific observations about this copy's condition from the photo",
    "search_terms": "optimized search string for database lookup",
    "rarity": "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary",
    "reasoning": "why you think this is the item based on visual clues",
    "prices": {
      "poor": 50,
      "good": 200,
      "fine": 800,
      "vf": 2000,
      "nm": 5000,
      "cgc_9_8": 25000
    }
  }
]
IMPORTANT: The "prices" field must contain realistic current market values in USD for each condition grade. Use your knowledge of actual sales data. If you're unsure of exact values, provide your best estimate based on the item's significance, rarity, and market demand.`;

// ── Types ─────────────────────────────────────────────────────────
interface AiSuggestion {
  rank: number;
  confidence: string;
  title: string;
  publisher: string;
  year: number;
  significance: string;
  creators: string;
  writer?: string;
  artist?: string;
  cover_artist?: string;
  editor?: string;
  cover_price?: string;
  page_count?: number;
  condition_estimate: string;
  condition_notes: string;
  search_terms: string;
  rarity: string;
  reasoning: string;
  prices?: Record<string, number>;  // AI-estimated prices per condition
}

interface ConfirmedItem {
  title: string;
  publisher: string;
  year: number;
  significance: string;
  creators: string;
  writer?: string;
  artist?: string;
  coverArtist?: string;
  editor?: string;
  coverPrice?: string;
  pageCount?: number;
  condition: Condition;
  conditionNotes: string;
  rarity: string;
  dbMatch: PricingEntry | null;
  aiPrices: Record<string, number> | null;  // fallback pricing from AI
  source: 'ai' | 'manual';
}

type ScanPhase = 'start' | 'analyzing' | 'suggestions' | 'manual' | 'confirmed';

// ── Demo Items ────────────────────────────────────────────────────
const DEMO_SCANS: { id: string; label: string; desc: string; suggestions: AiSuggestion[] }[] = [
  {
    id: 'demo-1', label: 'Amazing Spider-Man #129', desc: '1st Punisher — you OWN this',
    suggestions: [
      { rank: 1, confidence: 'high', title: 'The Amazing Spider-Man #129', publisher: 'Marvel', year: 1974, significance: '1st appearance of The Punisher', creators: 'Gerry Conway / Ross Andru', writer: 'Gerry Conway', artist: 'Ross Andru', cover_artist: 'Gil Kane / John Romita Sr.', editor: 'Roy Thomas', cover_price: '$0.20', page_count: 32, condition_estimate: 'fine', condition_notes: 'Cover bright, light corner wear, spine stress lines', search_terms: 'Amazing Spider-Man 129', rarity: 'Very Rare', reasoning: 'Distinctive Punisher crosshairs cover by Gil Kane and John Romita Sr. is unmistakable.', prices: { poor: 120, good: 400, fine: 1200, vf: 3000, nm: 5000, cgc_9_8: 45000 } },
      { rank: 2, confidence: 'low', title: 'The Amazing Spider-Man #134', publisher: 'Marvel', year: 1974, significance: '2nd appearance of The Punisher', creators: 'Gerry Conway / Ross Andru', condition_estimate: 'fine', condition_notes: '', search_terms: 'Amazing Spider-Man 134', rarity: 'Rare', reasoning: 'Similar era and Punisher appearance, but cover composition differs.', prices: { poor: 15, good: 40, fine: 100, vf: 200, nm: 350, cgc_9_8: 2500 } },
    ],
  },
  {
    id: 'demo-2', label: 'House of Secrets #92', desc: '1st Swamp Thing — on your WANT LIST',
    suggestions: [
      { rank: 1, confidence: 'high', title: 'House of Secrets #92', publisher: 'DC', year: 1971, significance: '1st Swamp Thing', creators: 'Len Wein / Bernie Wrightson', writer: 'Len Wein', artist: 'Bernie Wrightson', cover_artist: 'Bernie Wrightson', editor: 'Joe Orlando', cover_price: '$0.25', page_count: 52, condition_estimate: 'good', condition_notes: 'Spine roll, cover attached, light foxing', search_terms: 'House of Secrets 92', rarity: 'Very Rare', reasoning: 'Iconic Bernie Wrightson cover showing Swamp Thing emerging.', prices: { poor: 100, good: 350, fine: 1200, vf: 3500, nm: 5500, cgc_9_8: 50000 } },
      { rank: 2, confidence: 'low', title: 'Swamp Thing #1', publisher: 'DC', year: 1972, significance: '1st Swamp Thing ongoing', creators: 'Len Wein / Bernie Wrightson', condition_estimate: 'good', condition_notes: '', search_terms: 'Swamp Thing 1 1972', rarity: 'Very Rare', reasoning: 'Same character and artist but different series.', prices: { poor: 40, good: 120, fine: 400, vf: 1000, nm: 1800, cgc_9_8: 15000 } },
    ],
  },
  {
    id: 'demo-3', label: 'Iron Fist #14', desc: '1st Sabretooth — LISTING available',
    suggestions: [
      { rank: 1, confidence: 'high', title: 'Iron Fist #14', publisher: 'Marvel', year: 1977, significance: '1st appearance of Sabretooth', creators: 'Chris Claremont / John Byrne', writer: 'Chris Claremont', artist: 'John Byrne', cover_artist: 'Dave Cockrum', editor: 'Archie Goodwin', cover_price: '$0.30', page_count: 32, condition_estimate: 'fine', condition_notes: 'Clean cover, minor corner wear', search_terms: 'Iron Fist 14', rarity: 'Rare', reasoning: 'Sabretooth prominently on cover in classic costume.', prices: { poor: 25, good: 100, fine: 350, vf: 800, nm: 1500, cgc_9_8: 18000 } },
      { rank: 2, confidence: 'low', title: 'Iron Fist #15', publisher: 'Marvel', year: 1977, significance: 'X-Men crossover begins', creators: 'Chris Claremont / John Byrne', condition_estimate: 'fine', condition_notes: '', search_terms: 'Iron Fist 15', rarity: 'Uncommon', reasoning: 'Adjacent issue with similar styling.', prices: { poor: 8, good: 20, fine: 50, vf: 100, nm: 180, cgc_9_8: 1200 } },
    ],
  },
  {
    id: 'demo-4', label: 'Silver Surfer #1 (test)', desc: 'NOT in database — AI pricing only',
    suggestions: [
      { rank: 1, confidence: 'high', title: 'The Silver Surfer #1', publisher: 'Marvel', year: 1968, significance: 'First solo Silver Surfer series — origin retold by Stan Lee & John Buscema. One of the most iconic Silver Age Marvel covers.', creators: 'Stan Lee / John Buscema', writer: 'Stan Lee', artist: 'John Buscema', cover_artist: 'John Buscema', editor: 'Stan Lee', cover_price: '$0.25', page_count: 68, condition_estimate: 'good', condition_notes: 'Moderate spine roll, cover detached at bottom staple, creasing along spine, color still vivid on front', search_terms: 'Silver Surfer 1 1968', rarity: 'Legendary', reasoning: 'The iconic "Big Premiere Issue" banner, "Sentinel of the Spaceways" subtitle, John Buscema art with Silver Surfer standing on his board against a cosmic background, and the "Origin of the Silver Surfer" caption box are unmistakable. This is the 68-page first issue of the Silver Surfer solo series.', prices: { poor: 200, good: 600, fine: 2000, vf: 5000, nm: 9000, cgc_9_8: 85000 } },
      { rank: 2, confidence: 'low', title: 'The Silver Surfer #4', publisher: 'Marvel', year: 1969, significance: 'Classic Silver Surfer vs Thor battle', creators: 'Stan Lee / John Buscema', condition_estimate: 'good', condition_notes: '', search_terms: 'Silver Surfer 4 1969', rarity: 'Very Rare', reasoning: 'Same series but different cover composition.', prices: { poor: 100, good: 300, fine: 800, vf: 2000, nm: 3500, cgc_9_8: 35000 } },
    ],
  },
];

export default function ScanScreen() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<ScanPhase>('start');
  const [photo, setPhoto] = useState<string | null>(null);
  const [category, setCategory] = useState<CollectibleType>('comics');
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedItem | null>(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Scan usage tracking (local for now — Supabase in production)
  const [scanCount, setScanCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const LIMITS = { free: 3, pro: 100 };
  const SCAN_LIMIT = isPro ? LIMITS.pro : LIMITS.free;
  const scansRemaining = Math.max(0, SCAN_LIMIT - scanCount);
  const [aiModel, setAiModel] = useState<string>('');  // which model responded
  const [showCollPicker, setShowCollPicker] = useState(false);
  const [selectedCollId, setSelectedCollId] = useState<string | null>(null);
  const [saveCondition, setSaveCondition] = useState<Condition>('nm');

  // Manual entry fields
  const [manTitle, setManTitle] = useState('');
  const [manPublisher, setManPublisher] = useState('');
  const [manYear, setManYear] = useState('');
  const [manCreators, setManCreators] = useState('');
  const [manCondition, setManCondition] = useState<Condition>('nm');
  const [manCondNotes, setManCondNotes] = useState('');
  const [manSignificance, setManSignificance] = useState('');

  // ── DB matching ─────────────────────────────────────────────
  const findDbMatch = useCallback((searchStr: string): PricingEntry | null => {
    const matches = fuzzyMatch(searchStr);
    return matches.length > 0 ? matches[0] : null;
  }, []);

  // Collection / Want List checks
  const alreadyOwned = useMemo(() => {
    if (!confirmed?.dbMatch) return null;
    for (const col of SEED_COLLECTIONS) {
      const item = col.items.find(i => i.matchId === confirmed.dbMatch!.db_id);
      if (item) return { collection: col.name, condition: item.condition };
    }
    return null;
  }, [confirmed]);

  const onWantList = useMemo(() => {
    if (!confirmed?.dbMatch) return null;
    return SEED_WANT_LIST.find(w => w.dbId === confirmed.dbMatch!.db_id) ?? null;
  }, [confirmed]);

  const activeListings = useMemo(() => {
    if (!confirmed?.dbMatch) return [];
    return SEED_LISTINGS.filter(l => l.dbId === confirmed.dbMatch!.db_id);
  }, [confirmed]);

  // ── Camera / Gallery ────────────────────────────────────────
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!r.canceled && r.assets[0]) {
      setPhoto(r.assets[0].uri);
      analyzePhoto(r.assets[0].base64 ?? '');
    }
  };

  const pickFromGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!r.canceled && r.assets[0]) {
      setPhoto(r.assets[0].uri);
      analyzePhoto(r.assets[0].base64 ?? '');
    }
  };

  // ── Claude Vision ───────────────────────────────────────────
  const analyzePhoto = async (base64: string) => {
    // Check rate limit
    if (scansRemaining <= 0) {
      setPhase('suggestions');
      setSuggestions([]);
      showToast(isPro ? 'Pro scan limit reached (100/month)' : 'Free scan limit reached — upgrade to Pro!');
      return;
    }

    setPhase('analyzing'); setSuggestions([]); setConfirmed(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
      const edgeFunctionUrl = process.env.EXPO_PUBLIC_SCAN_ENDPOINT ?? '';

      let suggestions: AiSuggestion[] = [];
      let model = '';

      if (edgeFunctionUrl) {
        // ── Production: call Edge Function (handles Haiku/Sonnet, caching, rate limiting)
        const res = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, category }),
        });
        const data = await res.json();
        if (data.error === 'scan_limit_reached') {
          setPhase('suggestions');
          showToast(data.message);
          return;
        }
        suggestions = data.suggestions ?? [];
        model = data.model ?? '';
      } else if (apiKey) {
        // ── Dev: call API directly with CORS proxy
        const apiUrl = Platform.OS === 'web'
          ? `https://corsproxy.io/?${encodeURIComponent('https://api.anthropic.com/v1/messages')}`
          : 'https://api.anthropic.com/v1/messages';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001', max_tokens: 2000,
            messages: [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: buildPrompt(category) },
            ]}],
          }),
        });
        const data = await response.json();
        const text = data.content
          ?.filter((i: any) => i.type === 'text')
          ?.map((i: any) => i.text || '')
          .join('') || '';
        let parsed;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        }
        suggestions = Array.isArray(parsed) ? parsed : [parsed];
        model = 'haiku';
      } else {
        // No API key and no Edge Function
        setSuggestions([]);
        setPhase('suggestions');
        return;
      }

      setSuggestions(suggestions);
      setAiModel(model);
      setScanCount(prev => prev + 1);
      setPhase('suggestions');
    } catch {
      setSuggestions([]);
      setPhase('suggestions');
    }
  };

  // ── Demo scan ───────────────────────────────────────────────
  const runDemo = (demo: typeof DEMO_SCANS[0]) => {
    setPhoto('demo'); setPhase('analyzing'); setSuggestions([]); setConfirmed(null); setAskingPrice('');
    setTimeout(() => {
      setSuggestions(demo.suggestions);
      setAiModel('demo');
      setScanCount(prev => prev + 1);
      setPhase('suggestions');
    }, 1200);
  };

  // ── Confirm suggestion ─────────────────────────────────────
  const confirmSuggestion = (s: AiSuggestion) => {
    const dbMatch = findDbMatch(s.search_terms || s.title);
    setConfirmed({
      title: dbMatch?.title ?? s.title,
      publisher: dbMatch?.publisher ?? s.publisher,
      year: dbMatch?.year ?? s.year,
      significance: dbMatch?.significance ?? s.significance,
      creators: dbMatch?.creators ?? s.creators,
      writer: dbMatch?.writer ?? s.writer,
      artist: dbMatch?.artist ?? s.artist,
      coverArtist: dbMatch?.coverArtist ?? s.cover_artist,
      editor: dbMatch?.editor ?? s.editor,
      coverPrice: dbMatch?.coverPrice ?? s.cover_price,
      pageCount: dbMatch?.pageCount ?? s.page_count,
      condition: (s.condition_estimate as Condition) ?? 'nm',
      conditionNotes: s.condition_notes,
      rarity: dbMatch?.rarity ?? s.rarity,
      dbMatch,
      aiPrices: s.prices ?? null,
      source: 'ai',
    });
    setPhase('confirmed');
  };

  // ── Confirm manual entry ───────────────────────────────────
  const confirmManual = () => {
    if (!manTitle.trim()) return;
    const dbMatch = findDbMatch(manTitle);
    setConfirmed({
      title: dbMatch?.title ?? manTitle,
      publisher: dbMatch?.publisher ?? manPublisher,
      year: dbMatch?.year ?? (parseInt(manYear) || 0),
      significance: dbMatch?.significance ?? manSignificance,
      creators: dbMatch?.creators ?? manCreators,
      condition: manCondition,
      conditionNotes: manCondNotes,
      rarity: dbMatch?.rarity ?? 'Unknown',
      dbMatch,
      aiPrices: null,
      source: 'manual',
    });
    setPhase('confirmed');
  };

  const resetScan = () => {
    setPhase('start'); setPhoto(null); setSuggestions([]); setConfirmed(null); setAskingPrice('');
    setManTitle(''); setManPublisher(''); setManYear(''); setManCreators('');
    setManCondition('nm'); setManCondNotes(''); setManSignificance('');
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Value verdict — uses DB prices first, AI prices as fallback
  const prices = confirmed?.dbMatch?.prices ?? confirmed?.aiPrices ?? null;
  const estPrice = prices && confirmed?.condition ? (prices[confirmed.condition] ?? null) : null;
  const askNum = parseInt(askingPrice) || 0;
  const verdict = (() => {
    if (!estPrice || !askNum) return null;
    const r = askNum / estPrice;
    if (r <= 0.6) return { label: 'GREAT DEAL', color: colors.success, icon: 'thumb-up', desc: `${Math.round((1 - r) * 100)}% below market` };
    if (r <= 0.85) return { label: 'FAIR PRICE', color: colors.gold, icon: 'thumbs-up-down', desc: 'Close to market value' };
    if (r <= 1.0) return { label: 'AT MARKET', color: colors.warning, icon: 'trending-flat', desc: 'Right at estimated value' };
    if (r <= 1.2) return { label: 'SLIGHTLY HIGH', color: '#FF9800', icon: 'trending-up', desc: `${Math.round((r - 1) * 100)}% above market` };
    return { label: 'OVERPRICED', color: colors.error, icon: 'thumb-down', desc: `${Math.round((r - 1) * 100)}% over market` };
  })();

  const catInfo = COLLECTIBLE_TYPES.find(c => c.id === category)!;

  // ══════════════════════════════════════════════════════════════
  // PHASE: START
  // ══════════════════════════════════════════════════════════════
  if (phase === 'start') {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={st.content}>
          <MaterialIcons name="center-focus-strong" size={48} color={colors.gold} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.onSurface, marginBottom: 4 }}>Scan & Identify</Text>
          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16, textAlign: 'center' }}>
            AI suggests what it sees — you confirm or correct
          </Text>

          {/* Scan usage counter */}
          <View style={[st.usageCard, { backgroundColor: colors.surface, borderColor: scansRemaining <= 1 ? colors.warning + '60' : colors.outline }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name={isPro ? 'bolt' : 'center-focus-strong'} size={16} color={isPro ? colors.gold : colors.onSurfaceVariant} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface }}>
                  {scansRemaining > 0
                    ? `${scansRemaining} AI scan${scansRemaining !== 1 ? 's' : ''} remaining`
                    : 'No scans remaining'}
                </Text>
              </View>
              {/* Progress dots for 3 scans */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                {Array.from({ length: SCAN_LIMIT }).map((_, i) => (
                  <View key={i} style={{
                    flex: 1, height: 6, borderRadius: 3,
                    backgroundColor: i < scanCount
                      ? colors.onSurfaceVariant + '40'
                      : i < SCAN_LIMIT
                        ? colors.success
                        : colors.surfaceContainer,
                  }} />
                ))}
              </View>
              <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 6 }}>
                {isPro ? `Pro · ${scanCount} of ${SCAN_LIMIT} used` : `Free · ${scanCount} of ${SCAN_LIMIT} used · Resets monthly`}
              </Text>
            </View>
            {!isPro && (
              <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.gold }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#000' }}>GO PRO</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Free search reminder */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, paddingHorizontal: 4 }}>
            <MaterialIcons name="info-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, flex: 1 }}>
              Search, browse, price guides, and collection tracking are always free and unlimited.
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, maxHeight: 40 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {COLLECTIBLE_TYPES.slice(0, 6).map(ct => (
                <TouchableOpacity key={ct.id} onPress={() => setCategory(ct.id)}
                  style={[st.chip, { borderColor: category === ct.id ? colors.gold : colors.outline, backgroundColor: category === ct.id ? colors.primaryContainer : 'transparent' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: category === ct.id ? colors.gold : colors.onSurfaceVariant }}>{ct.icon} {ct.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={takePhoto} style={[st.primaryBtn, { backgroundColor: colors.gold }]}>
            <MaterialIcons name="camera-alt" size={20} color="#000" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginLeft: 8 }}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromGallery} style={[st.secondBtn, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
            <MaterialIcons name="photo-library" size={18} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurfaceVariant, marginLeft: 8 }}>Choose from Gallery</Text>
          </TouchableOpacity>

          {/* Demos */}
          <View style={{ width: '100%', marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <MaterialIcons name="science" size={16} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1 }}>TRY DEMO SCANS</Text>
            </View>
            {DEMO_SCANS.map(d => (
              <TouchableOpacity key={d.id} onPress={() => runDemo(d)} style={[st.demoCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>{d.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{d.desc}</Text>
                </View>
                <MaterialIcons name="play-circle-outline" size={28} color={colors.gold} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: ANALYZING
  // ══════════════════════════════════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gold, marginTop: 14 }}>Analyzing...</Text>
          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
            Identifying item, checking database, and estimating condition
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: SUGGESTIONS — user picks which one, or enters manually
  // ══════════════════════════════════════════════════════════════
  if (phase === 'suggestions') {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <TouchableOpacity onPress={resetScan} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12 }}>
            <MaterialIcons name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>New Scan</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.onSurface, marginBottom: 4 }}>Is this your item?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>
              Select the correct match, or enter details manually
            </Text>
            {aiModel ? (
              <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: colors.surfaceContainer }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.onSurfaceVariant }}>{aiModel.toUpperCase()}</Text>
              </View>
            ) : null}
          </View>

          {/* Limit reached */}
          {scansRemaining <= 0 && suggestions.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.warning + '10', borderRadius: 12, borderWidth: 1, borderColor: colors.warning + '30', marginBottom: 16 }}>
              <MaterialIcons name="block" size={40} color={colors.warning} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.warning, marginTop: 10 }}>
                Scan Limit Reached
              </Text>
              <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
                You've used all {SCAN_LIMIT} free scans this month. Upgrade to Pro for unlimited scanning at flea markets, comic shops, and conventions.
              </Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                You can still search, browse, and view full pricing for any item — for free, always.
              </Text>
              <TouchableOpacity style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: colors.gold }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#000' }}>Upgrade to Pro — $4.99/mo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Show uploaded photo */}
          {photo && photo !== 'demo' && (
            <Image source={{ uri: photo }} style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.outline }} resizeMode="contain" />
          )}

          {suggestions.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <MaterialIcons name="image-not-supported" size={40} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' }}>
                Couldn't identify the item automatically.
              </Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
                {!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
                  ? 'Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file, then restart. Or try the demo scans below to test the flow.'
                  : 'The CORS proxy may have failed. Try the demo scans, use Expo Go on a real device, or enter details manually below.'}
              </Text>
            </View>
          )}

          {suggestions.map((s, i) => {
            const dbMatch = findDbMatch(s.search_terms || s.title);
            const confColor = s.confidence === 'high' ? colors.success : s.confidence === 'medium' ? colors.warning : colors.onSurfaceVariant;
            return (
              <TouchableOpacity key={i} onPress={() => confirmSuggestion(s)}
                style={[st.suggestionCard, {
                  backgroundColor: colors.surface,
                  borderColor: i === 0 ? colors.gold + '60' : colors.outline,
                  borderWidth: i === 0 ? 2 : 1,
                }]}>
                {/* Rank + confidence */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {i === 0 && <MaterialIcons name="looks-one" size={20} color={colors.gold} />}
                    {i === 1 && <MaterialIcons name="looks-two" size={20} color={colors.onSurfaceVariant} />}
                    {i === 2 && <MaterialIcons name="looks-3" size={20} color={colors.onSurfaceVariant} />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: confColor, letterSpacing: 0.5 }}>
                      {s.confidence.toUpperCase()} CONFIDENCE
                    </Text>
                  </View>
                  {dbMatch && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.success + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                      <MaterialIcons name="check-circle" size={12} color={colors.success} />
                      <Text style={{ fontSize: 9, fontWeight: '700', color: colors.success }}>IN DATABASE</Text>
                    </View>
                  )}
                </View>

                {/* Item info row */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {dbMatch && <CoverThumbnail dbId={dbMatch.db_id} size={56} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.onSurface }}>{s.title}</Text>
                    <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                      {s.publisher} · {s.year} · {s.creators}
                    </Text>
                    {s.significance && (
                      <Text style={{ fontSize: 11, color: colors.gold, marginTop: 4 }}>{s.significance}</Text>
                    )}
                  </View>
                </View>

                {/* AI reasoning */}
                {s.reasoning && (
                  <View style={{ marginTop: 8, padding: 8, borderRadius: 6, backgroundColor: colors.surfaceContainer }}>
                    <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontStyle: 'italic', lineHeight: 15 }}>
                      "{s.reasoning}"
                    </Text>
                  </View>
                )}

                {/* Price preview — from DB or AI estimate */}
                {(dbMatch || s.prices) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.outline }}>
                    <View>
                      <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>Est. Condition</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: conditionColors[s.condition_estimate] ?? colors.onSurface }}>
                        {conditionLabels[s.condition_estimate as Condition]?.full ?? s.condition_estimate}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>
                        Value at grade {!dbMatch ? '(AI est.)' : ''}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.gold }}>
                        ${(dbMatch?.prices[s.condition_estimate as Condition] ?? s.prices?.[s.condition_estimate])?.toLocaleString() ?? '—'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Select indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 4 }}>
                  <MaterialIcons name="touch-app" size={14} color={i === 0 ? colors.gold : colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: i === 0 ? colors.gold : colors.onSurfaceVariant }}>
                    {i === 0 ? 'Tap to confirm this is it' : 'Tap if this is correct'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* None of these / Manual entry */}
          <TouchableOpacity onPress={() => setPhase('manual')}
            style={[st.manualBtn, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
            <MaterialIcons name="edit" size={18} color={colors.onSurfaceVariant} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>None of these? Enter manually</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>Type the title, publisher, year, and condition yourself</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: MANUAL ENTRY
  // ══════════════════════════════════════════════════════════════
  if (phase === 'manual') {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <TouchableOpacity onPress={() => setPhase('suggestions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12 }}>
            <MaterialIcons name="arrow-back" size={16} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Back to Suggestions</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.onSurface, marginBottom: 16 }}>Enter Item Details</Text>

          {/* Show uploaded photo for reference */}
          {photo && photo !== 'demo' && (
            <Image source={{ uri: photo }} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.outline }} resizeMode="contain" />
          )}

          <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>TITLE *</Text>
          <TextInput value={manTitle} onChangeText={setManTitle} placeholder="e.g. The Amazing Spider-Man #129"
            placeholderTextColor={colors.onSurfaceVariant} style={[st.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />

          <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>PUBLISHER</Text>
          <TextInput value={manPublisher} onChangeText={setManPublisher} placeholder="e.g. Marvel, DC"
            placeholderTextColor={colors.onSurfaceVariant} style={[st.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>YEAR</Text>
              <TextInput value={manYear} onChangeText={setManYear} placeholder="1974" keyboardType="numeric"
                placeholderTextColor={colors.onSurfaceVariant} style={[st.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>CREATORS</Text>
              <TextInput value={manCreators} onChangeText={setManCreators} placeholder="Writer / Artist"
                placeholderTextColor={colors.onSurfaceVariant} style={[st.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />
            </View>
          </View>

          <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>CONDITION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CATEGORY_CONDITIONS.comics.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setManCondition(c.id as Condition)}
                  style={[st.chip, { borderColor: manCondition === c.id ? conditionColors[c.id] : colors.outline, backgroundColor: manCondition === c.id ? conditionColors[c.id] + '15' : 'transparent' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: manCondition === c.id ? conditionColors[c.id] : colors.onSurfaceVariant }}>{c.short} — {c.full}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>CONDITION NOTES</Text>
          <TextInput value={manCondNotes} onChangeText={setManCondNotes} placeholder="Describe any defects, wear, or notable features"
            placeholderTextColor={colors.onSurfaceVariant} multiline
            style={[st.input, st.textArea, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />

          <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>SIGNIFICANCE (OPTIONAL)</Text>
          <TextInput value={manSignificance} onChangeText={setManSignificance} placeholder="1st appearance of..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[st.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline, color: colors.onSurface }]} />

          {/* Live DB match preview */}
          {manTitle.length > 3 && (() => {
            const match = findDbMatch(manTitle);
            return match ? (
              <View style={[st.matchPreview, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600', marginLeft: 6 }}>
                  Matched: {match.title} — ${match.prices.nm.toLocaleString()} (NM)
                </Text>
              </View>
            ) : (
              <View style={[st.matchPreview, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
                <MaterialIcons name="info-outline" size={16} color={colors.warning} />
                <Text style={{ fontSize: 12, color: colors.warning, fontWeight: '600', marginLeft: 6 }}>
                  No database match — pricing from AI estimate
                </Text>
              </View>
            );
          })()}

          <TouchableOpacity onPress={confirmManual} style={[st.primaryBtn, { backgroundColor: colors.gold, marginTop: 20 }]}>
            <MaterialIcons name="check" size={20} color="#000" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginLeft: 8 }}>Confirm Item</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: CONFIRMED — full value analysis
  // ══════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <TouchableOpacity onPress={resetScan} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12 }}>
          <MaterialIcons name="arrow-back" size={16} color={colors.onSurfaceVariant} />
          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>New Scan</Text>
        </TouchableOpacity>

        {/* Source badge */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          <View style={[st.sourceBadge, { backgroundColor: confirmed!.source === 'ai' ? colors.success + '15' : colors.secondary + '15', borderColor: confirmed!.source === 'ai' ? colors.success : colors.secondary }]}>
            <MaterialIcons name={confirmed!.source === 'ai' ? 'auto-awesome' : 'edit'} size={12} color={confirmed!.source === 'ai' ? colors.success : colors.secondary} />
            <Text style={{ fontSize: 10, fontWeight: '700', marginLeft: 4, color: confirmed!.source === 'ai' ? colors.success : colors.secondary }}>
              {confirmed!.source === 'ai' ? 'AI IDENTIFIED' : 'MANUAL ENTRY'}
            </Text>
          </View>
          {confirmed!.dbMatch && (
            <View style={[st.sourceBadge, { backgroundColor: colors.gold + '15', borderColor: colors.gold }]}>
              <MaterialIcons name="verified" size={12} color={colors.gold} />
              <Text style={{ fontSize: 10, fontWeight: '700', marginLeft: 4, color: colors.gold }}>DATABASE MATCHED</Text>
            </View>
          )}
          {!confirmed!.dbMatch && confirmed!.aiPrices && (
            <View style={[st.sourceBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
              <MaterialIcons name="auto-awesome" size={12} color={colors.warning} />
              <Text style={{ fontSize: 10, fontWeight: '700', marginLeft: 4, color: colors.warning }}>AI ESTIMATED PRICING</Text>
            </View>
          )}
        </View>

        {/* Cover + Photo + Title */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {confirmed!.dbMatch ? (
            <CoverThumbnail dbId={confirmed!.dbMatch.db_id} size={90} />
          ) : photo && photo !== 'demo' ? (
            <Image source={{ uri: photo }} style={{ width: 90, height: 120, borderRadius: 8 }} resizeMode="cover" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.onSurface }}>{confirmed!.title}</Text>
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 }}>
              {confirmed!.publisher} · {confirmed!.year} · {confirmed!.creators}
            </Text>
            {confirmed!.significance && <Text style={{ fontSize: 11, color: colors.gold, marginTop: 6 }}>{confirmed!.significance}</Text>}
          </View>
        </View>

        {/* Metadata details */}
        {(confirmed!.writer || confirmed!.artist || confirmed!.coverPrice) && (
          <View style={[st.detailsGrid, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={st.detailsRow}>
              {confirmed!.writer && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.success }]}>Writer</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.writer}</Text></View>}
              {confirmed!.artist && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.success }]}>Artist</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.artist}</Text></View>}
              {confirmed!.coverArtist && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.success }]}>Cover Artist</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.coverArtist}</Text></View>}
              <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.success }]}>Publisher</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.publisher}</Text></View>
            </View>
            <View style={[st.detailsRow, { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: 10 }]}>
              {confirmed!.editor && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.onSurfaceVariant }]}>Editor</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.editor}</Text></View>}
              {confirmed!.coverPrice && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.onSurfaceVariant }]}>Cover Price</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.coverPrice}</Text></View>}
              {confirmed!.pageCount && <View style={st.detailCell}><Text style={[st.detailLabel, { color: colors.onSurfaceVariant }]}>Pages</Text><Text style={[st.detailVal, { color: colors.onSurface }]}>{confirmed!.pageCount}</Text></View>}
            </View>
          </View>
        )}

        {/* Condition */}
        <View style={[st.condCard, { backgroundColor: colors.surface, borderColor: conditionColors[confirmed!.condition] + '30' }]}>
          <View style={[st.condDot, { backgroundColor: conditionColors[confirmed!.condition] }]} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: conditionColors[confirmed!.condition] }}>
              {conditionLabels[confirmed!.condition]?.full ?? confirmed!.condition}
            </Text>
            {confirmed!.conditionNotes ? <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{confirmed!.conditionNotes}</Text> : null}
          </View>
        </View>

        {/* Value — works with DB prices OR AI prices */}
        {prices && (
          <>
            <View style={[st.valueHero, { backgroundColor: colors.surface, borderColor: colors.gold + '30' }]}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gold, letterSpacing: 1 }}>
                {conditionLabels[confirmed!.condition]?.short} MARKET VALUE {!confirmed!.dbMatch ? '(AI EST.)' : ''}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: colors.gold, marginTop: 4 }}>
                ${estPrice?.toLocaleString() ?? '—'}
              </Text>
            </View>

            {/* Spectrum */}
            <View style={[st.spectrum, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              {Object.entries(prices).map(([cond, val]) => {
                const isEst = cond === confirmed!.condition;
                const cc = conditionColors[cond] ?? '#888';
                const maxVal = prices.cgc_9_8 || Math.max(...Object.values(prices));
                const pct = maxVal > 0 ? val / maxVal : 0;
                return (
                  <View key={cond} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: isEst ? '800' : '500', color: isEst ? cc : colors.onSurfaceVariant }}>
                        {conditionLabels[cond]?.short ?? cond} {isEst ? '← scanned' : ''}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: isEst ? '800' : '600', color: isEst ? cc : colors.onSurface }}>${val.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceContainer }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: cc, width: `${Math.max(2, pct * 100)}%`, opacity: isEst ? 1 : 0.4 }} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Asking price */}
            <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant, marginTop: 16 }]}>ASKING PRICE COMPARISON</Text>
            <View style={[st.askRow, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onSurfaceVariant }}>$</Text>
              <TextInput value={askingPrice} onChangeText={setAskingPrice} placeholder="Enter asking price" keyboardType="numeric"
                placeholderTextColor={colors.onSurfaceVariant} style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.onSurface, marginLeft: 4, padding: 0 }} />
            </View>
            {verdict && (
              <View style={[st.verdictCard, { backgroundColor: verdict.color + '12', borderColor: verdict.color + '30' }]}>
                <MaterialIcons name={verdict.icon as any} size={24} color={verdict.color} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: verdict.color }}>{verdict.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{verdict.desc}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Status cards */}
        {alreadyOwned && (
          <View style={[st.statusCard, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success }}>Already In Your Collection</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>"{alreadyOwned.collection}" — {conditionLabels[alreadyOwned.condition]?.full ?? alreadyOwned.condition}</Text>
            </View>
          </View>
        )}
        {onWantList && (
          <View style={[st.statusCard, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
            <MaterialIcons name="bookmark" size={20} color={colors.warning} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warning }}>On Your Want List!</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>Max: ${onWantList.maxPrice.toLocaleString()} · Min: {conditionLabels[onWantList.minCondition]?.short}</Text>
              {askNum > 0 && askNum <= onWantList.maxPrice && <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success, marginTop: 4 }}>Within your budget!</Text>}
            </View>
          </View>
        )}
        {activeListings.length > 0 && (
          <View style={[st.statusCard, { backgroundColor: colors.secondary + '12', borderColor: colors.secondary + '30' }]}>
            <MaterialIcons name="gavel" size={20} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.secondary }}>{activeListings.length} Active Listing{activeListings.length > 1 ? 's' : ''}</Text>
              {activeListings.map(l => <Text key={l.id} style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{conditionLabels[l.condition]?.short} · ${(l.listType === 'auction' ? (l.currentBid || l.startPrice) : l.buyNowPrice)?.toLocaleString()} · {l.endsIn}</Text>)}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={{ gap: 8, marginTop: 20 }}>
          <TouchableOpacity onPress={() => {
            setSaveCondition(confirmed!.condition);
            setSelectedCollId(SEED_COLLECTIONS[0]?.id ?? null);
            setShowCollPicker(true);
          }} style={[st.actionBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.gold }]}>
            <MaterialIcons name="add-circle-outline" size={18} color={colors.gold} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.gold, marginLeft: 8 }}>Save to Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showToast('Added to Want List!')} style={[st.actionBtn, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <MaterialIcons name="bookmark-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurfaceVariant, marginLeft: 8 }}>Add to Want List</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPhase('suggestions')} style={[st.actionBtn, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <MaterialIcons name="undo" size={18} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurfaceVariant, marginLeft: 8 }}>Back to Suggestions</Text>
          </TouchableOpacity>
        </View>

        {/* ── SAVE TO COLLECTION MODAL ─────────────────── */}
        <Modal visible={showCollPicker} transparent animationType="slide" onRequestClose={() => setShowCollPicker(false)}>
          <Pressable onPress={() => setShowCollPicker(false)} style={st.modalOverlay}>
            <Pressable onPress={() => {}} style={[st.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={st.modalHandle} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: 4 }}>Save to Collection</Text>
              <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16 }}>{confirmed?.title}</Text>

              {/* Condition picker */}
              <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>CONDITION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORY_CONDITIONS.comics.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setSaveCondition(c.id as Condition)}
                      style={[st.chip, { borderColor: saveCondition === c.id ? conditionColors[c.id] : colors.outline,
                        backgroundColor: saveCondition === c.id ? conditionColors[c.id] + '15' : 'transparent' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: saveCondition === c.id ? conditionColors[c.id] : colors.onSurfaceVariant }}>
                        {c.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Collection list */}
              <Text style={[st.fieldLabel, { color: colors.onSurfaceVariant }]}>CHOOSE COLLECTION</Text>
              {SEED_COLLECTIONS.map(col => {
                const isSelected = selectedCollId === col.id;
                const myRole = col.members.find(m => m.vaultId === 'Vault #8847')?.role ?? 'viewer';
                const canEdit = myRole === 'owner' || myRole === 'editor';
                const roleInfo = ROLE_INFO[myRole];
                return (
                  <TouchableOpacity key={col.id} onPress={() => canEdit && setSelectedCollId(col.id)}
                    style={[st.collOption, {
                      borderColor: isSelected ? colors.gold : colors.outline,
                      backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                      opacity: canEdit ? 1 : 0.5,
                    }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '400', color: isSelected ? colors.gold : colors.onSurface }}>
                          {col.name}
                        </Text>
                        {col.privacy === 'public' && <MaterialIcons name="public" size={12} color={colors.onSurfaceVariant} />}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{col.items.length} items</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <MaterialIcons name={roleInfo.icon as any} size={10} color={roleInfo.color} />
                          <Text style={{ fontSize: 9, fontWeight: '600', color: roleInfo.color }}>{roleInfo.label}</Text>
                        </View>
                        {col.members.length > 1 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <MaterialIcons name="group" size={10} color={colors.onSurfaceVariant} />
                            <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>{col.members.length} members</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {!canEdit && <Text style={{ fontSize: 9, color: colors.onSurfaceVariant }}>View only</Text>}
                    {isSelected && <MaterialIcons name="check-circle" size={20} color={colors.gold} />}
                  </TouchableOpacity>
                );
              })}

              {/* Create new collection option */}
              <TouchableOpacity style={[st.collOption, { borderColor: colors.outline, borderStyle: 'dashed' }]}>
                <MaterialIcons name="add" size={18} color={colors.onSurfaceVariant} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant, marginLeft: 8 }}>Create New Collection</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => {
                if (selectedCollId) {
                  setShowCollPicker(false);
                  const col = SEED_COLLECTIONS.find(c => c.id === selectedCollId);
                  showToast(`Saved to "${col?.name}"!`);
                }
              }} style={[st.primaryBtn, { backgroundColor: colors.gold, marginTop: 16 }]}>
                <MaterialIcons name="check" size={18} color="#000" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginLeft: 6 }}>Save Item</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {toast && (
          <View style={[st.toast, { backgroundColor: colors.success }]}>
            <MaterialIcons name="check-circle" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>{toast}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  content: { alignItems: 'center', padding: 24, paddingTop: 50 },
  usageCard: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  primaryBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 10 },
  secondBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5 },
  demoCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  suggestionCard: { padding: 16, borderRadius: 14, marginBottom: 10 },
  manualBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 8 },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, marginBottom: 12 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  matchPreview: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  condCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  condDot: { width: 10, height: 10, borderRadius: 5 },
  valueHero: { padding: 20, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', marginBottom: 12 },
  spectrum: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  askRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  verdictCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 10 },
  statusCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5 },
  toast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 12 },
  // Collection picker modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingTop: 12, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: 16 },
  collOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  // Metadata details
  detailsGrid: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  detailCell: { minWidth: '22%', flex: 1, marginBottom: 4 },
  detailLabel: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  detailVal: { fontSize: 12, fontWeight: '500' },
});
