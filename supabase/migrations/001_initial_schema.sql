-- ═══════════════════════════════════════════════════════════════
-- The Collector's Vault — Initial Schema Migration
-- Supabase PostgreSQL with Row-Level Security
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- ── ENUMS ───────────────────────────────────────────────────────
CREATE TYPE trust_level AS ENUM ('0', '1', '2', '3');
CREATE TYPE privacy_setting AS ENUM ('private', 'public');
CREATE TYPE list_type AS ENUM ('auction', 'buy_now');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired', 'cancelled');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE item_source AS ENUM ('database', 'manual', 'ai_identified');
CREATE TYPE collectible_type AS ENUM (
  'comics', 'cards', 'figures', 'coins',
  'fashion', 'shoes', 'jewelry', 'vinyl', 'art', 'other'
);

-- ── METRO AREAS ─────────────────────────────────────────────────
CREATE TABLE metro_areas (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  state TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6)
);

INSERT INTO metro_areas (id, label, state, region, latitude, longitude) VALUES
  ('sf-bay',   'SF Bay Area',      'CA', 'West',      37.7749, -122.4194),
  ('la-metro', 'Los Angeles Metro', 'CA', 'West',      34.0522, -118.2437),
  ('nyc-metro','NYC Metro',         'NY', 'Northeast', 40.7128, -74.0060),
  ('chicago',  'Chicago Metro',     'IL', 'Midwest',   41.8781, -87.6298),
  ('dallas',   'Dallas-Fort Worth', 'TX', 'South',     32.7767, -96.7970),
  ('seattle',  'Seattle Metro',     'WA', 'West',      47.6062, -122.3321),
  ('miami',    'Miami-Dade',        'FL', 'South',     25.7617, -80.1918),
  ('denver',   'Denver Metro',      'CO', 'West',      39.7392, -104.9903),
  ('atlanta',  'Atlanta Metro',     'GA', 'South',     33.7490, -84.3880),
  ('phoenix',  'Phoenix Metro',     'AZ', 'West',      33.4484, -112.0740),
  ('boston',    'Boston Metro',      'MA', 'Northeast', 42.3601, -71.0589),
  ('portland', 'Portland Metro',    'OR', 'West',      45.5152, -122.6784),
  ('houston',  'Houston Metro',     'TX', 'South',     29.7604, -95.3698),
  ('philly',   'Philadelphia Metro','PA', 'Northeast', 39.9526, -75.1652),
  ('dc-metro', 'DC Metro',          'DC', 'South',     38.9072, -77.0369),
  ('detroit',  'Detroit Metro',     'MI', 'Midwest',   42.3314, -83.0458),
  ('minneapolis','Minneapolis-St Paul','MN','Midwest', 44.9778, -93.2650),
  ('tampa',    'Tampa Bay',         'FL', 'South',     27.9506, -82.4572),
  ('san-diego','San Diego',         'CA', 'West',      32.7157, -117.1611),
  ('austin',   'Austin Metro',      'TX', 'South',     30.2672, -97.7431);

-- ── USERS ───────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  vault_id TEXT UNIQUE NOT NULL,
  vault_number INT UNIQUE NOT NULL,
  email_encrypted TEXT,
  display_name_encrypted TEXT,
  metro_id TEXT REFERENCES metro_areas(id),
  trust_level INT NOT NULL DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 3),
  transaction_count INT NOT NULL DEFAULT 0,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate vault ID
CREATE SEQUENCE vault_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_vault_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vault_number IS NULL THEN
    NEW.vault_number := nextval('vault_number_seq');
  END IF;
  IF NEW.vault_id IS NULL THEN
    NEW.vault_id := 'Vault #' || NEW.vault_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vault_id BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION generate_vault_id();

-- ── COLLECTIONS ─────────────────────────────────────────────────
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  privacy privacy_setting NOT NULL DEFAULT 'private',
  collectible_type collectible_type NOT NULL DEFAULT 'comics',
  description TEXT,
  cover_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_privacy ON collections(privacy);

-- ── COLLECTION ITEMS ────────────────────────────────────────────
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  pricing_db_id TEXT,
  condition TEXT NOT NULL,
  photo_url TEXT,
  photo_thumbnail_url TEXT,
  user_notes TEXT DEFAULT '',
  ai_identification JSONB,
  source item_source NOT NULL DEFAULT 'manual',
  custom_data JSONB,
  purchase_price INT,
  purchase_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_collection ON collection_items(collection_id);
CREATE INDEX idx_items_pricing ON collection_items(pricing_db_id);

