// POST /api/roast
// Body: { userId: number, username?: string, firstName?: string, category?: string }
// Returns: { roast, stats, cardUrl }
//
// In-memory anti-repetition resets on cold start — acceptable for this surface.
// The Python bot's SQLite owns long-term anti-rep for chat-side roasts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import roastsData from './_shared/roasts.json' assert { type: 'json' };
import { generateStats } from './_shared/stats.js';

interface Roast {
  id: string;
  text: string;
  category: string;
  character_tag: string;
  weight: number;
}

// In-memory LRU: userId -> last N roast IDs served
const recentlyServed = new Map<number, string[]>();
const MAX_RECENT = 20;

function pickRoast(userId: number, category?: string): Roast {
  let pool = roastsData.roasts as Roast[];

  if (category) {
    const filtered = pool.filter((r) => r.category === category);
    if (filtered.length > 0) pool = filtered;
  }

  const recent = recentlyServed.get(userId) ?? [];
  const fresh = pool.filter((r) => !recent.includes(r.id));
  // Fall back to full pool if every roast has been served recently
  const candidates = fresh.length > 0 ? fresh : pool;

  // Weighted random pick
  const totalWeight = candidates.reduce((s, r) => s + r.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const roast of candidates) {
    cursor -= roast.weight;
    if (cursor <= 0) return roast;
  }
  return candidates[candidates.length - 1];
}

function recordServed(userId: number, roastId: string): void {
  const recent = recentlyServed.get(userId) ?? [];
  recentlyServed.set(userId, [roastId, ...recent].slice(0, MAX_RECENT));
}

function resolveName(body: { firstName?: string; username?: string }): string {
  return body.firstName ?? body.username ?? 'anon';
}

function buildCardUrl(
  baseUrl: string,
  userId: number,
  roastId: string,
  name: string,
  avatarUrl?: string,
): string {
  const params = new URLSearchParams({
    u: String(userId),
    r: roastId,
    n: name,
  });
  if (avatarUrl) params.set('a', avatarUrl);
  return `${baseUrl}/api/card?${params.toString()}`;
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = req.body as {
    userId?: unknown;
    username?: unknown;
    firstName?: unknown;
    category?: unknown;
    avatarUrl?: unknown;
  };

  const userId = typeof body.userId === 'number' ? body.userId : Number(body.userId);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ error: 'userId must be a number' });
    return;
  }

  const category = typeof body.category === 'string' ? body.category : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
  const username = typeof body.username === 'string' ? body.username : undefined;
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const roast = pickRoast(userId, category);
  recordServed(userId, roast.id);

  const name = resolveName({ firstName, username });
  const resolvedText = roast.text.replace(/\{name\}/g, name);

  const stats = generateStats(userId);

  // Construct the card URL — base comes from env, falls back to Vercel's own URL
  const rawBase = process.env.PUBLIC_API_BASE ?? `https://${req.headers.host}`;
  const baseUrl = rawBase.replace(/\/$/, '');

  const cardUrl = buildCardUrl(baseUrl, userId, roast.id, name, avatarUrl);

  res.status(200).json({
    roast: { ...roast, text: resolvedText },
    stats,
    cardUrl,
  });
}
