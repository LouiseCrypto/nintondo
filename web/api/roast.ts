// POST /api/roast — Node.js runtime, fully self-contained (no relative imports).
// Vercel's esbuild bundler cannot resolve _shared/ at runtime, so everything
// is inlined here. Replace ROASTS with your full 420+ pool when ready.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Roast pool ────────────────────────────────────────────────────────────

interface Roast {
  id: string; text: string; category: string; character_tag: string; weight: number;
}

const ROASTS: Roast[] = [
  { id: 'r001', text: 'welcome to the degen asylum, {name} — check your wallet at the door', category: 'welcome', character_tag: 'general', weight: 1 },
  { id: 'r002', text: 'mario saw you join and immediately went back to snorting mushroom dust, {name}', category: 'welcome', character_tag: 'mario', weight: 1 },
  { id: 'r003', text: 'pikachu shorted you the second you walked in, {name} — and he\'s already in profit', category: 'welcome', character_tag: 'pikachu', weight: 1 },
  { id: 'r004', text: 'DK called it — {name} joins exactly when the chart looks worst', category: 'welcome', character_tag: 'dk', weight: 1 },
  { id: 'r005', text: 'peach saw your portfolio and quietly left the room, {name}', category: 'welcome', character_tag: 'peach', weight: 1 },
  { id: 'r006', text: 'luigi was about to roast you, {name}, but he\'s too busy crying about his own bags', category: 'welcome', character_tag: 'luigi', weight: 1 },
  { id: 'r007', text: 'bowser sent {name} a welcome gift — a copy of \'How to Lose Money in 30 Days\'', category: 'welcome', character_tag: 'bowser', weight: 1 },
  { id: 'r008', text: 'yoshi ate your entry price, {name} — it wasn\'t worth digesting', category: 'welcome', character_tag: 'yoshi', weight: 1 },
  { id: 'r009', text: 'link checked the ancient scrolls for {name}\'s financial future. the scrolls just said \'lol\'', category: 'welcome', character_tag: 'link', weight: 1 },
  { id: 'r010', text: 'the red flag count for {name} is already above the candle wick', category: 'welcome', character_tag: 'general', weight: 1 },
  { id: 'r011', text: 'oh great, another one — {name} has arrived to help us all feel better about our decisions', category: 'welcome', character_tag: 'general', weight: 1 },
  { id: 'r012', text: 'mario paused mid-snort to say \'{name} is built different\' — he says that about everyone', category: 'welcome', character_tag: 'mario', weight: 1 },
  { id: 'r013', text: 'mate, you really replied to me — {name} out here testing fate with both hands', category: 'reply', character_tag: 'general', weight: 1 },
  { id: 'r014', text: 'mario looked at your reply, {name}, and went back to counting imaginary coins', category: 'reply', character_tag: 'mario', weight: 1 },
  { id: 'r015', text: 'pikachu watched you type that, {name}, and discharged 50,000 volts of secondhand embarrassment', category: 'reply', character_tag: 'pikachu', weight: 1 },
  { id: 'r016', text: 'DK benched 300kg this morning. your reply still weighs less than his IQ, {name}', category: 'reply', character_tag: 'dk', weight: 1 },
  { id: 'r017', text: 'peach read that, {name}, sighed, and updated her \'people to avoid\' spreadsheet', category: 'reply', character_tag: 'peach', weight: 1 },
  { id: 'r018', text: 'luigi facepalmed so hard he knocked over his own sadness jar, {name}', category: 'reply', character_tag: 'luigi', weight: 1 },
  { id: 'r019', text: 'bowser had you flagged for \'terminally online\' behaviour, {name}', category: 'reply', character_tag: 'bowser', weight: 1 },
  { id: 'r020', text: 'yoshi swallowed your take whole, {name}, then immediately spat it back out', category: 'reply', character_tag: 'yoshi', weight: 1 },
  { id: 'r021', text: 'link pulled the master sword just to cut through the nonsense you just typed, {name}', category: 'reply', character_tag: 'link', weight: 1 },
  { id: 'r022', text: 'not a single braincell was harmed typing that because there were none involved, {name}', category: 'reply', character_tag: 'general', weight: 1 },
  { id: 'r023', text: 'the audacity of {name} to reply to me like I haven\'t seen their chart', category: 'reply', character_tag: 'general', weight: 1 },
  { id: 'r024', text: 'mario paused mid-snort to say \'{name} is cooked\' — that\'s a certified fact now', category: 'reply', character_tag: 'mario', weight: 1 },
  { id: 'r025', text: '{name} got caught buying the absolute peak — mario\'s still pointing and laughing', category: 'targeted', character_tag: 'mario', weight: 1 },
  { id: 'r026', text: 'pikachu\'s leverage is lower than {name}\'s chances of breaking even this cycle', category: 'targeted', character_tag: 'pikachu', weight: 1 },
  { id: 'r027', text: 'DK hasn\'t lost this badly at anything since {name} started \'trading\'', category: 'targeted', character_tag: 'dk', weight: 1 },
  { id: 'r028', text: 'peach blocked {name} after seeing the portfolio — even she has standards', category: 'targeted', character_tag: 'peach', weight: 1 },
  { id: 'r029', text: 'luigi cried seeing {name}\'s PnL — and luigi cries at everything', category: 'targeted', character_tag: 'luigi', weight: 1 },
  { id: 'r030', text: '{name} is so bearish they\'re actually bullish on failure — bowser is impressed', category: 'targeted', character_tag: 'bowser', weight: 1 },
  { id: 'r031', text: 'even yoshi won\'t give {name} a ride after what they did to their stop-loss', category: 'targeted', character_tag: 'yoshi', weight: 1 },
  { id: 'r032', text: 'link completed every dungeon in hyrule faster than {name} broke even once', category: 'targeted', character_tag: 'link', weight: 1 },
  { id: 'r033', text: 'still holding bags from the last cycle, {name}? genuinely impressive dedication to suffering', category: 'universal', character_tag: 'general', weight: 1 },
  { id: 'r034', text: 'your entry price is a war crime, {name} — someone call the financial authorities', category: 'universal', character_tag: 'general', weight: 1 },
  { id: 'r035', text: 'the chart went up just to dump on {name} specifically — it\'s personal', category: 'universal', character_tag: 'general', weight: 1 },
  { id: 'r036', text: '{name}\'s trading strategy: buy high, panic sell low, blame market manipulation', category: 'universal', character_tag: 'general', weight: 1 },
  { id: 'r037', text: 'mario reviewed {name}\'s wallet and called it \'a cry for help rendered in transactions\'', category: 'universal', character_tag: 'mario', weight: 1 },
  { id: 'r038', text: 'pikachu\'s entire net worth is still more than {name}\'s unrealised gains', category: 'universal', character_tag: 'pikachu', weight: 1 },
  { id: 'r039', text: 'DK\'s banana hoard has outperformed {name}\'s portfolio by 4,700% YTD', category: 'universal', character_tag: 'dk', weight: 1 },
  { id: 'r040', text: '{name}: certified proof that financial literacy should be a prerequisite for crypto access', category: 'universal', character_tag: 'general', weight: 1 },
];