-- ── PRICING DATABASES (per category) ────────────────────────────
CREATE TABLE pricing_comics (
  db_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  year INT,
  significance TEXT,
  creators TEXT,
  rarity TEXT,
  prices JSONB NOT NULL,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comics_search ON pricing_comics USING GIN(search_vector);
CREATE INDEX idx_comics_trgm ON pricing_comics USING GIN(title gin_trgm_ops);

CREATE OR REPLACE FUNCTION update_comics_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.publisher, '') || ' ' ||
    COALESCE(NEW.significance, '') || ' ' ||
    COALESCE(NEW.creators, '') || ' ' ||
    COALESCE(NEW.year::TEXT, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comics_search BEFORE INSERT OR UPDATE ON pricing_comics
  FOR EACH ROW EXECUTE FUNCTION update_comics_search_vector();

-- Placeholder tables for future categories
CREATE TABLE pricing_cards (
  db_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  set_name TEXT,
  game TEXT NOT NULL,
  year INT,
  rarity TEXT,
  edition TEXT,
  prices JSONB NOT NULL,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_general (
  db_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category collectible_type NOT NULL,
  brand TEXT,
  year INT,
  description TEXT,
  prices JSONB NOT NULL,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LISTINGS (Auction Block) ────────────────────────────────────
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  item_id UUID REFERENCES collection_items(id),
  category collectible_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  condition TEXT NOT NULL,
  photo_url TEXT,
  list_type list_type NOT NULL,
  start_price INT,
  buy_now_price INT,
  current_bid INT,
  bid_count INT NOT NULL DEFAULT 0,
  status listing_status NOT NULL DEFAULT 'active',
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ends ON listings(ends_at);
CREATE INDEX idx_listings_category ON listings(category);

-- ── BIDS ────────────────────────────────────────────────────────
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id),
  amount INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- ── CONNECTIONS ─────────────────────────────────────────────────
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id),
  target_id UUID NOT NULL REFERENCES users(id),
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

-- ── TRANSACTIONS ────────────────────────────────────────────────
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  sale_price INT NOT NULL,
  platform_fee INT NOT NULL,
  stripe_payment_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── HELPER FUNCTIONS ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_collection_value(collection_uuid UUID)
RETURNS INT AS $$
DECLARE total INT;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN ci.pricing_db_id IS NOT NULL THEN
        COALESCE((pc.prices->>ci.condition)::INT, 0)
      ELSE
        COALESCE((ci.custom_data->>'estimatedValue')::INT, 0)
    END
  ), 0) INTO total
  FROM collection_items ci
  LEFT JOIN pricing_comics pc ON ci.pricing_db_id = pc.db_id
  WHERE ci.collection_id = collection_uuid;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_comics(query TEXT)
RETURNS SETOF pricing_comics AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM pricing_comics
    WHERE search_vector @@ plainto_tsquery('english', query)
       OR title % query
    ORDER BY
      ts_rank(search_vector, plainto_tsquery('english', query)) DESC,
      similarity(title, query) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_ts BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_collections_ts BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_items_ts BEFORE UPDATE ON collection_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_listings_ts BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_connections_ts BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users: can read own, can read others' vault_id/trust/metro
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid()::TEXT = firebase_uid);
CREATE POLICY "users_read_public" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::TEXT = firebase_uid);

-- Collections: owner full access, public readable
CREATE POLICY "collections_owner" ON collections FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);
CREATE POLICY "collections_public_read" ON collections FOR SELECT USING (privacy = 'public');

-- Items: owner full access, public collection items readable
CREATE POLICY "items_owner" ON collection_items FOR ALL USING (
  collection_id IN (
    SELECT id FROM collections WHERE user_id IN (
      SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT
    )
  )
);
CREATE POLICY "items_public_read" ON collection_items FOR SELECT USING (
  collection_id IN (SELECT id FROM collections WHERE privacy = 'public')
);

-- Listings: seller full access, active listings readable by all
CREATE POLICY "listings_seller" ON listings FOR ALL USING (
  seller_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);
CREATE POLICY "listings_public_read" ON listings FOR SELECT USING (status = 'active');

-- Bids: bidder can read own, listing seller can read all for their listings
CREATE POLICY "bids_own" ON bids FOR SELECT USING (
  bidder_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);
CREATE POLICY "bids_on_listings" ON bids FOR SELECT USING (
  listing_id IN (SELECT id FROM listings WHERE seller_id IN (
    SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT
  ))
);
CREATE POLICY "bids_insert" ON bids FOR INSERT WITH CHECK (
  bidder_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);

-- Connections: participants can read
CREATE POLICY "connections_participants" ON connections FOR SELECT USING (
  requester_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
  OR target_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);
CREATE POLICY "connections_insert" ON connections FOR INSERT WITH CHECK (
  requester_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);
CREATE POLICY "connections_update" ON connections FOR UPDATE USING (
  target_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);

-- Transactions: buyer or seller can read
CREATE POLICY "transactions_parties" ON transactions FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
  OR seller_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::TEXT)
);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Bronze Age Comics
-- ═══════════════════════════════════════════════════════════════

