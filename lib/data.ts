// ═══════════════════════════════════════════════════════════════
// Types & Seed Data — The Collector's Vault
// ═══════════════════════════════════════════════════════════════

export type Condition = 'poor' | 'good' | 'fine' | 'vf' | 'nm' | 'cgc_9_8';
export type ListType = 'auction' | 'buy_now';
export type Privacy = 'private' | 'public';
export type ItemSource = 'database' | 'manual' | 'ai_identified';
export type CollectibleType = 'comics' | 'cards' | 'figures' | 'coins' | 'fashion' | 'shoes' | 'jewelry' | 'vinyl' | 'art' | 'other';

export const COLLECTIBLE_TYPES: { id: CollectibleType; label: string; icon: string; desc: string }[] = [
  { id: 'comics', label: 'Comics', icon: '📚', desc: 'Comic books, graphic novels, manga' },
  { id: 'cards', label: 'Trading Cards', icon: '🃏', desc: 'Pokémon, Magic, Sports, Yu-Gi-Oh' },
  { id: 'figures', label: 'Action Figures', icon: '🦸', desc: 'Toys, statues, vinyl figures' },
  { id: 'coins', label: 'Coins & Currency', icon: '🪙', desc: 'Coins, banknotes, bullion' },
  { id: 'fashion', label: 'Fashion', icon: '👜', desc: 'Handbags, sunglasses, clothing' },
  { id: 'shoes', label: 'Shoes & Sneakers', icon: '👟', desc: 'Sneakers, vintage footwear' },
  { id: 'jewelry', label: 'Jewelry & Watches', icon: '💎', desc: 'Rings, watches, necklaces' },
  { id: 'vinyl', label: 'Vinyl Records', icon: '🎵', desc: 'LPs, 45s, box sets' },
  { id: 'art', label: 'Art & Prints', icon: '🎨', desc: 'Prints, posters, original art' },
  { id: 'other', label: 'Other', icon: '📦', desc: 'Anything else you collect' },
];

// Category-specific condition systems
export const CATEGORY_CONDITIONS: Record<CollectibleType, { id: string; short: string; full: string }[]> = {
  comics: [
    { id: 'poor', short: 'PR', full: 'Poor (0.5-1.5)' },
    { id: 'good', short: 'GD', full: 'Good (2.0-3.5)' },
    { id: 'fine', short: 'FN', full: 'Fine (5.0-6.5)' },
    { id: 'vf', short: 'VF', full: 'Very Fine (7.0-8.5)' },
    { id: 'nm', short: 'NM', full: 'Near Mint (9.0-9.4)' },
    { id: 'cgc_9_8', short: '9.8', full: 'CGC 9.8 (Slabbed)' },
  ],
  cards: [
    { id: 'damaged', short: 'DMG', full: 'Damaged' },
    { id: 'heavily_played', short: 'HP', full: 'Heavily Played' },
    { id: 'moderately_played', short: 'MP', full: 'Moderately Played' },
    { id: 'lightly_played', short: 'LP', full: 'Lightly Played' },
    { id: 'nm', short: 'NM', full: 'Near Mint' },
    { id: 'psa_10', short: 'PSA10', full: 'PSA 10 (Gem Mint)' },
  ],
  fashion: [
    { id: 'fair', short: 'FR', full: 'Fair — Visible wear' },
    { id: 'good', short: 'GD', full: 'Good — Light signs of use' },
    { id: 'very_good', short: 'VG', full: 'Very Good — Minimal wear' },
    { id: 'excellent', short: 'EX', full: 'Excellent — Like new' },
    { id: 'nwt', short: 'NWT', full: 'New With Tags' },
    { id: 'nib', short: 'NIB', full: 'New In Box' },
  ],
  shoes: [
    { id: 'beaters', short: 'BTR', full: 'Beaters — Heavy wear' },
    { id: 'used', short: 'USD', full: 'Used — Visible wear' },
    { id: 'vnds', short: 'VNDS', full: 'Very Near Deadstock' },
    { id: 'ds', short: 'DS', full: 'Deadstock (unworn)' },
    { id: 'ds_og', short: 'DSOG', full: 'Deadstock OG All' },
    { id: 'sealed', short: 'NEW', full: 'Factory Sealed' },
  ],
  figures: [
    { id: 'loose_damaged', short: 'L/D', full: 'Loose — Damaged' },
    { id: 'loose_complete', short: 'L/C', full: 'Loose — Complete' },
    { id: 'loose_mint', short: 'L/M', full: 'Loose — Mint' },
    { id: 'opened', short: 'OPN', full: 'Opened — Box included' },
    { id: 'mib', short: 'MIB', full: 'Mint In Box' },
    { id: 'misb', short: 'MISB', full: 'Mint Sealed In Box' },
  ],
  coins: [
    { id: 'ag', short: 'AG', full: 'About Good (AG-3)' },
    { id: 'g', short: 'G', full: 'Good (G-4/6)' },
    { id: 'f', short: 'F', full: 'Fine (F-12/15)' },
    { id: 'xf', short: 'XF', full: 'Extremely Fine (XF-40/45)' },
    { id: 'au', short: 'AU', full: 'About Uncirculated (AU-50/58)' },
    { id: 'ms', short: 'MS', full: 'Mint State (MS-60+)' },
  ],
  jewelry: [
    { id: 'fair', short: 'FR', full: 'Fair — Repairs needed' },
    { id: 'good', short: 'GD', full: 'Good — Normal wear' },
    { id: 'very_good', short: 'VG', full: 'Very Good — Light wear' },
    { id: 'excellent', short: 'EX', full: 'Excellent — Minimal wear' },
    { id: 'new', short: 'NEW', full: 'New / Unworn' },
    { id: 'certified', short: 'CERT', full: 'Certified / Appraised' },
  ],
  vinyl: [
    { id: 'p', short: 'P', full: 'Poor — Barely playable' },
    { id: 'g', short: 'G', full: 'Good — Surface noise' },
    { id: 'vg', short: 'VG', full: 'Very Good — Light marks' },
    { id: 'vg_plus', short: 'VG+', full: 'Very Good Plus' },
    { id: 'nm', short: 'NM', full: 'Near Mint' },
    { id: 'sealed', short: 'M', full: 'Mint / Sealed' },
  ],
  art: [
    { id: 'fair', short: 'FR', full: 'Fair — Damage/foxing' },
    { id: 'good', short: 'GD', full: 'Good — Age wear' },
    { id: 'fine', short: 'FN', full: 'Fine — Clean' },
    { id: 'excellent', short: 'EX', full: 'Excellent — Pristine' },
    { id: 'framed', short: 'FRM', full: 'Professionally Framed' },
    { id: 'sealed', short: 'NEW', full: 'New / Sealed' },
  ],
  other: [
    { id: 'poor', short: 'PR', full: 'Poor' },
    { id: 'fair', short: 'FR', full: 'Fair' },
    { id: 'good', short: 'GD', full: 'Good' },
    { id: 'very_good', short: 'VG', full: 'Very Good' },
    { id: 'excellent', short: 'EX', full: 'Excellent' },
    { id: 'mint', short: 'MT', full: 'Mint / New' },
  ],
};