// ── Stats generator (mulberry32 PRNG, weekly rotation) ────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function biasHigh(rand: number, bias = 2.5): number {
  return 1 - Math.pow(1 - rand, bias);
}

const LIQ_RISKS  = ['TERMINAL','CRITICAL','SEVERE','DIRE','CATASTROPHIC','EXTREME','MODERATE','ELEVATED'];
const MENTAL     = ['COPING','DELUSIONAL','ROPING','DISSOCIATING','PRAYING','BLAMING WHALES','CONSIDERING THERAPY','SURPRISINGLY OKAY'];
const TOP_TIMES  = ['yesterday','2 days ago','3 days ago','last week','2 weeks ago','last month','3 months ago','6 months ago','during the last bull run','when Mario said it was "guaranteed"','right before the SEC announcement','the exact moment it peaked','when Pikachu posted a chart'];
const COPES      = ['"it\'s a long-term hold"','"wagmi"','"zoom out"','"ngmi but at least I\'m early"','"this is the accumulation zone"','"the whales are suppressing it"','"I don\'t sell, I DCA"','"down 90% is just up 1000% inverted"','"my cost basis is basically zero"','"the fundamentals haven\'t changed"','"I\'m holding through the noise"','"not your keys not your coins"','"just gotta wait for the next cycle"','"everyone who sold is ngmi"','"this is actually bullish"','"the chart pattern is still intact"','"my influencer said buy more"','"tax loss harvesting bro"','"bear markets build character"','"I\'m in the pain zone, diamond hands"','"smart money is accumulating"','"this is a normal retrace"','"I only invest what I can afford to lose" (narrator: he could not)','"checking the chart every 30 seconds"','"hodl is a strategy not a cope"','"the team is still building"','"just need one more green week"','"already mentally spent the gains"','"my therapist doesn\'t understand charts"','"technically not a loss if I don\'t sell"'];
const DELTAS     = ['-73% YTD','-87% YTD','-91% YTD','-64% YTD','-99.2% from ATH','-82% since "going all in"','-68% this cycle','+0.3% (gas fees not included)','-55% and "still bullish"','-100% (margin call, RIP)'];

