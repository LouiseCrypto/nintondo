// GET /api/card?u=<userId>&r=<roastId>&n=<name>&a=<avatarUrl>
// Returns a 1080x1920 PNG roast card rendered by @vercel/og.
//
// Runs on Vercel Edge Runtime — globally distributed, cold start ~50ms.
// Cache-Control: public, max-age=86400 means Vercel's edge cache serves
// repeat requests for the same u+r+n+a combination for free.

import { ImageResponse } from '@vercel/og';
import React from 'react';
import roastsData from './_shared/roasts.json';
import { generateStats } from './_shared/stats.js';
import { CardTemplate, DEFAULT_AVATAR_URI } from './_shared/render.js';

export const config = { runtime: 'edge' };

// Fetch and convert a remote image to base64 data URI.
// @vercel/og can use https:// img src directly, but pre-fetching lets us
// gracefully fall back to the default avatar on any fetch error.
async function fetchAvatarDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return DEFAULT_AVATAR_URI;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') ?? 'image/jpeg';
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    return DEFAULT_AVATAR_URI;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get('u') ?? '0');
  const roastId = url.searchParams.get('r') ?? '';
  const name = url.searchParams.get('n') ?? 'anon';
  const avatarUrlParam = url.searchParams.get('a');

  // Look up the roast text from the pool
  interface RoastEntry { id: string; text: string; category: string; character_tag: string; weight: number }
  const roast = (roastsData.roasts as RoastEntry[]).find((r) => r.id === roastId);
  const roastText = roast
    ? roast.text.replace(/\{name\}/g, name)
    : 'the market already roasted you harder than anything I could say';

  const stats = generateStats(userId);

  const avatarSrc = avatarUrlParam
    ? await fetchAvatarDataUri(avatarUrlParam)
    : DEFAULT_AVATAR_URI;

  const image = new ImageResponse(
    React.createElement(CardTemplate, { name, roastText, stats, avatarSrc }),
    {
      width: 1080,
      height: 1920,
    },
  );

  // Stamp aggressive cache headers so Vercel's edge serves repeats instantly
  const response = new Response(image.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });

  return response;
}
