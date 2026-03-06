# The Collector's Vault

Cross-platform collectibles management + anonymous marketplace.

**Comics · Trading Cards · Sneakers · Fashion · Coins · Vinyl · Art · Everything**

**Web · iOS · Android** — Built with Expo (React Native) + Supabase + Firebase

---

## Quick Start (No Backend Needed)

The app runs with seed data out of the box. No Supabase or Firebase needed for the demo.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start
```

> **⚠️ Path Warning:** Make sure your project folder path has NO SPACES.
> Use `collectors-vault` not `Collectors Vault`. Spaces in the path break Metro bundler.
> A `metro.config.js` workaround is included, but avoiding spaces entirely is safest.

Then:
- Press **w** to open in web browser
- Press **i** to open in iOS Simulator (requires Xcode)
- Press **a** to open in Android Emulator (requires Android Studio)
- Scan the QR code with **Expo Go** app on your phone

---

## What's Merged

This project unifies two earlier prototypes:
- **Radstash** (Sep 2025): Multi-category cataloging, landing page, drag-drop uploads, Firebase auth
- **Collector's Vault** (Mar 2026): Comics pricing, auction marketplace, anonymity, location proximity

---

## What Works Right Now

All screens render with seed data. You can:

- **Vault tab**: View collections across categories (comics, cards, sneakers, etc), see portfolio value, create new collections with category picker
- **Scan tab**: Category-aware camera capture — select "Comics", "Trading Cards", "Sneakers", etc and AI prompts adapt per category
- **Auction tab**: Browse 8 pre-loaded listings, filter by type/location, view bid history, place bids, buy now
- **Browse tab**: View anonymous vault profiles, public collections, proximity badges, send connection requests
- **Profile tab**: See your Vault ID, trust level, metro area picker, anonymity info

### 10 Collectible Categories
Comics, Trading Cards, Action Figures, Coins, Fashion, Shoes/Sneakers, Jewelry/Watches, Vinyl Records, Art/Prints, Other

Each category has its own condition grading system and affiliate partners.

---

## Project Structure

```
collectors-vault/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (dark theme)
│   └── (tabs)/             # Bottom tab navigator
│       ├── _layout.tsx     # Tab bar config
│       ├── vault.tsx       # Collection management
│       ├── scan.tsx        # Camera + AI identification
│       ├── auction.tsx     # Auction Block marketplace
│       ├── browse.tsx      # Public vault directory
│       └── profile.tsx     # Identity + settings
├── lib/
│   ├── data.ts             # Types, seed data, helpers
│   └── theme.ts            # Colors, design tokens
├── assets/                 # App icons, splash screens
├── supabase/
│   └── migrations/         # Database schema (SQL)
├── app.json                # Expo config
├── package.json
└── README.md
```

---

## Backend Setup (Production)

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key into environment variables

### 2. Firebase

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password + Google + Apple)
3. Enable Cloud Storage (for photo uploads)
4. Download config files:
   - iOS: `GoogleService-Info.plist`
   - Android: `google-services.json`

### 3. Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
ANTHROPIC_API_KEY=your-key  # Server-side only
```

---

## App Store Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Next Steps

1. **Wire up Supabase** — Replace seed data with real database queries
2. **Add Firebase Auth** — Login/signup flow with anonymous onboarding
3. **Photo uploads** — Firebase Storage with EXIF stripping
4. **Real-time bids** — Supabase Realtime subscriptions
5. **Push notifications** — Outbid alerts via Firebase Cloud Messaging
6. **Stripe Connect** — Payment processing for marketplace transactions
7. **Expand database** — Seed 500+ Bronze Age key issues with pricing
