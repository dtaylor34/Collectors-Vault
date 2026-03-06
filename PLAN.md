# The Collector's Vault — Development Plan

> **Last Updated:** March 4, 2026
> **Author:** Darrell (Rivet Studio)
> **AI Context:** Give this file + `.cursorrules` to Claude or Cursor to resume work.

---

## 1. What Is This App?

A cross-platform collectibles app where users scan any item (comics, cards, sneakers, coins, fashion) with AI, track values across conditions, and trade on an anonymous marketplace called the Auction Block.

**Core loop:** Scan → Identify → Price → Collect → Sell

**Key differentiator:** Full anonymity system — users are Vault IDs, not names. Trust earned through transactions. Real identity shared only through mutual connection requests.

---

## 2. Current State (What Works)

### ✅ Running
- [x] Expo project boots on web (`npx expo start --clear`, press w)
- [x] 5-tab navigation: Vault, Scan, Auction, Browse, Profile
- [x] Dark/Light/High Contrast theme toggle (Profile → Appearance)
- [x] Vault dashboard with portfolio value and collection cards
- [x] Collection detail view with item list
- [x] Item detail view with large cover, price guide table, condition, affiliate links
- [x] Comic Vine API integration — real cover images load (via CORS proxy on web)
- [x] Auction Block with 8 seed listings, bidding, buy now, proximity badges
- [x] Browse Vaults — 6 anonymous profiles with public collections
- [x] Profile — Vault ID, trust level, metro picker, theme toggle, privacy info
- [x] Scan — Category-aware camera + AI prompt system (needs API key server-side)
- [x] 10 collectible categories with per-category conditions + affiliate partners
- [x] 18 Bronze Age comic pricing entries with cover colors

### ⚠️ Partially Working
- [ ] Theme: Vault + Profile screens respond to theme. Auction/Browse/Scan still use hardcoded dark colors.
- [ ] Icons: Using emoji in tab bar + buttons. Material Icons lib is installed but not wired into screens yet.
- [ ] Covers: Comic Vine works via CORS proxy (dev only). Needs Edge Function proxy for production.

### ❌ Not Yet Built
- [ ] Auth flow (Firebase sign up / sign in / onboarding)
- [ ] Supabase backend (schema exists but not connected)
- [ ] Real data persistence (everything is local state)
- [ ] Photo upload to Firebase Storage
- [ ] Create listing flow from collection item
- [ ] Real bid validation (server-side Edge Function)
- [ ] Push notifications
- [ ] Stripe Connect payments
- [ ] Landing/marketing page
- [ ] App Store submission

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│                    EXPO APP                           │
│                                                      │
│  ┌────────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌────────┐ │
│  │ Vault  │ │ Scan │ │Auction│ │Browse│ │Profile │ │
│  └───┬────┘ └──┬───┘ └───┬───┘ └──┬───┘ └───┬────┘ │
│      │         │         │        │          │      │
│  ┌───┴─────────┴─────────┴────────┴──────────┴───┐  │
│  │              HOOKS LAYER                       │  │
│  │  useTheme  useAuth  useCollection  useListings │  │
│  │  useCamera                                     │  │
│  └───┬─────────┬─────────┬────────────────────────┘  │
│      │         │         │                           │
│  ┌───┴───┐ ┌───┴───┐ ┌──┴──────┐                   │
│  │Theme  │ │Firebase│ │Supabase │                   │
│  │Context│ │Auth+Stg│ │DB+RT+EF │                   │
│  └───────┘ └───────┘ └─────────┘                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              LIB LAYER                        │   │
│  │  theme.ts  icons.tsx  data.ts  comicvine.ts   │   │
│  │  ai/identify  search/fuzzy  export/csv        │   │
│  │  anonymity/trust  location/metros             │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐         ┌─────┴─────┐
    │Firebase │         │ Supabase  │
    │Auth     │         │ Postgres  │
    │Storage  │         │ RLS       │
    │FCM      │         │ Realtime  │
    └─────────┘         │ Edge Fns  │
                        └───────────┘