// Affiliate partners per category
export const AFFILIATE_PARTNERS: Record<CollectibleType, { name: string; url: string; icon: string }[]> = {
  comics: [
    { name: 'GoCollect', url: 'https://gocollect.com/search', icon: '📊' },
    { name: 'PriceCharting', url: 'https://www.pricecharting.com/search-products', icon: '📈' },
    { name: 'eBay', url: 'https://www.ebay.com/sch/i.html', icon: '🛒' },
    { name: 'Heritage Auctions', url: 'https://comics.ha.com/c/search', icon: '🏛' },
  ],
  cards: [
    { name: 'TCGPlayer', url: 'https://www.tcgplayer.com/search/all/product', icon: '🃏' },
    { name: 'PriceCharting', url: 'https://www.pricecharting.com/search-products', icon: '📈' },
    { name: 'eBay', url: 'https://www.ebay.com/sch/i.html', icon: '🛒' },
    { name: 'Beckett', url: 'https://www.beckett.com/search', icon: '📋' },
  ],
  fashion: [
    { name: 'The RealReal', url: 'https://therealreal.com', icon: '👜' },
    { name: 'Vestiaire', url: 'https://vestiairecollective.com', icon: '🏷' },
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
  ],
  shoes: [
    { name: 'StockX', url: 'https://stockx.com', icon: '📊' },
    { name: 'GOAT', url: 'https://goat.com', icon: '👟' },
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
  ],
  figures: [
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
    { name: 'PriceCharting', url: 'https://pricecharting.com', icon: '📈' },
  ],
  coins: [
    { name: 'PCGS CoinFacts', url: 'https://pcgs.com', icon: '🪙' },
    { name: 'NGC', url: 'https://ngccoin.com', icon: '🏅' },
    { name: 'Heritage Auctions', url: 'https://ha.com', icon: '🏛' },
  ],
  jewelry: [
    { name: 'Chrono24', url: 'https://chrono24.com', icon: '⌚' },
    { name: 'The RealReal', url: 'https://therealreal.com', icon: '💎' },
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
  ],
  vinyl: [
    { name: 'Discogs', url: 'https://discogs.com', icon: '🎵' },
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
  ],
  art: [
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
    { name: 'Heritage Auctions', url: 'https://ha.com', icon: '🏛' },
  ],
  other: [
    { name: 'eBay', url: 'https://ebay.com', icon: '🛒' },
  ],
};

export interface PricingEntry {
  db_id: string;
  title: string;
  publisher: string;
  year: number;
  significance: string;
  creators: string;
  rarity: string;
  prices: Record<Condition, number>;
  coverColor?: string;
  issueNum?: string;
  // Detailed metadata
  writer?: string;
  artist?: string;
  coverArtist?: string;
  inker?: string;
  colorist?: string;
  letterer?: string;
  editor?: string;
  publicationDate?: string;  // "Nov 10, 1974"
  coverPrice?: string;       // "$0.25"
  pageCount?: number;
  about?: string;            // "1999 Reprint", "Newsstand Edition", etc.
  keyIssue?: boolean;
}

export interface CollectionItem {
  id: string;
  matchId: string | null;
  condition: Condition;
  photo: string | null;
  userNotes: string;
  source: ItemSource;
  customData?: {
    title: string;
    publisher: string;
    year: number | null;
    significance: string;
    rarity: string;
    creators: string;
    estimatedValue: number;
  };
  createdAt: string;
}

// Collection sharing roles
export type CollectionRole = 'owner' | 'editor' | 'viewer';

export interface CollectionMember {
  vaultId: string;
  role: CollectionRole;
  addedAt: string;
  addedBy: string;  // vault ID of who invited them
}

export const ROLE_INFO: Record<CollectionRole, { label: string; icon: string; color: string; desc: string }> = {
  owner: { label: 'Owner', icon: 'shield', color: '#FFD600', desc: 'Full control — can edit, share, and remove members' },
  editor: { label: 'Editor', icon: 'edit', color: '#4CAF50', desc: 'Can add, edit, and remove items' },
  viewer: { label: 'Viewer', icon: 'visibility', color: '#2196F3', desc: 'Can view items but not edit' },
};

export interface Collection {
  id: string;
  name: string;
  privacy: Privacy;
  collectibleType: CollectibleType;
  items: CollectionItem[];
  createdAt: string;
  // Sharing
  members: CollectionMember[];  // always includes owner
  description?: string;
}

export interface MetroArea {
  id: string;
  label: string;
  state: string;
  region: string;
}

export interface VaultUser {
  id: string;
  vaultId: string;
  trustLevel: number;
  metro: string;
  transactions: number;
  memberSince: string;
  publicCollections: number;
}

export interface Bid {
  user: string;
  amount: number;
  time: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  dbId: string;
  condition: Condition;
  sellerNotes: string;
  listType: ListType;
  startPrice: number | null;
  buyNowPrice: number | null;
  currentBid: number | null;
  bidCount: number;
  bidHistory: Bid[];
  endsIn: string;
  photo: string | null;
}

export interface PublicCollection {
  id: string;
  ownerId: string;
  name: string;
  itemCount: number;
  totalValue: number;
  topItems: string[];
}

// ── METRO AREAS ─────────────────────────────────────────────────
export const METROS: MetroArea[] = [
  { id: 'sf-bay', label: 'SF Bay Area', state: 'CA', region: 'West' },
  { id: 'la-metro', label: 'Los Angeles Metro', state: 'CA', region: 'West' },
  { id: 'nyc-metro', label: 'NYC Metro', state: 'NY', region: 'Northeast' },
  { id: 'chicago', label: 'Chicago Metro', state: 'IL', region: 'Midwest' },
  { id: 'dallas', label: 'Dallas-Fort Worth', state: 'TX', region: 'South' },
  { id: 'seattle', label: 'Seattle Metro', state: 'WA', region: 'West' },
  { id: 'miami', label: 'Miami-Dade', state: 'FL', region: 'South' },
  { id: 'denver', label: 'Denver Metro', state: 'CO', region: 'West' },
  { id: 'atlanta', label: 'Atlanta Metro', state: 'GA', region: 'South' },
  { id: 'phoenix', label: 'Phoenix Metro', state: 'AZ', region: 'West' },
  { id: 'boston', label: 'Boston Metro', state: 'MA', region: 'Northeast' },
  { id: 'portland', label: 'Portland Metro', state: 'OR', region: 'West' },
];

