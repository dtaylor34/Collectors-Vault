import { type CollectibleType } from '../data';

// Category-specific prompts for Claude Vision
const PROMPTS: Record<CollectibleType, string> = {
  comics: `Identify this comic book cover. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Full Title #Issue","publisher":"","year":0,"significance":"key issue note or empty","creators":"Writer / Artist","condition_estimate":"poor"|"good"|"fine"|"vf"|"nm","condition_notes":"visible defects","rarity":"Common"|"Uncommon"|"Rare"|"Very Rare"|"Legendary","search_terms":"search keywords"}
If you cannot identify it, return {"identified":false,"reason":"explanation","search_terms":"best guess keywords"}.`,

  cards: `Identify this trading card. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Card Name","set":"Set Name","game":"Pokemon|Magic|Yu-Gi-Oh|Sports|Other","publisher":"","year":0,"rarity":"Common|Uncommon|Rare|Ultra Rare|Secret Rare","edition":"1st Edition|Unlimited|Shadowless|etc","condition_estimate":"nm"|"lp"|"mp"|"hp"|"damaged","condition_notes":"","search_terms":""}`,

  figures: `Identify this action figure or toy. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Figure Name","line":"Toy Line","manufacturer":"","year":0,"scale":"3.75in|6in|12in|etc","packaging":"loose|opened|mib|misb","condition_notes":"","search_terms":""}`,

  coins: `Identify this coin or currency. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Denomination Year Country","country":"","year":0,"denomination":"","mint_mark":"","metal":"","errors":"any errors or varieties","condition_estimate":"ag|g|f|xf|au|ms","condition_notes":"","search_terms":""}`,

  fashion: `Identify this fashion item. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Brand Model","brand":"","model":"","material":"","color":"","hardware":"gold|silver|etc","condition_estimate":"fair|good|very_good|excellent|nwt|nib","condition_notes":"","search_terms":""}`,

  shoes: `Identify these shoes/sneakers. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Brand Model Colorway","brand":"","model":"","colorway":"","year":0,"style_code":"if visible","condition_estimate":"beaters|used|vnds|ds","condition_notes":"","search_terms":""}`,

  jewelry: `Identify this jewelry or watch. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Brand Type","brand":"","type":"ring|watch|necklace|bracelet|earrings|brooch","material":"","stones":"","markings":"hallmarks or stamps","condition_estimate":"fair|good|very_good|excellent|new|certified","condition_notes":"","search_terms":""}`,

  vinyl: `Identify this vinyl record. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Artist - Album","artist":"","album":"","label":"","year":0,"format":"LP|45|12in|Box Set","pressing_info":"country, catalog number if visible","condition_estimate":"p|g|vg|vg_plus|nm|sealed","condition_notes":"cover and vinyl condition","search_terms":""}`,

  art: `Identify this artwork or print. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Artist - Title","artist":"","work_title":"","medium":"print|lithograph|screenprint|painting|photograph|poster","edition":"e.g. 45/200 or open edition","signed":true|false,"condition_notes":"","search_terms":""}`,

  other: `Identify this collectible item. Return ONLY valid JSON:
{"identified":true,"confidence":"high"|"medium"|"low","title":"Item Description","category":"best category guess","brand":"if applicable","year":0,"condition_notes":"","estimated_value_range":"$X-$Y or unknown","search_terms":""}`,
};

export interface IdentificationResult {
  identified: boolean;
  confidence?: 'high' | 'medium' | 'low';
  title?: string;
  [key: string]: any;
}

/**
 * Identify a collectible from a photo using Claude Vision.
 * This should be called via an Edge Function in production (API key server-side).
 * The direct call is for development/demo purposes.
 */
export async function identifyItem(
  base64Image: string,
  category: CollectibleType,
  options?: { edgeFunctionUrl?: string }
): Promise<IdentificationResult> {
  // Production: call edge function
  if (options?.edgeFunctionUrl) {
    const res = await fetch(options.edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, category }),
    });
    return res.json();
  }

  // Dev: direct API call (API key must be in env)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          { type: 'text', text: PROMPTS[category] },
        ],
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.map((c: any) => c.text || '').join('') || '';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