function generateStats(userId: number) {
  const seed = (((userId * 2654435761) >>> 0) + isoWeek(new Date()) * 1234567891) >>> 0;
  const rand = mulberry32(seed);
  return {
    paperhandIndex:  Math.round(biasHigh(rand()) * 100),
    liquidationRisk: LIQ_RISKS[Math.min(Math.floor(biasHigh(rand(), 3) * LIQ_RISKS.length), LIQ_RISKS.length - 1)],
    mentalState:     MENTAL[Math.min(Math.floor(biasHigh(rand(), 3) * MENTAL.length), MENTAL.length - 1)],
    lastBoughtTheTop: TOP_TIMES[Math.floor(rand() * TOP_TIMES.length)],
    favoriteCope:    COPES[Math.floor(rand() * COPES.length)],
    netWorthDelta:   DELTAS[Math.min(Math.floor(biasHigh(rand(), 2) * DELTAS.length), DELTAS.length - 1)],
  };
}

// ── Anti-repetition (in-memory LRU, resets on cold start) ────────────────

const recentlyServed = new Map<number, string[]>();

function pickRoast(userId: number, category?: string): Roast {
  let pool = category ? ROASTS.filter(r => r.category === category) : ROASTS;
  if (pool.length === 0) pool = ROASTS;
  const recent = recentlyServed.get(userId) ?? [];
  const fresh = pool.filter(r => !recent.includes(r.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const total = candidates.reduce((s, r) => s + r.weight, 0);
  let cursor = Math.random() * total;
  for (const r of candidates) { cursor -= r.weight; if (cursor <= 0) return r; }
  return candidates[candidates.length - 1];
}

function recordServed(userId: number, roastId: string): void {
  const recent = recentlyServed.get(userId) ?? [];
  recentlyServed.set(userId, [roastId, ...recent].slice(0, 20));
}

// ── Handler ───────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const userId   = typeof body.userId   === 'number' ? body.userId   : Number(body.userId ?? 0);
  const category = typeof body.category === 'string' ? body.category : undefined;
  const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
  const username  = typeof body.username  === 'string' ? body.username  : undefined;
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;

  const roast = pickRoast(isFinite(userId) ? userId : 0, category);
  recordServed(userId, roast.id);

  const name = firstName ?? username ?? 'anon';
  const resolvedText = roast.text.replace(/\{name\}/g, name);
  const stats = generateStats(isFinite(userId) ? userId : 0);

  const host = (Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host) ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const params = new URLSearchParams({ u: String(userId), r: roast.id, n: name });
  if (avatarUrl) params.set('a', avatarUrl);

  res.status(200).json({
    roast: { ...roast, text: resolvedText },
    stats,
    cardUrl: `${proto}://${host}/api/card?${params}`,
  });
}