// ── PRICING DATABASE ────────────────────────────────────────────
export const PRICING_DB: PricingEntry[] = [
  { db_id: 'hulk-181', title: 'The Incredible Hulk #181', publisher: 'Marvel', year: 1974, significance: '1st full appearance of Wolverine', creators: 'Len Wein / Herb Trimpe', rarity: 'Legendary', coverColor: '#2E7D32', issueNum: '#181', keyIssue: true,
    writer: 'Len Wein', artist: 'Herb Trimpe', coverArtist: 'Herb Trimpe', inker: 'Jack Abel', colorist: 'Glynis Wein', letterer: 'Artie Simek', editor: 'Roy Thomas', publicationDate: 'Nov 10, 1974', coverPrice: '$0.25', pageCount: 36,
    prices: { poor: 400, good: 1200, fine: 3500, vf: 7500, nm: 12000, cgc_9_8: 69000 } },
  { db_id: 'hulk-180', title: 'The Incredible Hulk #180', publisher: 'Marvel', year: 1974, significance: '1st cameo Wolverine (last page)', creators: 'Len Wein / Herb Trimpe', rarity: 'Very Rare', coverColor: '#1B5E20', issueNum: '#180', keyIssue: true,
    writer: 'Len Wein', artist: 'Herb Trimpe', coverArtist: 'Herb Trimpe', inker: 'Jack Abel', colorist: 'Glynis Wein', letterer: 'Artie Simek', editor: 'Roy Thomas', publicationDate: 'Oct 10, 1974', coverPrice: '$0.25', pageCount: 36,
    prices: { poor: 80, good: 200, fine: 600, vf: 1500, nm: 2500, cgc_9_8: 25000 } },
  { db_id: 'hulk-182', title: 'The Incredible Hulk #182', publisher: 'Marvel', year: 1974, significance: '3rd Wolverine, Wendigo conclusion', creators: 'Len Wein / Herb Trimpe', rarity: 'Rare', coverColor: '#388E3C', issueNum: '#182',
    writer: 'Len Wein', artist: 'Herb Trimpe', coverArtist: 'Herb Trimpe', inker: 'Jack Abel', colorist: 'Glynis Wein', letterer: 'Artie Simek', editor: 'Roy Thomas', publicationDate: 'Dec 10, 1974', coverPrice: '$0.25', pageCount: 36,
    prices: { poor: 20, good: 60, fine: 150, vf: 350, nm: 600, cgc_9_8: 8000 } },
  { db_id: 'wls-1', title: 'Wolverine Limited Series #1', publisher: 'Marvel', year: 1982, significance: '1st solo Wolverine — Frank Miller', creators: 'Chris Claremont / Frank Miller', rarity: 'Very Rare', coverColor: '#B71C1C', issueNum: '#1', keyIssue: true,
    writer: 'Chris Claremont', artist: 'Frank Miller', coverArtist: 'Frank Miller', inker: 'Joe Rubinstein', colorist: 'Glynis Wein', letterer: 'Tom Orzechowski', editor: 'Louise Jones', publicationDate: 'Sep 1, 1982', coverPrice: '$0.60', pageCount: 32,
    prices: { poor: 10, good: 30, fine: 60, vf: 100, nm: 150, cgc_9_8: 850 } },
  { db_id: 'wls-2', title: 'Wolverine Limited Series #2', publisher: 'Marvel', year: 1982, significance: 'Wolverine vs The Hand', creators: 'Chris Claremont / Frank Miller', rarity: 'Rare', coverColor: '#C62828', issueNum: '#2',
    writer: 'Chris Claremont', artist: 'Frank Miller', coverArtist: 'Frank Miller', inker: 'Joe Rubinstein', colorist: 'Glynis Wein', letterer: 'Tom Orzechowski', editor: 'Louise Jones', publicationDate: 'Oct 1, 1982', coverPrice: '$0.60', pageCount: 32,
    prices: { poor: 5, good: 15, fine: 30, vf: 50, nm: 70, cgc_9_8: 500 } },
  { db_id: 'wls-3', title: 'Wolverine Limited Series #3', publisher: 'Marvel', year: 1982, significance: 'Logan poisoned, Lord Shingen', creators: 'Chris Claremont / Frank Miller', rarity: 'Rare', coverColor: '#D32F2F', issueNum: '#3',
    writer: 'Chris Claremont', artist: 'Frank Miller', coverArtist: 'Frank Miller', inker: 'Joe Rubinstein', colorist: 'Glynis Wein', letterer: 'Tom Orzechowski', editor: 'Louise Jones', publicationDate: 'Nov 1, 1982', coverPrice: '$0.60', pageCount: 32,
    prices: { poor: 4, good: 12, fine: 25, vf: 40, nm: 60, cgc_9_8: 450 } },
  { db_id: 'wls-4', title: 'Wolverine Limited Series #4', publisher: 'Marvel', year: 1982, significance: 'Finale — proposes to Mariko', creators: 'Chris Claremont / Frank Miller', rarity: 'Rare', coverColor: '#E53935', issueNum: '#4',
    writer: 'Chris Claremont', artist: 'Frank Miller', coverArtist: 'Frank Miller', inker: 'Joe Rubinstein', colorist: 'Glynis Wein', letterer: 'Tom Orzechowski', editor: 'Louise Jones', publicationDate: 'Dec 1, 1982', coverPrice: '$0.60', pageCount: 32,
    prices: { poor: 4, good: 12, fine: 25, vf: 40, nm: 60, cgc_9_8: 450 } },
  { db_id: 'gsx-1', title: 'Giant-Size X-Men #1', publisher: 'Marvel', year: 1975, significance: '1st Storm, Colossus, Nightcrawler', creators: 'Len Wein / Dave Cockrum', rarity: 'Legendary', coverColor: '#4A148C', issueNum: '#1', keyIssue: true,
    writer: 'Len Wein', artist: 'Dave Cockrum', coverArtist: 'Gil Kane / Dave Cockrum', inker: 'Dave Cockrum', colorist: 'Glynis Wein', letterer: 'John Costanza', editor: 'Marv Wolfman', publicationDate: 'May 1, 1975', coverPrice: '$0.50', pageCount: 68, about: 'Giant-Size format',
    prices: { poor: 250, good: 800, fine: 2500, vf: 6000, nm: 10000, cgc_9_8: 60000 } },
  { db_id: 'ms5', title: 'Marvel Spotlight #5', publisher: 'Marvel', year: 1972, significance: '1st Ghost Rider', creators: 'Gary Friedrich / Mike Ploog', rarity: 'Legendary', coverColor: '#E65100', issueNum: '#5', keyIssue: true,
    writer: 'Gary Friedrich', artist: 'Mike Ploog', coverArtist: 'Mike Ploog', inker: 'Mike Ploog', colorist: 'Not credited', letterer: 'Jon Costa', editor: 'Stan Lee', publicationDate: 'Aug 1, 1972', coverPrice: '$0.20', pageCount: 36,
    prices: { poor: 150, good: 500, fine: 1800, vf: 4500, nm: 8000, cgc_9_8: 90000 } },
  { db_id: 'asm-129', title: 'The Amazing Spider-Man #129', publisher: 'Marvel', year: 1974, significance: '1st Punisher', creators: 'Gerry Conway / Ross Andru', rarity: 'Very Rare', coverColor: '#1565C0', issueNum: '#129', keyIssue: true,
    writer: 'Gerry Conway', artist: 'Ross Andru', coverArtist: 'Gil Kane / John Romita Sr.', inker: 'Frank Giacoia / Dave Hunt', colorist: 'Dave Hunt', letterer: 'Artie Simek', editor: 'Roy Thomas', publicationDate: 'Feb 1, 1974', coverPrice: '$0.20', pageCount: 32,
    prices: { poor: 120, good: 400, fine: 1200, vf: 3000, nm: 5000, cgc_9_8: 45000 } },
  { db_id: 'asm-121', title: 'The Amazing Spider-Man #121', publisher: 'Marvel', year: 1973, significance: 'Death of Gwen Stacy', creators: 'Gerry Conway / Gil Kane', rarity: 'Very Rare', coverColor: '#0D47A1', issueNum: '#121', keyIssue: true,
    writer: 'Gerry Conway', artist: 'Gil Kane', coverArtist: 'John Romita Sr.', inker: 'John Romita Sr. / Tony Mortellaro', colorist: 'Dave Hunt', letterer: 'Artie Simek', editor: 'Roy Thomas', publicationDate: 'Jun 1, 1973', coverPrice: '$0.20', pageCount: 32,
    prices: { poor: 100, good: 300, fine: 900, vf: 2500, nm: 4000, cgc_9_8: 38000 } },
  { db_id: 'wbn-32', title: 'Werewolf by Night #32', publisher: 'Marvel', year: 1975, significance: '1st Moon Knight', creators: 'Doug Moench / Don Perlin', rarity: 'Very Rare', coverColor: '#1A237E', issueNum: '#32', keyIssue: true,
    writer: 'Doug Moench', artist: 'Don Perlin', coverArtist: 'Gil Kane', inker: 'Howie Perlin', colorist: 'Phil Rachelson', letterer: 'Ray Holloway', editor: 'Marv Wolfman', publicationDate: 'Aug 1, 1975', coverPrice: '$0.25', pageCount: 32,
    prices: { poor: 120, good: 400, fine: 1500, vf: 4000, nm: 6000, cgc_9_8: 55000 } },
  { db_id: 'hfh-1', title: 'Hero for Hire #1', publisher: 'Marvel', year: 1972, significance: '1st Luke Cage', creators: 'Archie Goodwin / George Tuska', rarity: 'Very Rare', coverColor: '#F9A825', issueNum: '#1', keyIssue: true,
    writer: 'Archie Goodwin', artist: 'George Tuska', coverArtist: 'John Romita Sr.', inker: 'Billy Graham', colorist: 'Stan Goldberg', letterer: 'Skip Kohloff', editor: 'Stan Lee', publicationDate: 'Jun 1, 1972', coverPrice: '$0.20', pageCount: 36,
    prices: { poor: 60, good: 250, fine: 800, vf: 2000, nm: 3500, cgc_9_8: 40000 } },
  { db_id: 'gl-76', title: 'Green Lantern #76', publisher: 'DC', year: 1970, significance: 'GL/GA begins — Neal Adams', creators: "Denny O'Neil / Neal Adams", rarity: 'Very Rare', coverColor: '#00695C', issueNum: '#76', keyIssue: true,
    writer: "Denny O'Neil", artist: 'Neal Adams', coverArtist: 'Neal Adams', inker: 'Frank Giacoia', colorist: 'Cory Adams', letterer: 'John Costanza', editor: 'Julius Schwartz', publicationDate: 'Apr 1, 1970', coverPrice: '$0.15', pageCount: 36,
    prices: { poor: 80, good: 300, fine: 1000, vf: 3000, nm: 5000, cgc_9_8: 48000 } },
  { db_id: 'hos-92', title: 'House of Secrets #92', publisher: 'DC', year: 1971, significance: '1st Swamp Thing', creators: 'Len Wein / Bernie Wrightson', rarity: 'Very Rare', coverColor: '#33691E', issueNum: '#92', keyIssue: true,
    writer: 'Len Wein', artist: 'Bernie Wrightson', coverArtist: 'Bernie Wrightson', inker: 'Bernie Wrightson', colorist: 'Not credited', letterer: 'Ben Oda', editor: 'Joe Orlando', publicationDate: 'Jun 1, 1971', coverPrice: '$0.25', pageCount: 52, about: '52-page giant',
    prices: { poor: 100, good: 350, fine: 1200, vf: 3500, nm: 5500, cgc_9_8: 50000 } },
  { db_id: 'xmen-94', title: 'X-Men #94', publisher: 'Marvel', year: 1975, significance: 'New X-Men ongoing begins', creators: 'Chris Claremont / Dave Cockrum', rarity: 'Very Rare', coverColor: '#6A1B9A', issueNum: '#94', keyIssue: true,
    writer: 'Chris Claremont', artist: 'Dave Cockrum', coverArtist: 'Gil Kane / Dave Cockrum', inker: 'Bob McLeod', colorist: 'Phil Rachelson', letterer: 'Tom Orzechowski', editor: 'Marv Wolfman', publicationDate: 'Aug 1, 1975', coverPrice: '$0.25', pageCount: 32,
    prices: { poor: 60, good: 250, fine: 750, vf: 2000, nm: 3500, cgc_9_8: 35000 } },
  { db_id: 'tomb-10', title: 'Tomb of Dracula #10', publisher: 'Marvel', year: 1973, significance: '1st Blade', creators: 'Marv Wolfman / Gene Colan', rarity: 'Rare', coverColor: '#880E4F', issueNum: '#10', keyIssue: true,
    writer: 'Marv Wolfman', artist: 'Gene Colan', coverArtist: 'Gil Kane', inker: 'Jack Abel', colorist: 'Tom Palmer', letterer: 'John Costanza', editor: 'Roy Thomas', publicationDate: 'Jul 1, 1973', coverPrice: '$0.20', pageCount: 32,
    prices: { poor: 50, good: 200, fine: 700, vf: 1800, nm: 3000, cgc_9_8: 28000 } },
  { db_id: 'if-14', title: 'Iron Fist #14', publisher: 'Marvel', year: 1977, significance: '1st Sabretooth', creators: 'Chris Claremont / John Byrne', rarity: 'Rare', coverColor: '#FF6F00', issueNum: '#14', keyIssue: true,
    writer: 'Chris Claremont', artist: 'John Byrne', coverArtist: 'Dave Cockrum', inker: 'Dan Green', colorist: 'Bonnie Wilford', letterer: 'Joe Rosen', editor: 'Archie Goodwin', publicationDate: 'Aug 1, 1977', coverPrice: '$0.30', pageCount: 32,
    prices: { poor: 25, good: 100, fine: 350, vf: 800, nm: 1500, cgc_9_8: 18000 } },
];