INSERT INTO pricing_comics (db_id, title, publisher, year, significance, creators, rarity, prices) VALUES
  ('hulk-181', 'The Incredible Hulk #181', 'Marvel', 1974, '1st full appearance of Wolverine', 'Len Wein / Herb Trimpe', 'Legendary', '{"poor":400,"good":1200,"fine":3500,"vf":7500,"nm":12000,"cgc_9_8":69000}'),
  ('hulk-180', 'The Incredible Hulk #180', 'Marvel', 1974, '1st cameo Wolverine (last page)', 'Len Wein / Herb Trimpe', 'Very Rare', '{"poor":80,"good":200,"fine":600,"vf":1500,"nm":2500,"cgc_9_8":25000}'),
  ('hulk-182', 'The Incredible Hulk #182', 'Marvel', 1974, '3rd Wolverine, Wendigo conclusion', 'Len Wein / Herb Trimpe', 'Rare', '{"poor":20,"good":60,"fine":150,"vf":350,"nm":600,"cgc_9_8":8000}'),
  ('wls-1', 'Wolverine Limited Series #1', 'Marvel', 1982, '1st solo Wolverine — Frank Miller', 'Chris Claremont / Frank Miller', 'Very Rare', '{"poor":10,"good":30,"fine":60,"vf":100,"nm":150,"cgc_9_8":850}'),
  ('wls-2', 'Wolverine Limited Series #2', 'Marvel', 1982, 'Wolverine vs The Hand', 'Chris Claremont / Frank Miller', 'Rare', '{"poor":5,"good":15,"fine":30,"vf":50,"nm":70,"cgc_9_8":500}'),
  ('wls-3', 'Wolverine Limited Series #3', 'Marvel', 1982, 'Logan poisoned, Lord Shingen', 'Chris Claremont / Frank Miller', 'Rare', '{"poor":4,"good":12,"fine":25,"vf":40,"nm":60,"cgc_9_8":450}'),
  ('wls-4', 'Wolverine Limited Series #4', 'Marvel', 1982, 'Finale — proposes to Mariko', 'Chris Claremont / Frank Miller', 'Rare', '{"poor":4,"good":12,"fine":25,"vf":40,"nm":60,"cgc_9_8":450}'),
  ('gsx-1', 'Giant-Size X-Men #1', 'Marvel', 1975, '1st Storm, Colossus, Nightcrawler', 'Len Wein / Dave Cockrum', 'Legendary', '{"poor":250,"good":800,"fine":2500,"vf":6000,"nm":10000,"cgc_9_8":60000}'),
  ('ms5', 'Marvel Spotlight #5', 'Marvel', 1972, '1st Ghost Rider', 'Gary Friedrich / Mike Ploog', 'Legendary', '{"poor":150,"good":500,"fine":1800,"vf":4500,"nm":8000,"cgc_9_8":90000}'),
  ('asm-129', 'The Amazing Spider-Man #129', 'Marvel', 1974, '1st Punisher', 'Gerry Conway / Ross Andru', 'Very Rare', '{"poor":120,"good":400,"fine":1200,"vf":3000,"nm":5000,"cgc_9_8":45000}'),
  ('asm-121', 'The Amazing Spider-Man #121', 'Marvel', 1973, 'Death of Gwen Stacy', 'Gerry Conway / Gil Kane', 'Very Rare', '{"poor":100,"good":300,"fine":900,"vf":2500,"nm":4000,"cgc_9_8":38000}'),
  ('wbn-32', 'Werewolf by Night #32', 'Marvel', 1975, '1st Moon Knight', 'Doug Moench / Don Perlin', 'Very Rare', '{"poor":120,"good":400,"fine":1500,"vf":4000,"nm":6000,"cgc_9_8":55000}'),
  ('hfh-1', 'Hero for Hire #1', 'Marvel', 1972, '1st Luke Cage', 'Archie Goodwin / George Tuska', 'Very Rare', '{"poor":60,"good":250,"fine":800,"vf":2000,"nm":3500,"cgc_9_8":40000}'),
  ('gl-76', 'Green Lantern #76', 'DC', 1970, 'GL/GA begins — Neal Adams', 'Denny O''Neil / Neal Adams', 'Very Rare', '{"poor":80,"good":300,"fine":1000,"vf":3000,"nm":5000,"cgc_9_8":48000}'),
  ('hos-92', 'House of Secrets #92', 'DC', 1971, '1st Swamp Thing', 'Len Wein / Bernie Wrightson', 'Very Rare', '{"poor":100,"good":350,"fine":1200,"vf":3500,"nm":5500,"cgc_9_8":50000}'),
  ('xmen-94', 'X-Men #94', 'Marvel', 1975, 'New X-Men ongoing begins', 'Chris Claremont / Dave Cockrum', 'Very Rare', '{"poor":60,"good":250,"fine":750,"vf":2000,"nm":3500,"cgc_9_8":35000}'),
  ('tomb-10', 'Tomb of Dracula #10', 'Marvel', 1973, '1st Blade', 'Marv Wolfman / Gene Colan', 'Rare', '{"poor":50,"good":200,"fine":700,"vf":1800,"nm":3000,"cgc_9_8":28000}'),
  ('if-14', 'Iron Fist #14', 'Marvel', 1977, '1st Sabretooth', 'Chris Claremont / John Byrne', 'Rare', '{"poor":25,"good":100,"fine":350,"vf":800,"nm":1500,"cgc_9_8":18000}');
