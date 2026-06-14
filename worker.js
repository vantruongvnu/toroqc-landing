/* ============================================================
   TORO — Cloudflare Worker: form intake
   Deploy SEPARATELY from Pages (Workers free tier: 100k req/day).
   Then put the Worker URL into assets/main.js → TORO_ENDPOINT
   AND keep connect-src https://*.workers.dev in _headers (or
   swap it for your custom Worker domain).
   Docs: https://developers.cloudflare.com/workers/
   ============================================================ */

const ALLOWED_ORIGIN = 'https://toroqc.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export default {
  async fetch(request, env) {
    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }

    // ── Origin allow-list ──
    const origin = request.headers.get('Origin');
    if (origin !== ALLOWED_ORIGIN) {
      return json({ ok: false, error: 'Forbidden' }, 403);
    }

    // ── Parse + minimal server-side validation ──
    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const phoneOk = typeof data.owner_phone === 'string' && /^0[35789]\d{8}$/.test(data.owner_phone);
    if (!data.owner_name || !phoneOk || !data.shop_name) {
      return json({ ok: false, error: 'Missing or invalid fields' }, 422);
    }

    // ── Forward to your CRM / sheet / Lark via webhook ──
    // Set WEBHOOK_URL in the Workers dashboard (Settings → Variables).
    if (env.WEBHOOK_URL) {
      try {
        await fetch(env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner_name: String(data.owner_name).slice(0, 120),
            owner_phone: data.owner_phone,
            shop_name: String(data.shop_name).slice(0, 160),
            branch_count: data.branch_count || '',
            platform: data.platform || '',
            source: 'toroqc.com',
            received_at: new Date().toISOString(),
          }),
        });
      } catch (err) {
        // Don't fail the user if the downstream webhook hiccups; log + accept.
        console.error('webhook forward failed:', err);
      }
    }

    return json({ ok: true });
  },
};