// ── ANONYMOUS USERS ─────────────────────────────────────────────
export const ANON_USERS: VaultUser[] = [
  { id: 'u-4821', vaultId: 'Vault #4821', trustLevel: 2, metro: 'nyc-metro', transactions: 14, memberSince: '2025-06', publicCollections: 2 },
  { id: 'u-7733', vaultId: 'Vault #7733', trustLevel: 1, metro: 'la-metro', transactions: 3, memberSince: '2025-11', publicCollections: 1 },
  { id: 'u-2019', vaultId: 'Vault #2019', trustLevel: 2, metro: 'chicago', transactions: 22, memberSince: '2025-03', publicCollections: 3 },
  { id: 'u-9156', vaultId: 'Vault #9156', trustLevel: 1, metro: 'sf-bay', transactions: 6, memberSince: '2025-09', publicCollections: 1 },
  { id: 'u-3342', vaultId: 'Vault #3342', trustLevel: 2, metro: 'dallas', transactions: 31, memberSince: '2024-12', publicCollections: 4 },
  { id: 'u-6188', vaultId: 'Vault #6188', trustLevel: 1, metro: 'seattle', transactions: 1, memberSince: '2026-01', publicCollections: 1 },
];

// ── SEED LISTINGS ───────────────────────────────────────────────
export const SEED_LISTINGS: Listing[] = [
  { id: 'lst-1', sellerId: 'u-4821', dbId: 'hulk-180', condition: 'good', sellerNotes: 'Solid reader copy. MVS clipped. Ships insured.', listType: 'auction', startPrice: 150, buyNowPrice: 250, currentBid: 185, bidCount: 4,
    bidHistory: [{ user: 'Vault #8801', amount: 155, time: '2h ago' }, { user: 'Vault #3102', amount: 165, time: '1h ago' }, { user: 'Vault #8801', amount: 175, time: '45m ago' }, { user: 'Vault #5590', amount: 185, time: '12m ago' }], endsIn: '2d 14h', photo: null },
  { id: 'lst-2', sellerId: 'u-9156', dbId: 'wls-1', condition: 'nm', sellerNotes: 'Beautiful copy. White pages, tight spine.', listType: 'buy_now', startPrice: null, buyNowPrice: 140, currentBid: null, bidCount: 0, bidHistory: [], endsIn: '5d 8h', photo: null },
  { id: 'lst-3', sellerId: 'u-2019', dbId: 'asm-129', condition: 'vf', sellerNotes: 'Nice mid-grade. Light spine stress, colors pop.', listType: 'auction', startPrice: 2200, buyNowPrice: 3200, currentBid: 2650, bidCount: 7,
    bidHistory: [{ user: 'Vault #4103', amount: 2300, time: '1d ago' }, { user: 'Vault #7788', amount: 2400, time: '18h ago' }, { user: 'Vault #4103', amount: 2500, time: '8h ago' }, { user: 'Vault #1290', amount: 2550, time: '4h ago' }, { user: 'Vault #7788', amount: 2600, time: '2h ago' }, { user: 'Vault #4103', amount: 2625, time: '1h ago' }, { user: 'Vault #7788', amount: 2650, time: '30m ago' }], endsIn: '1d 3h', photo: null },
  { id: 'lst-4', sellerId: 'u-3342', dbId: 'tomb-10', condition: 'fine', sellerNotes: 'Presentable. Small crease bottom right.', listType: 'auction', startPrice: 500, buyNowPrice: 800, currentBid: 580, bidCount: 3,
    bidHistory: [{ user: 'Vault #6601', amount: 520, time: '6h ago' }, { user: 'Vault #2244', amount: 555, time: '3h ago' }, { user: 'Vault #6601', amount: 580, time: '1h ago' }], endsIn: '3d 20h', photo: null },
  { id: 'lst-5', sellerId: 'u-4821', dbId: 'if-14', condition: 'nm', sellerNotes: 'Sharp copy. 20 years in my vault.', listType: 'buy_now', startPrice: null, buyNowPrice: 1400, currentBid: null, bidCount: 0, bidHistory: [], endsIn: '6d 12h', photo: null },
  { id: 'lst-6', sellerId: 'u-2019', dbId: 'xmen-94', condition: 'fine', sellerNotes: 'Claremont run starts here. Nice affordable copy.', listType: 'auction', startPrice: 600, buyNowPrice: 850, currentBid: 640, bidCount: 2,
    bidHistory: [{ user: 'Vault #3102', amount: 615, time: '5h ago' }, { user: 'Vault #9901', amount: 640, time: '2h ago' }], endsIn: '4d 6h', photo: null },
  { id: 'lst-7', sellerId: 'u-6188', dbId: 'wbn-32', condition: 'good', sellerNotes: "Moon Knight's debut! Reader grade.", listType: 'auction', startPrice: 300, buyNowPrice: 480, currentBid: 345, bidCount: 3,
    bidHistory: [{ user: 'Vault #5590', amount: 310, time: '12h ago' }, { user: 'Vault #8801', amount: 330, time: '6h ago' }, { user: 'Vault #5590', amount: 345, time: '2h ago' }], endsIn: '2d 1h', photo: null },
  { id: 'lst-8', sellerId: 'u-7733', dbId: 'gl-76', condition: 'vf', sellerNotes: 'Neal Adams masterpiece. Vibrant color.', listType: 'auction', startPrice: 2500, buyNowPrice: 3500, currentBid: 2800, bidCount: 5,
    bidHistory: [{ user: 'Vault #4103', amount: 2550, time: '1d ago' }, { user: 'Vault #2244', amount: 2600, time: '12h ago' }, { user: 'Vault #4103', amount: 2700, time: '6h ago' }, { user: 'Vault #9901', amount: 2750, time: '3h ago' }, { user: 'Vault #4103', amount: 2800, time: '1h ago' }], endsIn: '3d 8h', photo: null },
];

