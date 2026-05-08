// POST /api/roast
// Body: { userId: number, username?: string, firstName?: string,
//         category?: string, avatarUrl?: string }
// Returns: { roast, stats, cardUrl }
//
// Edge Runtime — same as card.ts. The Web API (Request/Response) handler
// style only works correctly on Edge; Node.js runtime expects (req, res).
//
// In-memory anti-repetition resets on cold start — acceptable here.
// The Python bot's SQLite owns long-term anti-rep for chat-side roasts.

export const config = { runtime: 'edge' };

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
  // Fall back to full pool if every roast has been recently served
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const userId = typeof body.userId === 'number' ? body.userId : Number(body.userId);
  if (!Number.isFinite(userId)) {
    return json({ error: 'userId must be a number' }, 400);
  }

  const category = typeof body.category === 'string' ? body.category : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
  const username = typeof body.username === 'string' ? body.username : undefined;
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const roast = pickRoast(userId, category);
  recordServed(userId, roast.id);

  const name = firstName ?? username ?? 'anon';
  const resolvedText = roast.text.replace(/\{name\}/g, name);
  const stats = generateStats(userId);

  // Base URL from the request's own host — works in both prod and local vercel dev
  const host = request.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}`;

  const params = new URLSearchParams({
    u: String(userId),
    r: roast.id,
    n: name,
  });
  if (avatarUrl) params.set('a', avatarUrl);
  const cardUrl = `${baseUrl}/api/card?${params.toString()}`;

  return json({
    roast: { ...roast, text: resolvedText },
    stats,
    cardUrl,
  });
}
