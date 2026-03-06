/**
 * The Collector's Vault — Material Design 3 Theme System
 * 3 modes: Dark (default), Light, High Contrast
 * Based on M3 color roles: https://m3.material.io/styles/color/roles
 *
 * USAGE:  const { colors } = useTheme();
 * RULE:   New screens MUST use useTheme(), not import colors directly.
 */

export type ThemeMode = 'dark' | 'light' | 'high_contrast';

export interface ThemeColors {
  // M3 Surface
  background: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  // M3 Primary (brand gold)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  // M3 Secondary
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  // M3 Tertiary
  tertiary: string;
  tertiaryContainer: string;
  // M3 Error
  error: string;
  errorContainer: string;
  // Semantic
  success: string;
  warning: string;
  info: string;
  gold: string;
  goldDim: string;
  // Component
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  divider: string;
  scrim: string;
  statusBar: 'light' | 'dark';
  // Legacy compat
  surfaceLight: string;
  surfaceBorder: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDark: string;
  white: string;
  green: string;
  greenDark: string;
  blue: string;
  red: string;
  purple: string;
  orange: string;
  yellow: string;
  lime: string;
  goldDark: string;
}

// ── DARK ────────────────────────────────────────────────────────
const dark: ThemeColors = {
  background: '#06060F', surface: '#0D0D1E', surfaceContainer: '#12122A',
  surfaceContainerHigh: '#1A1A35', onSurface: '#E0E0E0', onSurfaceVariant: '#888888',
  outline: '#2A2A4A', outlineVariant: '#1A1A35',
  primary: '#FFD600', onPrimary: '#000000', primaryContainer: '#FFD60018', onPrimaryContainer: '#FFD600',
  secondary: '#2196F3', secondaryContainer: '#2196F318', onSecondaryContainer: '#90CAF9',
  tertiary: '#8E24AA', tertiaryContainer: '#8E24AA18',
  error: '#E53935', errorContainer: '#E5393518',
  success: '#4CAF50', warning: '#FF9800', info: '#2196F3', gold: '#FFD600', goldDim: '#B39700',
  cardBg: '#0D0D1E', inputBg: '#0A0A18', inputBorder: '#2A2A4A',
  tabBar: '#08081A', tabBarBorder: '#1A1A35', tabActive: '#FFD600', tabInactive: '#555555',
  divider: '#1A1A35', scrim: 'rgba(0,0,0,0.6)', statusBar: 'light',
  surfaceLight: '#12122A', surfaceBorder: '#1A1A35', borderSubtle: '#2A2A4A',
  textPrimary: '#E0E0E0', textSecondary: '#888888', textMuted: '#555555', textDark: '#333333',
  white: '#FFFFFF', green: '#4CAF50', greenDark: '#2E7D32', blue: '#2196F3', red: '#E53935',
  purple: '#8E24AA', orange: '#FF9800', yellow: '#FFC107', lime: '#8BC34A', goldDark: '#FF6F00',
};

// ── LIGHT ───────────────────────────────────────────────────────
const light: ThemeColors = {
  background: '#F8F9FA', surface: '#FFFFFF', surfaceContainer: '#F0F0F4',
  surfaceContainerHigh: '#E8E8EC', onSurface: '#1A1A1A', onSurfaceVariant: '#555555',
  outline: '#D0D0D8', outlineVariant: '#E8E8EC',
  primary: '#B38600', onPrimary: '#FFFFFF', primaryContainer: '#FFF3C0', onPrimaryContainer: '#6B5000',
  secondary: '#1565C0', secondaryContainer: '#BBDEFB', onSecondaryContainer: '#0D47A1',
  tertiary: '#6A1B9A', tertiaryContainer: '#E1BEE7',
  error: '#C62828', errorContainer: '#FFCDD2',
  success: '#2E7D32', warning: '#E65100', info: '#1565C0', gold: '#B38600', goldDim: '#8C6A00',
  cardBg: '#FFFFFF', inputBg: '#F0F0F4', inputBorder: '#D0D0D8',
  tabBar: '#FFFFFF', tabBarBorder: '#E0E0E4', tabActive: '#B38600', tabInactive: '#888888',
  divider: '#E0E0E4', scrim: 'rgba(0,0,0,0.3)', statusBar: 'dark',
  surfaceLight: '#F0F0F4', surfaceBorder: '#E0E0E4', borderSubtle: '#D0D0D8',
  textPrimary: '#1A1A1A', textSecondary: '#555555', textMuted: '#888888', textDark: '#BBBBBB',
  white: '#FFFFFF', green: '#2E7D32', greenDark: '#1B5E20', blue: '#1565C0', red: '#C62828',
  purple: '#6A1B9A', orange: '#E65100', yellow: '#F9A825', lime: '#558B2F', goldDark: '#A06000',
};