// ── PUBLIC COLLECTIONS ──────────────────────────────────────────
export const PUBLIC_COLLECTIONS: PublicCollection[] = [
  { id: 'pc-1', ownerId: 'u-4821', name: 'Bronze Age Keys', itemCount: 8, totalValue: 22500, topItems: ['hulk-181', 'gsx-1', 'asm-121'] },
  { id: 'pc-2', ownerId: 'u-4821', name: 'Horror Keys', itemCount: 5, totalValue: 8900, topItems: ['tomb-10', 'wbn-32', 'hos-92'] },
  { id: 'pc-3', ownerId: 'u-2019', name: 'X-Men Complete Run', itemCount: 12, totalValue: 18400, topItems: ['gsx-1', 'xmen-94'] },
  { id: 'pc-4', ownerId: 'u-2019', name: 'First Appearances', itemCount: 15, totalValue: 34000, topItems: ['hulk-181', 'asm-129', 'if-14'] },
  { id: 'pc-5', ownerId: 'u-3342', name: 'Wolverine Everything', itemCount: 18, totalValue: 16800, topItems: ['hulk-181', 'hulk-180', 'wls-1'] },
  { id: 'pc-6', ownerId: 'u-9156', name: 'Bay Area Vault', itemCount: 6, totalValue: 4200, topItems: ['wls-1', 'if-14'] },
];

