// Deterministic fake degen stats — same user gets the same stats each week,
// rotated every Monday so it stays "fresh" without anything actually being known.

export interface DegenStats {
  paperhandIndex: number;    // 0–100, skewed 70–99
  liquidationRisk: string;
  mentalState: string;
  lastBoughtTheTop: string;
  favoriteCope: string;
  netWorthDelta: string;
}

// mulberry32: fast, seedable PRNG good enough for deterministic comedy
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ISO week number — changes every Monday so stats rotate weekly
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Bias a 0–1 float toward the high end using a power curve
function biasHigh(rand: number, bias = 2.5): number {
  return 1 - Math.pow(1 - rand, bias);
}

const LIQUIDATION_RISKS = [
  "TERMINAL",
  "CRITICAL",
  "SEVERE",
  "DIRE",
  "CATASTROPHIC",
  "EXTREME",
  "MODERATE",   // rare
  "ELEVATED",   // very rare
];

const MENTAL_STATES = [
  "COPING",
  "DELUSIONAL",
  "ROPING",
  "DISSOCIATING",
  "PRAYING",
  "BLAMING WHALES",
  "CONSIDERING THERAPY",  // rare
  "SURPRISINGLY OKAY",    // very rare
];

const TOP_DURATIONS = [
  "yesterday",
  "2 days ago",
  "3 days ago",
  "last week",
  "2 weeks ago",
  "last month",
  "3 months ago",
  "6 months ago",
  "during the last bull run",
  "when Mario said it was 'guaranteed'",
  "right before the SEC announcement",
  "the exact moment it peaked",
  "when Pikachu posted a chart",
];

const COPES = [
  "\"it's a long-term hold\"",
  "\"wagmi\"",
  "\"zoom out\"",
  "\"ngmi but at least I'm early\"",
  "\"this is the accumulation zone\"",
  "\"the whales are suppressing it\"",
  "\"I don't sell, I DCA\"",
  "\"down 90% is just up 1000% inverted\"",
  "\"my cost basis is basically zero\"",
  "\"the fundamentals haven't changed\"",
  "\"I'm holding through the noise\"",
  "\"not your keys not your coins\"",
  "\"just gotta wait for the next cycle\"",
  "\"everyone who sold is ngmi\"",
  "\"this is actually bullish\"",
  "\"the chart pattern is still intact\"",
  "\"my influencer said buy more\"",
  "\"tax loss harvesting bro\"",
  "\"bear markets build character\"",
  "\"I'm in the pain zone, diamond hands\"",
  "\"smart money is accumulating\"",
  "\"this is a normal retrace\"",
  "\"I only invest what I can afford to lose\" (narrator: he could not)",
  "\"checking the chart every 30 seconds\"",
  "\"hodl is a strategy not a cope\"",
  "\"the team is still building\"",
  "\"just need one more green week\"",
  "\"already mentally spent the gains\"",
  "\"my therapist doesn't understand charts\"",
  "\"delete the app. check the app. delete the app.\"",
  "\"technically not a loss if I don't sell\"",
];

const NET_WORTH_DELTAS = [
  "-73% YTD",
  "-87% YTD",
  "-91% YTD",
  "-64% YTD",
  "-99.2% from ATH",
  "-82% since 'going all in'",
  "-68% this cycle",
  "+0.3% (gas fees not included)",
  "-55% and 'still bullish'",
  "-100% (margin call, RIP)",
];

// Weighted pick from an array — weights are index-based (lower index = higher weight)
function weightedPick<T>(arr: T[], rand: () => number, topHeavy = true): T {
  if (!topHeavy) return arr[Math.floor(rand() * arr.length)];
  // bias toward first entries (the worst outcomes) using sqrt
  const idx = Math.floor(Math.pow(rand(), 0.5) * arr.length);
  return arr[Math.min(idx, arr.length - 1)];
}

export function generateStats(userId: number): DegenStats {
  // Seed = userId mixed with current ISO week so stats rotate Monday
  const week = isoWeek(new Date());
  // Knuth multiplicative hash to spread bits
  const seed = (((userId * 2654435761) >>> 0) + week * 1234567891) >>> 0;
  const rand = mulberry32(seed);

  const paperhandIndex = Math.round(biasHigh(rand()) * 100);

  const liqIdx = Math.floor(biasHigh(rand(), 3) * LIQUIDATION_RISKS.length);
  const liquidationRisk = LIQUIDATION_RISKS[Math.min(liqIdx, LIQUIDATION_RISKS.length - 1)];

  const mentalIdx = Math.floor(biasHigh(rand(), 3) * MENTAL_STATES.length);
  const mentalState = MENTAL_STATES[Math.min(mentalIdx, MENTAL_STATES.length - 1)];

  const topIdx = Math.floor(rand() * TOP_DURATIONS.length);
  const lastBoughtTheTop = TOP_DURATIONS[topIdx];

  const copeIdx = Math.floor(rand() * COPES.length);
  const favoriteCope = COPES[copeIdx];

  const deltaIdx = Math.floor(biasHigh(rand(), 2) * NET_WORTH_DELTAS.length);
  const netWorthDelta = NET_WORTH_DELTAS[Math.min(deltaIdx, NET_WORTH_DELTAS.length - 1)];

  return {
    paperhandIndex,
    liquidationRisk,
    mentalState,
    lastBoughtTheTop,
    favoriteCope,
    netWorthDelta,
  };
}