```

---

## 4. Design System

### Theme
- Material Design 3 color roles (see `lib/theme.ts`)
- 3 modes: Dark (default), Light, High Contrast
- Context-based: `useTheme()` → `{ colors, mode, setMode }`
- **Rule:** New screens MUST use `useTheme()`, never import `colors` directly

### Icons
- `@expo/vector-icons` → MaterialIcons
- Semantic mapping in `lib/icons.tsx`
- **Rule:** Use `<Icon name="vault" />` not emoji in UI chrome

### Typography
- System font (no custom fonts yet)
- Scale: 9-10 labels, 11-12 body, 13-14 titles, 16-22 hero, 24+ page titles

### Spacing
- 4/8/12/16/20/24 grid
- Cards: padding 14-16, borderRadius 12
- Sections: padding 18-20, borderRadius 14

---

## 5. Development Phases

### Phase 1: Core Polish (Current Sprint)
- [ ] Migrate ALL screens to `useTheme()` (auction.tsx, browse.tsx, scan.tsx)
- [ ] Replace all emoji icons with Material Icons in tab bar + buttons
- [ ] Wire up item detail view tap-through on Auction listings
- [ ] Add pull-to-refresh on Vault and Auction
- [ ] Add skeleton loading states
- [ ] Fix Comic Vine CORS for production (Edge Function proxy)

### Phase 2: Auth + Persistence
- [ ] Firebase Auth: sign up, sign in, forgot password, Apple/Google sign-in
- [ ] Onboarding flow: create Vault ID, set metro, verify email
- [ ] Connect Supabase: collections, items, listings, users
- [ ] Photo upload: camera → compress → EXIF strip → Firebase Storage
- [ ] Replace local state with Supabase queries in hooks

### Phase 3: Auction Block
- [ ] Create listing from collection item (with market guidance)
- [ ] Server-side bid validation (Edge Function)
- [ ] Supabase Realtime bid subscriptions
- [ ] Anti-sniping (extend auction if bid in last 2 min)
- [ ] Push notifications for outbid alerts
- [ ] Stripe Connect for payments + escrow

### Phase 4: App Store
- [ ] EAS Build for iOS + Android
- [ ] App Store screenshots + description
- [ ] Apple IAP for Pro subscription
- [ ] Google Play Billing
- [ ] Landing page (web)
- [ ] Legal: ToS, Privacy Policy

### Phase 5: Multi-Category Expansion
- [ ] Trading cards: Scryfall (MTG), Pokémon TCG API, JustTCG pricing
- [ ] Sneakers: StockX/GOAT affiliate
- [ ] Fashion: The RealReal affiliate
- [ ] Coins: PCGS/NGC affiliate
- [ ] Category-specific AI prompts tuned per vertical

---

## 6. Key Files Reference

| What | Where | Notes |
|------|-------|-------|
| All types + seed data | `lib/data.ts` | Categories, conditions, affiliates, pricing |
| Theme tokens | `lib/theme.ts` | M3 colors, 3 modes, condition/rarity colors |
| Typography | `lib/typography.ts` | Roboto font families + M3 type scale tokens |
| Theme hook | `hooks/useTheme.tsx` | React Context provider |
| Icon helper | `lib/icons.tsx` | `<Icon name="vault" />` |
| Cover images | `lib/comicvine.ts` | API + cache + CORS proxy |
| AI identification | `lib/ai/identify.ts` | Category-aware Claude Vision prompts |
| DB schema | `supabase/migrations/001_initial_schema.sql` | Full Postgres + RLS |
| Cursor AI rules | `.cursorrules` | Architecture for AI assistants |
| This file | `PLAN.md` | You are here |

---

## 7. Env Setup

```bash
cp .env.example .env
# Fill in:
#   EXPO_PUBLIC_COMICVINE_API_KEY  (free — comicvine.gamespot.com/api)
#   EXPO_PUBLIC_FIREBASE_*          (from Firebase console)
#   EXPO_PUBLIC_SUPABASE_*          (from Supabase dashboard)
#   ANTHROPIC_API_KEY               (for AI — server-side Edge Function only)
```

---

## 8. How to Give This to Claude

Paste this message to start a new session:

> I'm building The Collector's Vault app. Here are two files that describe the architecture:
> 1. `.cursorrules` — project structure, tech stack, styling rules
> 2. `PLAN.md` — current state, what's done, what's next
>
> [paste both files]
>
> Pick up where we left off. Here's what I want to work on next: [describe task]

---

## 9. Merged History

This project merges two earlier prototypes:
- **Radstash** (Sep 2025): Multi-category cataloging, landing page, Firebase auth, drag-drop
- **Collector's Vault** (Mar 2026): Comics pricing, auction marketplace, anonymity, location

The formal merge spec is in `Collectors-Vault-Merged-Spec-v2.docx`.