// ── SEED COLLECTIONS (your vault) ───────────────────────────────
export const SEED_COLLECTIONS: Collection[] = [
  {
    id: 'c-1', name: 'Wolverine Keys', privacy: 'private', collectibleType: 'comics', createdAt: '2026-01-15',
    description: 'Key Wolverine first appearances and limited series',
    members: [
      { vaultId: 'Vault #8847', role: 'owner', addedAt: '2026-01-15', addedBy: 'Vault #8847' },
    ],
    items: [
      { id: 'i-1', matchId: 'hulk-181', condition: 'fine', photo: null, userNotes: 'MVS intact, slight spine roll.', source: 'database', createdAt: '2026-01-15' },
      { id: 'i-2', matchId: 'wls-1', condition: 'nm', photo: null, userNotes: 'White pages, direct edition.', source: 'database', createdAt: '2026-01-16' },
      { id: 'i-3', matchId: 'wls-2', condition: 'nm', photo: null, userNotes: '', source: 'database', createdAt: '2026-01-16' },
      { id: 'i-4', matchId: 'wls-3', condition: 'vf', photo: null, userNotes: '', source: 'database', createdAt: '2026-01-16' },
      { id: 'i-5', matchId: 'wls-4', condition: 'nm', photo: null, userNotes: 'Clean copy', source: 'database', createdAt: '2026-01-16' },
    ],
  },
  {
    id: 'c-2', name: 'Bronze Age Grails', privacy: 'public', collectibleType: 'comics', createdAt: '2026-02-01',
    description: 'My best Bronze Age keys — shared with family',
    members: [
      { vaultId: 'Vault #8847', role: 'owner', addedAt: '2026-02-01', addedBy: 'Vault #8847' },
      { vaultId: 'Vault #4821', role: 'viewer', addedAt: '2026-02-10', addedBy: 'Vault #8847' },
      { vaultId: 'Vault #9156', role: 'editor', addedAt: '2026-02-15', addedBy: 'Vault #8847' },
    ],
    items: [
      { id: 'i-6', matchId: 'gsx-1', condition: 'vf', photo: null, userNotes: 'CGC candidate.', source: 'database', createdAt: '2026-02-01' },
      { id: 'i-7', matchId: 'asm-129', condition: 'fine', photo: null, userNotes: 'Newsstand.', source: 'database', createdAt: '2026-02-02' },
    ],
  },
  {
    id: 'c-3', name: 'Vintage Baseball Cards', privacy: 'private', collectibleType: 'cards', createdAt: '2026-02-10',
    members: [
      { vaultId: 'Vault #8847', role: 'owner', addedAt: '2026-02-10', addedBy: 'Vault #8847' },
    ],
    items: [
      { id: 'i-8', matchId: null, condition: 'nm', photo: null, userNotes: 'PSA submission pending', source: 'manual', createdAt: '2026-02-10',
        customData: { title: 'Ken Griffey Jr. 1989 Upper Deck #1', publisher: 'Upper Deck', year: 1989, significance: 'Iconic rookie card', rarity: 'Rare', creators: '', estimatedValue: 1500 } },
      { id: 'i-9', matchId: null, condition: 'good', photo: null, userNotes: '', source: 'manual', createdAt: '2026-02-11',
        customData: { title: 'Hank Aaron 1969 Topps #100', publisher: 'Topps', year: 1969, significance: 'Hammerin\u2019 Hank', rarity: 'Uncommon', creators: '', estimatedValue: 85 } },
    ],
  },
  {
    id: 'c-4', name: 'Sneaker Rotation', privacy: 'public', collectibleType: 'shoes', createdAt: '2026-02-15',
    members: [
      { vaultId: 'Vault #8847', role: 'owner', addedAt: '2026-02-15', addedBy: 'Vault #8847' },
      { vaultId: 'Vault #7733', role: 'viewer', addedAt: '2026-02-20', addedBy: 'Vault #8847' },
    ],
    items: [
      { id: 'i-10', matchId: null, condition: 'ds', photo: null, userNotes: 'Size 10.5, OG all', source: 'manual', createdAt: '2026-02-15',
        customData: { title: 'Jordan 1 Retro High OG "Chicago" 2015', publisher: 'Nike/Jordan', year: 2015, significance: 'Iconic colorway', rarity: 'Rare', creators: '', estimatedValue: 1800 } },
      { id: 'i-11', matchId: null, condition: 'vnds', photo: null, userNotes: 'Worn 2x, no box', source: 'manual', createdAt: '2026-02-16',
        customData: { title: 'Yeezy Boost 350 V2 "Zebra"', publisher: 'Adidas/Yeezy', year: 2017, significance: 'First Zebra release', rarity: 'Uncommon', creators: '', estimatedValue: 280 } },
    ],
  },
];

// ── HELPERS ──────────────────────────────────────────────────────
export function getItemPrice(item: CollectionItem): number {
  if (item.source === 'database' && item.matchId) {
    const entry = PRICING_DB.find(e => e.db_id === item.matchId);
    return entry?.prices[item.condition] ?? 0;
  }
  return item.customData?.estimatedValue ?? 0;
}

export function getCollectionValue(col: Collection): number {
  return col.items.reduce((sum, item) => sum + getItemPrice(item), 0);
}

