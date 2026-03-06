// supabase/functions/validate-bid/index.ts
// Server-side bid validation: min increment, no self-bidding, anti-sniping

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MIN_INCREMENT = 500; // $5.00 in cents
const ANTI_SNIPE_MINUTES = 5;
const ANTI_SNIPE_WINDOW_MINUTES = 2;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { listing_id, bidder_id, amount } = await req.json();

    // 1. Get listing
    const { data: listing, error: le } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (le || !listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), { status: 404 });
    }

    // 2. Check listing is active
    if (listing.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Listing is no longer active' }), { status: 400 });
    }

    // 3. Check not expired
    if (new Date(listing.ends_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Auction has ended' }), { status: 400 });
    }

    // 4. No self-bidding
    if (listing.seller_id === bidder_id) {
      return new Response(JSON.stringify({ error: 'Cannot bid on your own listing' }), { status: 400 });
    }

    // 5. Minimum bid check
    const minBid = (listing.current_bid || listing.start_price || 0) + MIN_INCREMENT;
    if (amount < minBid) {
      return new Response(JSON.stringify({ error: `Minimum bid is $${(minBid / 100).toFixed(2)}` }), { status: 400 });
    }

    // 6. Insert bid
    const { error: be } = await supabase.from('bids').insert({
      listing_id, bidder_id, amount,
    });
    if (be) throw be;

    // 7. Update listing
    const updates: any = {
      current_bid: amount,
      bid_count: listing.bid_count + 1,
    };

    // 8. Anti-sniping: extend if bid in last 2 minutes
    const endsAt = new Date(listing.ends_at);
    const now = new Date();
    const minutesLeft = (endsAt.getTime() - now.getTime()) / 60000;
    if (minutesLeft < ANTI_SNIPE_WINDOW_MINUTES) {
      updates.ends_at = new Date(endsAt.getTime() + ANTI_SNIPE_MINUTES * 60000).toISOString();
    }

    await supabase.from('listings').update(updates).eq('id', listing_id);

    return new Response(JSON.stringify({ success: true, new_bid: amount, ends_at: updates.ends_at || listing.ends_at }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Bid failed' }), { status: 500 });
  }
});
