/**
 * Material Design Icon Helper
 * Uses @expo/vector-icons which bundles MaterialIcons and MaterialCommunityIcons
 *
 * USAGE:
 *   import { Icon } from '../lib/icons';
 *   <Icon name="inventory_2" size={24} color="#FFD600" />
 *
 * ICON REFERENCE:
 *   https://fonts.google.com/icons?selected=Material+Symbols+Outlined
 *   https://pictogrammers.com/library/mdi/  (for MaterialCommunityIcons)
 */

import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';

type MIName = ComponentProps<typeof MaterialIcons>['name'];
type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Map our semantic names to actual icon names
// This lets us swap icons in one place without hunting through screens
const ICON_MAP = {
  // Navigation
  vault: 'inventory-2' as MIName,
  scan: 'photo-camera' as MIName,
  auction: 'gavel' as MIName,
  browse: 'search' as MIName,
  profile: 'person' as MIName,

  // Actions
  add: 'add' as MIName,
  edit: 'edit' as MIName,
  delete: 'delete-outline' as MIName,
  share: 'share' as MIName,
  sell: 'sell' as MIName,
  back: 'arrow-back' as MIName,
  close: 'close' as MIName,
  filter: 'filter-list' as MIName,
  sort: 'sort' as MIName,
  more: 'more-vert' as MIName,
  settings: 'settings' as MIName,
  export: 'file-download' as MIName,

  // Theme
  dark_mode: 'dark-mode' as MIName,
  light_mode: 'light-mode' as MIName,
  contrast: 'contrast' as MIName,

  // Content
  collection: 'collections' as MIName,
  item: 'style' as MIName,
  image: 'image' as MIName,
  price: 'attach-money' as MIName,
  trending_up: 'trending-up' as MIName,
  trending_down: 'trending-down' as MIName,
  grade: 'grade' as MIName,
  star: 'star' as MIName,
  star_outline: 'star-outline' as MIName,

  // Trust & Identity
  person_outline: 'person-outline' as MIName,
  verified_user: 'verified-user' as MIName,
  handshake: 'handshake' as MIName,
  shield: 'shield' as MIName,
  lock: 'lock' as MIName,
  visibility: 'visibility' as MIName,
  visibility_off: 'visibility-off' as MIName,

  // Location
  location: 'location-on' as MIName,
  nearby: 'near-me' as MIName,
  public: 'public' as MIName,

  // Collectible types
  comics: 'menu-book' as MIName,
  cards: 'style' as MIName,
  figures: 'smart-toy' as MIName,
  coins: 'paid' as MIName,
  fashion: 'checkroom' as MIName,
  shoes: 'ice-skating' as MIName,
  jewelry: 'diamond' as MIName,
  vinyl: 'album' as MIName,
  art: 'palette' as MIName,
  other: 'category' as MIName,

  // Auction
  bid: 'gavel' as MIName,
  buy_now: 'shopping-cart' as MIName,
  timer: 'timer' as MIName,
  history: 'history' as MIName,

  // Status
  check: 'check-circle' as MIName,
  error: 'error' as MIName,
  warning: 'warning' as MIName,
  info: 'info' as MIName,
  pending: 'pending' as MIName,

  // Misc
  camera: 'camera-alt' as MIName,
  gallery: 'photo-library' as MIName,
  link: 'link' as MIName,
  upgrade: 'bolt' as MIName,
  logout: 'logout' as MIName,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = '#888' }: IconProps) {
  const iconName = ICON_MAP[name];
  return <MaterialIcons name={iconName} size={size} color={color} />;
}

// Re-export for direct use when needed
export { MaterialIcons, MaterialCommunityIcons };
