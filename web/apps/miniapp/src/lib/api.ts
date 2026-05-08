// API client for the Nintondo serverless endpoints.
// Uses relative paths (/api/roast) so the URL always resolves correctly
// regardless of how window.location.origin behaves inside Telegram's WebView.

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
    res = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Timed out — try again');
    }
    throw new Error('Network error — check connection and try again');
  }

  if (!res.ok) {
    // Grab the body text to surface the actual server error
    const text = await res.text().catch(() => '');
    throw new Error(`Server error ${res.status}${text ? ': ' + text : ''}`);
  }

  return res.json() as Promise<RoastResponse>;
}