export function fuzzyMatch(query: string, db: PricingEntry[] = PRICING_DB): PricingEntry[] {
  if (!query || query.length < 2) return [];
  const tokens = query.toLowerCase().replace(/[#\-]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return db
    .map(item => {
      const searchable = `${item.title} ${item.significance} ${item.creators} ${item.publisher} ${item.year}`.toLowerCase();
      let score = 0;
      tokens.forEach(t => {
        if (searchable.includes(t)) score += 10;
        if (item.title.toLowerCase().includes(t)) score += 20;
      });
      if (item.title.toLowerCase().includes(query.toLowerCase())) score += 50;
      return { ...item, _score: score };
    })
    .filter(r => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8);
}

export function getProximity(userMetro: string, sellerMetro: string): { label: string; color: string } {
  if (userMetro === sellerMetro) return { label: 'Local', color: '#4CAF50' };
  const um = METROS.find(m => m.id === userMetro);
  const sm = METROS.find(m => m.id === sellerMetro);
  if (um?.state === sm?.state) return { label: 'Same State', color: '#8BC34A' };
  if (um?.region === sm?.region) return { label: sm?.region ?? '', color: '#FFC107' };
  return { label: sm?.region ?? 'Other', color: '#FF9800' };
}

// ── PRICE TREND DATA (simulated historical) ────────────────────
export interface PricePoint {
  date: string;   // YYYY-MM
  value: number;
}

export interface PriceTrend {
  low: PricePoint[];
  mid: PricePoint[];
  high: PricePoint[];
}

// Time range options for price charts
export type TimeRange = '1m' | '6m' | '1y' | '5y' | 'all';
export const TIME_RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: '1m', label: '1M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: '5y', label: '5Y' },
  { id: 'all', label: 'ALL' },
];

// Generate simulated trend data — full history back to publication year
export function generatePriceTrend(entry: PricingEntry): PriceTrend {
  const pubYear = entry.year;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Generate monthly data points from publication year to now
  // Early decades are sparse (yearly), recent years are monthly
  const months: string[] = [];
  for (let y = pubYear; y <= currentYear; y++) {
    if (y < pubYear + 5) {
      // First 5 years: one point per year (Jan)
      months.push(`${y}-01`);
    } else if (y < 2000) {
      // Pre-2000: quarterly
      for (const m of [1, 4, 7, 10]) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    } else if (y < 2020) {
      // 2000-2019: bi-monthly
      for (let m = 1; m <= 12; m += 2) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    } else {
      // 2020+: monthly
      const endMonth = y === currentYear ? currentMonth : 12;
      for (let m = 1; m <= endMonth; m++) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    }
  }

  const base = { low: entry.prices.good, mid: entry.prices.nm, high: entry.prices.cgc_9_8 };
  const total = months.length;

  // Simulate price growth: comics start cheap, grow over decades with market waves
  const jitter = (currentVal: number, i: number, seed: number) => {
    const progress = i / total; // 0 to 1 over full timeline
    // Exponential growth curve — items worth little early, more later
    const growthCurve = Math.pow(progress, 1.8);
    // Market waves (booms/busts)
    const wave1 = Math.sin((i + seed) * 0.15) * 0.06; // slow cycle
    const wave2 = Math.sin((i + seed * 2) * 0.5) * 0.03; // fast cycle
    // Speculator boom in early 90s, crash, then modern recovery
    const yearIdx = pubYear + Math.floor(progress * (currentVal > 5000 ? 50 : 40));
    const nineties = yearIdx >= 1990 && yearIdx <= 1996 ? 0.15 : 0;
    const crash = yearIdx >= 1997 && yearIdx <= 2002 ? -0.1 : 0;
    const covid = yearIdx >= 2020 && yearIdx <= 2022 ? 0.12 : 0;
    // Base price is a fraction of current value early, full value now
    const basePrice = currentVal * (0.02 + growthCurve * 0.98);
    const noise = wave1 + wave2 + nineties + crash + covid;
    // Deterministic seed-based variation (avoid Math.random for consistency)
    const pseudoRand = Math.sin(i * 127.1 + seed * 311.7) * 0.02;
    return Math.max(1, Math.round(basePrice * (1 + noise + pseudoRand)));
  };

  return {
    low: months.map((d, i) => ({ date: d, value: jitter(base.low, i, 1) })),
    mid: months.map((d, i) => ({ date: d, value: jitter(base.mid, i, 3) })),
    high: months.map((d, i) => ({ date: d, value: jitter(base.high, i, 5) })),
  };
}

// Filter trend data by time range
export function filterTrendByRange(trend: PriceTrend, range: TimeRange): PriceTrend {
  if (range === 'all') return trend;

  const now = new Date();
  let cutoff: Date;
  switch (range) {
    case '1m': cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1); break;
    case '6m': cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
    case '1y': cutoff = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
    case '5y': cutoff = new Date(now.getFullYear() - 5, now.getMonth(), 1); break;
    default: return trend;
  }

  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;
  const filterFn = (p: PricePoint) => p.date >= cutoffStr;

  return {
    low: trend.low.filter(filterFn),
    mid: trend.mid.filter(filterFn),
    high: trend.high.filter(filterFn),
  };
}

// ── ITEM HISTORY / NOTABLE EVENTS ───────────────────────────────
export interface HistoryEntry {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  date: string;
}

