/**
 * GET /api/card?u=<userId>&r=<roastId>&n=<name>&a=<avatarUrl>
 * Returns a 1080×1920 PNG roast card.
 *
 * Runtime: Node.js — NOT Edge. Reasons:
 *   1. render.tsx uses fs.readFileSync to load fonts + character PNGs from disk.
 *      Edge Runtime has no `fs` module.
 *   2. Shared module imports (./_shared/*.ts, ./_shared/render.tsx) work in
 *      Node.js bundling. Vercel's Edge bundler silently fails on these.
 *   3. @vercel/og's bundled-asset pattern (font TTF + image PNGs) is explicitly
 *      designed for Node.js serverless — see Vercel's own OG examples.
 *
 * Cold-start cost is absorbed by:
 *   a) The Mini App's 1.8 s slot-machine animation before the card is revealed.
 *   b) Aggressive Cache-Control headers — Vercel edge + Telegram both cache.
 *
 * maxDuration and includeFiles are set in vercel.json → functions.
 */

import fs from 'fs';
import path from 'path';
import { renderRoastCard } from './_shared/render';

type RoastEntry = { id: string; text: string; category: string; character_tag: string; weight: number };

// Load roasts via fs — __dirname is always the compiled function's directory
const _roastsPath = path.join(__dirname, '_shared', 'roasts.json');
const _roastsData = JSON.parse(fs.readFileSync(_roastsPath, 'utf-8')) as { roasts: RoastEntry[] };

// Build a fast lookup map from all seeded roasts
const ROAST_MAP = new Map<string, RoastEntry>(
  _roastsData.roasts.map(r => [r.id, r]),
);

const FALLBACK_ROAST: RoastEntry = {
  id: 'r000',
  text: 'the market already roasted {name} harder than anything I could say',
  category: 'universal',
  character_tag: 'general',
  weight: 1,
};

// Tell Vercel to use Node.js runtime (not Edge) — required for fs + _shared imports
export const config = { runtime: 'nodejs' };

export default async function handler(request: Request): Promise<Response> {
  const url    = new URL(request.url);
  const userId = Number(url.searchParams.get('u') ?? '0');
  const roastId = url.searchParams.get('r') ?? '';
  const name   = url.searchParams.get('n') ?? 'anon';
  const avatarUrl = url.searchParams.get('a') ?? undefined;

  const roast = ROAST_MAP.get(roastId) ?? FALLBACK_ROAST;

  // Fetch avatar bytes with timeout — fail gracefully to default avatar
  let avatarBytes: Uint8Array | null = null;
  if (avatarUrl) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const resp  = await fetch(avatarUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (resp.ok) avatarBytes = new Uint8Array(await resp.arrayBuffer());
    } catch { /* use default avatar */ }
  }

  const image = await renderRoastCard({
    userId:      Number.isFinite(userId) ? userId : 0,
    username:    name,
    roast,
    avatarBytes,
  });

  // Pipe ImageResponse body into a plain Response with cache headers
  const buf = await image.arrayBuffer();
  return new Response(buf, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
