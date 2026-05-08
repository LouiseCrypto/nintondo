// API client for the Nintondo serverless endpoints.
// The base URL is injected at build time via Vite's `define` so it resolves
// correctly in both local (`vercel dev`) and production environments.

declare const __API_BASE__: string;

const BASE = (__API_BASE__ || window.location.origin).replace(/\/$/, '');

const FETCH_TIMEOUT_MS = 12_000;

export interface Roast {
  id: string;
  text: string;
  category: string;
  character_tag: string;
}

export interface DegenStats {
  paperhandIndex: number;
  liquidationRisk: string;
  mentalState: string;
  lastBoughtTheTop: string;
  favoriteCope: string;
  netWorthDelta: string;
}

export interface RoastResponse {
  roast: Roast;
  stats: DegenStats;
  cardUrl: string;
}

export async function fetchRoast(params: {
  userId: number;
  firstName?: string;
  username?: string;
  avatarUrl?: string;
  category?: string;
}): Promise<RoastResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    // Surface a readable message for timeout vs network failure
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Request timed out — Vercel may be cold-starting, try again');
    }
    throw new Error('Network error — check your connection and try again');
  }

  if (!res.ok) {
    throw new Error(`Server error (${res.status}) — try again`);
  }

  return res.json() as Promise<RoastResponse>;
}
