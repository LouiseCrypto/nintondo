// POST /api/roast
// Body: { userId: number, username?: string, firstName?: string,
//         category?: string, avatarUrl?: string }
// Returns: { roast, stats, cardUrl }
//
// Node.js runtime (no edge config) — uses @vercel/node handler style
// which supports relative imports from _shared/ without restriction.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import roastsData from './_shared/roasts.json';
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
  const candidates = fresh.length > 0 ? fresh : pool;

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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = req.body as Record<string, unknown> ?? {};

  const userId = typeof body.userId === 'number' ? body.userId : Number(body.userId);
  if (!Number.isFinite(userId)) {
    res.status(400).json({ error: 'userId must be a number' });
    return;
  }

  const category  = typeof body.category  === 'string' ? body.category  : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
  const username  = typeof body.username  === 'string' ? body.username  : undefined;
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const roast = pickRoast(userId, category);
  recordServed(userId, roast.id);

  const name = firstName ?? username ?? 'anon';
  const resolvedText = roast.text.replace(/\{name\}/g, name);
  const stats = generateStats(userId);

  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}`;

  const params = new URLSearchParams({ u: String(userId), r: roast.id, n: name });
  if (avatarUrl) params.set('a', avatarUrl);

  res.status(200).json({
    roast: { ...roast, text: resolvedText },
    stats,
    cardUrl: `${baseUrl}/api/card?${params.toString()}`,
  });
}