export const ITEM_HISTORY: Record<string, HistoryEntry[]> = {
  'hulk-181': [
    { id: 'h1', title: '1st Full Appearance of Wolverine', summary: 'Wolverine makes his first full appearance battling Hulk and Wendigo in the Canadian wilderness, after his last-page cameo in #180.', source: 'Marvel Database', sourceUrl: 'https://marvel.fandom.com/wiki/Incredible_Hulk_Vol_1_181', date: '1974-11' },
    { id: 'h2', title: 'CGC 9.9 Copy Sells for $360,000', summary: 'A CGC 9.9 copy sold at Heritage Auctions in October 2021 for $360,000, setting a record for this issue at the time.', source: 'Heritage Auctions', sourceUrl: 'https://comics.ha.com', date: '2021-10' },
    { id: 'h3', title: 'Wolverine MCU Debut Boosts Values', summary: 'After Hugh Jackman announced his return as Wolverine in Deadpool 3, demand for Hulk 181 surged with a 25% price increase across all grades.', source: 'GoCollect', sourceUrl: 'https://gocollect.com', date: '2022-09' },
    { id: 'h4', title: 'MVS (Marvel Value Stamp) Impact on Grading', summary: 'Copies with the Marvel Value Stamp intact (page 32) grade significantly higher. Missing MVS can drop a book by a full grade point equivalent in value.', source: 'CGC Comics', sourceUrl: 'https://www.cgccomics.com', date: '2020-01' },
    { id: 'h5', title: 'Deadpool & Wolverine Breaks Box Office', summary: 'The theatrical release pushed Bronze Age Wolverine keys to new highs, with Hulk 181 mid-grade copies seeing 15-20% increases in Q3 2024.', source: 'Key Collector Comics', sourceUrl: 'https://www.keycollectorcomics.com', date: '2024-07' },
  ],
  'gsx-1': [
    { id: 'h6', title: 'New X-Men Team Debut', summary: 'Introduced Storm, Colossus, Nightcrawler, and Thunderbird alongside the returning Wolverine and Banshee, launching the most successful run in X-Men history.', source: 'Marvel Database', sourceUrl: 'https://marvel.fandom.com/wiki/Giant-Size_X-Men_Vol_1_1', date: '1975-05' },
    { id: 'h7', title: 'CGC 9.8 Sells for $300,000', summary: 'A CGC 9.8 copy sold at Heritage Auctions, reflecting the sustained demand for high-grade copies of this landmark issue.', source: 'Heritage Auctions', sourceUrl: 'https://comics.ha.com', date: '2022-03' },
    { id: 'h8', title: 'X-Men 97 Animated Series Boost', summary: 'The Disney+ animated revival renewed interest in classic X-Men keys, with GSX #1 seeing steady appreciation throughout 2024.', source: 'GoCollect', sourceUrl: 'https://gocollect.com', date: '2024-03' },
  ],
  'asm-129': [
    { id: 'h9', title: '1st Appearance of The Punisher', summary: 'Frank Castle, aka The Punisher, makes his debut as an antagonist hired to eliminate Spider-Man, becoming one of Marvel\'s most popular anti-heroes.', source: 'Marvel Database', sourceUrl: 'https://marvel.fandom.com/wiki/Amazing_Spider-Man_Vol_1_129', date: '1974-02' },
    { id: 'h10', title: 'Netflix Punisher Series Impact', summary: 'Jon Bernthal\'s portrayal drove significant collector interest in Punisher first appearances, with ASM 129 climbing steadily.', source: 'Key Collector', sourceUrl: 'https://www.keycollectorcomics.com', date: '2017-11' },
    { id: 'h11', title: 'CGC Census Tops 10,000 Copies', summary: 'One of the most submitted Bronze Age books to CGC, reflecting both high demand and relatively available supply compared to other keys.', source: 'CGC Comics', sourceUrl: 'https://www.cgccomics.com', date: '2023-06' },
  ],
  'ms5': [
    { id: 'h12', title: '1st Appearance of Ghost Rider', summary: 'Johnny Blaze makes his deal with the devil and becomes the Ghost Rider, launching one of Marvel\'s most iconic horror characters.', source: 'Marvel Database', sourceUrl: 'https://marvel.fandom.com/wiki/Marvel_Spotlight_Vol_1_5', date: '1972-08' },
    { id: 'h13', title: 'Ghost Rider MCU Rumors Spike Prices', summary: 'Persistent rumors of a new MCU Ghost Rider project have kept this book trending upward, with CGC 9.8 copies approaching six figures.', source: 'GoCollect', sourceUrl: 'https://gocollect.com', date: '2025-01' },
  ],
  'wbn-32': [
    { id: 'h14', title: '1st Appearance of Moon Knight', summary: 'Marc Spector debuts as Moon Knight in a Werewolf by Night story, eventually spinning off into his own series.', source: 'Marvel Database', sourceUrl: 'https://marvel.fandom.com/wiki/Werewolf_by_Night_Vol_1_32', date: '1975-08' },
    { id: 'h15', title: 'Disney+ Moon Knight Series', summary: 'Oscar Isaac\'s portrayal of Moon Knight in the 2022 Disney+ series sent WBN 32 values soaring, with some grades doubling overnight.', source: 'Key Collector', sourceUrl: 'https://www.keycollectorcomics.com', date: '2022-03' },
  ],
};

// Provide default history for items without specific entries
export function getItemHistory(dbId: string): HistoryEntry[] {
  if (ITEM_HISTORY[dbId]) return ITEM_HISTORY[dbId];
  const entry = PRICING_DB.find(e => e.db_id === dbId);
  if (!entry) return [];
  return [
    { id: `auto-${dbId}`, title: entry.significance, summary: `${entry.title} (${entry.year}) by ${entry.creators}. Published by ${entry.publisher}. ${entry.rarity} rarity.`, source: 'Collector\'s Vault Database', sourceUrl: '', date: String(entry.year) },
  ];
}

// ── WANT LIST ──────────────────────────────────────────────────
export type WantPriority = 1 | 2 | 3 | 4 | 5;
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';

export interface WantListItem {
  id: string;
  dbId: string;                  // matches PRICING_DB.db_id
  title: string;                 // denormalized for display
  category: CollectibleType;
  minCondition: Condition;       // minimum condition acceptable
  maxPrice: number;              // max willing to pay
  priority: WantPriority;        // 1=nice to have, 5=must have
  notes: string;                 // specific details ("CGC only", "need blue label", etc.)
  createdAt: string;
}

export interface Offer {
  id: string;
  dbId: string;                  // which item
  fromVaultId: string;           // who's making the offer
  toVaultId: string;             // target vault owner
  listingId: string | null;      // if offer is on a listing
  condition: Condition;          // condition they want
  offerAmount: number;
  notes: string;
  status: OfferStatus;
  counterAmount: number | null;  // if countered
  createdAt: string;
}

export const PRIORITY_LABELS: Record<WantPriority, { label: string; color: string; icon: string }> = {
  1: { label: 'Casual', color: '#78909C', icon: 'flag' },
  2: { label: 'Interested', color: '#2196F3', icon: 'flag' },
  3: { label: 'Want', color: '#4CAF50', icon: 'flag' },
  4: { label: 'Need', color: '#FF9800', icon: 'priority-high' },
  5: { label: 'Must Have', color: '#E53935', icon: 'local-fire-department' },
};

export const CONDITION_RANK: Record<Condition, number> = {
  poor: 1, good: 2, fine: 3, vf: 4, nm: 5, cgc_9_8: 6,
};

// Seed want list items
export const SEED_WANT_LIST: WantListItem[] = [
  { id: 'w-1', dbId: 'hos-92', title: 'House of Secrets #92', category: 'comics', minCondition: 'good', maxPrice: 500, priority: 4, notes: 'Need for Swamp Thing collection. Any grade above Good.', createdAt: '2026-02-20' },
  { id: 'w-2', dbId: 'ms5', title: 'Marvel Spotlight #5', category: 'comics', minCondition: 'fine', maxPrice: 2500, priority: 5, notes: 'Ghost Rider key. CGC preferred but not required.', createdAt: '2026-02-25' },
  { id: 'w-3', dbId: 'hfh-1', title: 'Hero for Hire #1', category: 'comics', minCondition: 'vf', maxPrice: 2500, priority: 3, notes: 'Luke Cage first appearance.', createdAt: '2026-03-01' },
];

// Helper: find listings that match a want list item
export function getWantListMatches(want: WantListItem, listings: Listing[]): Listing[] {
  const minRank = CONDITION_RANK[want.minCondition];
  return listings.filter(l => {
    if (l.dbId !== want.dbId) return false;
    const condRank = CONDITION_RANK[l.condition] ?? 0;
    if (condRank < minRank) return false;
    const price = l.listType === 'auction'
      ? (l.currentBid || l.startPrice || 0)
      : (l.buyNowPrice || 0);
    if (price > want.maxPrice) return false;
    return true;
  });
}
