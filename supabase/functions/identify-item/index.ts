/**
 * identify-item Edge Function
 * 
 * Haiku-first with Sonnet fallback for low-confidence results.
 * Rate limited: Free = 10/month, Pro = 100/month.
 * Response caching by image hash to reduce costs.
 *
 * Deploy: supabase functions deploy identify-item
 * Env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Tier limits
const LIMITS = { free: 3, pro: 100 };

const PROMPT = (category: string) =>
  `You are an expert collectibles appraiser. Identify this ${category} from the photo.
Return your TOP 3 guesses as a JSON array. No markdown, no backticks.
[{
  "rank": 1,
  "confidence": "high"|"medium"|"low",
  "title": "exact title with issue number",
  "publisher": "publisher",
  "year": 1968,
  "significance": "why it matters to collectors",
  "creators": "writer / artist",
  "writer": "writer name",
  "artist": "artist name",
  "cover_artist": "cover artist",
  "editor": "editor name",
  "cover_price": "$0.25",
  "page_count": 36,
  "condition_estimate": "poor"|"good"|"fine"|"vf"|"nm",
  "condition_notes": "observations from photo",
  "search_terms": "search string",
  "rarity": "Common"|"Uncommon"|"Rare"|"Very Rare"|"Legendary",
  "reasoning": "why you think this",
  "prices": {"poor":50,"good":200,"fine":800,"vf":2000,"nm":5000,"cgc_9_8":25000}
}]
Prices must be realistic USD market values. If unsure, estimate based on significance and rarity.`;

// Simple hash for caching
async function hashImage(base64: string): Promise<string> {
  const data = new TextEncoder().encode(base64.slice(0, 5000)); // Hash first 5KB
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { image, category = 'comics', userId } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Rate limiting ────────────────────────────────────────
    if (userId) {
      // Get user tier
      const { data: user } = await supabase
        .from('users')
        .select('is_pro')
        .eq('id', userId)
        .single();

      const isPro = user?.is_pro ?? false;
      const limit = isPro ? LIMITS.pro : LIMITS.free;

      // Count scans this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('scan_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if ((count ?? 0) >= limit) {
        return new Response(JSON.stringify({
          error: 'scan_limit_reached',
          message: isPro
            ? `You've used all ${LIMITS.pro} Pro scans this month. Resets on the 1st.`
            : `You've used your ${LIMITS.free} free scans this month. Upgrade to Pro for ${LIMITS.pro} scans — perfect for flea markets and conventions.`,
          used: count,
          limit,
          isPro,
        }), {
          status: 429, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Check cache ──────────────────────────────────────────
    const imgHash = await hashImage(image);
    const { data: cached } = await supabase
      .from('scan_cache')
      .select('result')
      .eq('image_hash', imgHash)
      .single();

    if (cached?.result) {
      // Log the scan (still counts toward limit) but no AI cost
      if (userId) {
        await supabase.from('scan_log').insert({
          user_id: userId, image_hash: imgHash, cached: true,
        });
      }
      return new Response(JSON.stringify({
        suggestions: cached.result,
        source: 'cache',
        model: 'cached',
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Call Haiku first (cheap) ─────────────────────────────
    const callAnthropic = async (model: string) => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: PROMPT(category) },
            ],
          }],
        }),
      });
      return res.json();
    };

    // Try Haiku first
    let data = await callAnthropic('claude-haiku-4-5-20251001');
    let model = 'haiku';
    let text = data.content?.filter((i: any) => i.type === 'text')?.map((i: any) => i.text || '').join('') || '';

    // Parse result
    let suggestions: any[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [JSON.parse(text.replace(/```json|```/g, '').trim())];
      if (!Array.isArray(suggestions)) suggestions = [suggestions];
    } catch {
      suggestions = [];
    }

    // If Haiku confidence is low, escalate to Sonnet
    const topConfidence = suggestions[0]?.confidence;
    if (topConfidence === 'low' || suggestions.length === 0) {
      data = await callAnthropic('claude-sonnet-4-20250514');
      model = 'sonnet';
      text = data.content?.filter((i: any) => i.type === 'text')?.map((i: any) => i.text || '').join('') || '';
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [JSON.parse(text.replace(/```json|```/g, '').trim())];
        if (!Array.isArray(suggestions)) suggestions = [suggestions];
      } catch {
        suggestions = [];
      }
    }

    // ── Cache the result ─────────────────────────────────────
    if (suggestions.length > 0) {
      await supabase.from('scan_cache').upsert({
        image_hash: imgHash,
        result: suggestions,
        model,
        created_at: new Date().toISOString(),
      });
    }

    // ── Log the scan ─────────────────────────────────────────
    if (userId) {
      await supabase.from('scan_log').insert({
        user_id: userId,
        image_hash: imgHash,
        model,
        cached: false,
        top_result: suggestions[0]?.title ?? null,
      });
    }

    return new Response(JSON.stringify({
      suggestions,
      source: 'ai',
      model,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'identification_failed',
      message: 'Could not process the image. Try again.',
    }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
