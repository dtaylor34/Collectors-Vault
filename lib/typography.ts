/**
 * Typography System — Roboto + Material Design 3 Type Scale
 *
 * USAGE:
 *   import { fonts, typography } from '../lib/typography';
 *   <Text style={typography.titleLarge}>Hello</Text>
 *   <Text style={{ fontFamily: fonts.bold }}>Bold text</Text>
 *
 * FONT LOADING:
 *   Fonts are loaded in app/_layout.tsx via useFonts().
 *   Until loaded, the app shows the splash screen.
 *
 * M3 TYPE SCALE REFERENCE:
 *   https://m3.material.io/styles/typography/type-scale-tokens
 */

import { StyleSheet } from 'react-native';

// ── Font family names (must match useFonts keys in _layout.tsx) ──
export const fonts = {
  thin:       'Roboto_100Thin',
  light:      'Roboto_300Light',
  regular:    'Roboto_400Regular',
  medium:     'Roboto_500Medium',
  semiBold:   'Roboto_600SemiBold',
  bold:       'Roboto_700Bold',
  extraBold:  'Roboto_800ExtraBold',
  black:      'Roboto_900Black',
  // Mono for Vault IDs, prices, code
  mono:       'Courier',  // System mono — or add RobotoMono later
} as const;

// ── M3 Type Scale ───────────────────────────────────────────────
// Each token = { fontFamily, fontSize, lineHeight, letterSpacing, fontWeight }
export const typography = StyleSheet.create({
  // Display
  displayLarge:  { fontFamily: fonts.black,     fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontFamily: fonts.bold,      fontSize: 45, lineHeight: 52 },
  displaySmall:  { fontFamily: fonts.bold,      fontSize: 36, lineHeight: 44 },

  // Headline
  headlineLarge:  { fontFamily: fonts.bold,     fontSize: 32, lineHeight: 40 },
  headlineMedium: { fontFamily: fonts.bold,     fontSize: 28, lineHeight: 36 },
  headlineSmall:  { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 32 },

  // Title
  titleLarge:  { fontFamily: fonts.bold,     fontSize: 22, lineHeight: 28 },
  titleMedium: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall:  { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },

  // Label
  labelLarge:  { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall:  { fontFamily: fonts.medium,   fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },

  // Body
  bodyLarge:  { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  bodyMedium: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall:  { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },

  // App-specific
  price:     { fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 28 },
  priceSmall:{ fontFamily: fonts.bold,      fontSize: 16, lineHeight: 22 },
  vaultId:   { fontFamily: fonts.mono,      fontSize: 14, lineHeight: 18, letterSpacing: 0.5 },
  badge:     { fontFamily: fonts.bold,      fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
  caption:   { fontFamily: fonts.regular,   fontSize: 10, lineHeight: 14, letterSpacing: 0.4 },
});
