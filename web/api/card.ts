// GET /api/card?u=<userId>&r=<roastId>&n=<name>&a=<avatarUrl>
// Returns a 1080x1920 PNG roast card rendered by @vercel/og.
//
// Runs on Vercel Edge Runtime — globally distributed, cold start ~50ms.
// Cache-Control: public, max-age=86400 means Vercel's edge cache serves
// repeat requests for the same u+r+n+a combination for free.
//
// @vercel/og fetches remote image URLs natively in Edge Runtime, so we
// pass the avatar URL straight through rather than pre-fetching it here.
// No Node.js built-ins (Buffer, etc.) — Edge Runtime is Web APIs only.

import { ImageResponse } from '@vercel/og';
import React from 'react';
import roastsData from './_shared/roasts.json';
import { generateStats } from './_shared/stats.js';
import { CardTemplate, DEFAULT_AVATAR_URI } from './_shared/render.js';

export const config = { runtime: 'edge' };

interface RoastEntry {
  id: string;
  text: string;
  category: string;
  character_tag: string;
  weight: number;
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get('u') ?? '0');
  const roastId = url.searchParams.get('r') ?? '';
  const name = url.searchParams.get('n') ?? 'anon';
  const avatarUrlParam = url.searchParams.get('a');

  // Resolve roast text from the pool; fall back to a generic line if not found
  const roast = (roastsData.roasts as RoastEntry[]).find((r) => r.id === roastId);
  const roastText = roast
    ? roast.text.replace(/\{name\}/g, name)
    : 'the market already roasted you harder than anything I could say';

  const stats = generateStats(userId);

  // Use the avatar URL directly — @vercel/og fetches remote URLs internally.
  // Fall back to the embedded SVG data URI if no avatar was provided.
  const avatarSrc = avatarUrlParam ?? DEFAULT_AVATAR_URI;

  const image = new ImageResponse(
    React.createElement(CardTemplate, { name, roastText, stats, avatarSrc }),
    { width: 1080, height: 1920 },
  );

  return new Response(image.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