// ── HIGH CONTRAST ───────────────────────────────────────────────
const highContrast: ThemeColors = {
  background: '#000000', surface: '#0A0A0A', surfaceContainer: '#141414',
  surfaceContainerHigh: '#1E1E1E', onSurface: '#FFFFFF', onSurfaceVariant: '#CCCCCC',
  outline: '#666666', outlineVariant: '#444444',
  primary: '#FFE500', onPrimary: '#000000', primaryContainer: '#FFE50025', onPrimaryContainer: '#FFE500',
  secondary: '#448AFF', secondaryContainer: '#448AFF25', onSecondaryContainer: '#82B1FF',
  tertiary: '#D500F9', tertiaryContainer: '#D500F925',
  error: '#FF1744', errorContainer: '#FF174425',
  success: '#00E676', warning: '#FF9100', info: '#448AFF', gold: '#FFE500', goldDim: '#CCB800',
  cardBg: '#0A0A0A', inputBg: '#000000', inputBorder: '#666666',
  tabBar: '#000000', tabBarBorder: '#666666', tabActive: '#FFE500', tabInactive: '#999999',
  divider: '#444444', scrim: 'rgba(0,0,0,0.8)', statusBar: 'light',
  surfaceLight: '#141414', surfaceBorder: '#444444', borderSubtle: '#666666',
  textPrimary: '#FFFFFF', textSecondary: '#CCCCCC', textMuted: '#999999', textDark: '#666666',
  white: '#FFFFFF', green: '#00E676', greenDark: '#00C853', blue: '#448AFF', red: '#FF1744',
  purple: '#D500F9', orange: '#FF9100', yellow: '#FFEA00', lime: '#76FF03', goldDark: '#FFB300',
};

// ── EXPORTS ─────────────────────────────────────────────────────
export const THEMES: Record<ThemeMode, ThemeColors> = { dark, light, high_contrast: highContrast };

export const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string; desc: string }[] = [
  { id: 'dark', label: 'Dark', icon: 'dark_mode', desc: 'Default vault aesthetic' },
  { id: 'light', label: 'Light', icon: 'light_mode', desc: 'Clean bright interface' },
  { id: 'high_contrast', label: 'High Contrast', icon: 'contrast', desc: 'Maximum readability' },
];

// Legacy default (for screens not yet migrated to useTheme)
export const colors = dark;

// Condition colors — always vivid, theme-independent
export const conditionColors: Record<string, string> = {
  poor: '#E53935', good: '#FF9800', fine: '#FFC107', vf: '#8BC34A', nm: '#4CAF50', cgc_9_8: '#FFD600',
  damaged: '#E53935', heavily_played: '#FF5722', moderately_played: '#FF9800',
  lightly_played: '#FFC107', psa_10: '#FFD600',
  fair: '#FF9800', very_good: '#8BC34A', excellent: '#4CAF50', nwt: '#2196F3', nib: '#2196F3',
  ds: '#4CAF50', vnds: '#8BC34A', beaters: '#E53935', used: '#FF9800', sealed: '#2196F3',
  ag: '#E53935', g: '#FF9800', f: '#FFC107', xf: '#8BC34A', au: '#4CAF50', ms: '#FFD600',
  p: '#E53935', vg: '#FF9800', vg_plus: '#FFC107',
  mint: '#FFD600', certified: '#FFD600', framed: '#2196F3', new: '#4CAF50',
};

export const conditionLabels: Record<string, { short: string; full: string }> = {
  poor: { short: 'PR', full: 'Poor (0.5-1.5)' }, good: { short: 'GD', full: 'Good (2.0-3.5)' },
  fine: { short: 'FN', full: 'Fine (5.0-6.5)' }, vf: { short: 'VF', full: 'Very Fine (7.0-8.5)' },
  nm: { short: 'NM', full: 'Near Mint (9.0-9.4)' }, cgc_9_8: { short: '9.8', full: 'CGC 9.8 (Slabbed)' },
};

export const rarityColors: Record<string, string> = {
  Legendary: '#FFD600', 'Very Rare': '#8E24AA', Rare: '#2196F3', Uncommon: '#4CAF50', Common: '#78909C',
};

export const trustLevels = [
  { level: 0, name: 'Anonymous', color: '#555555', icon: 'person_outline', desc: 'Vault ID only' },
  { level: 1, name: 'Verified', color: '#2196F3', icon: 'verified_user', desc: 'Email verified, metro visible' },
  { level: 2, name: 'Trusted', color: '#4CAF50', icon: 'star', desc: '5+ completed transactions' },
  { level: 3, name: 'Connected', color: '#FFD600', icon: 'handshake', desc: 'Mutually connected' },
];
