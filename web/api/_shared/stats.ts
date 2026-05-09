/**
 * Deterministic degen stats generator.
 * Same userId → same stats within an ISO week. Rotates every Monday.
 */
import { hashStringToSeed, isoWeekNumber, mulberry32, pickFrom, pickWeighted } from './seeded-random';

export interface DegenStats {
  paperhandIndex: number;    // 0–100, biased 70–99
  liquidationRisk: string;
  mentalState: string;
  lastBoughtTheTop: string;
  favoriteCope: string;
  netWorthDelta: string;
}

// Ordered worst → least-bad so pickWeighted (biased toward front) favours the worst
const RISK_LEVELS = [
  'TERMINAL', 'CRITICAL', 'SEVERE', 'EXTREME',
  'CATASTROPHIC', 'IMMINENT', 'TRAGIC', 'CURSED',
  'COOKED', 'FUCKED', 'DOOMED', 'HOSPICE-TIER',
] as const;

const MENTAL_STATES = [
  'COPING', 'DELUSIONAL', 'DISSOCIATING', 'CATATONIC',
  'MANIC', 'IN-DENIAL', 'BARGAINING', 'ROPING',
  'NUMB', 'BROKEN', 'HOPIUM-MAX', 'ACCEPTANCE-PHASE',
] as const;

const TOP_DURATIONS = [
  'just now', '5 mins ago', '1 hour ago', '3 hours ago',
  '1 day ago', '3 days ago', '1 week ago', '2 weeks ago',
  '1 month ago', 'last cycle', 'every cycle',
] as const;

const COPES = [
  'wagmi', 'few understand', 'early', 'im just down bad',
  'lfg', 'next cycle', 'still bullish', 'thesis intact',
  'accumulating', 'ssj4 soon', 'zoom out', 'hodl',
  'diamond hands', 'ngmi but early', 'this is fine',
  'buy the dip', 'down bad szn', "we're so back",
  'just wait', 'gm', 'never selling', 'trust the process',
  'long term hold', 'bear market gains', 'mental',
  'not yet ser', 'patience', 'team still building',
  'wen moon', "i'm not selling", 'skill issue',
  'just dca', 'fundamentals intact', 'vibes are good',
  'ser pls', "normies don't get it", 'staying the course',
] as const;

export function generateStats(userId: number): DegenStats {
  const week = isoWeekNumber();
  const seed = hashStringToSeed(`${userId}:stats:${week}`);
  const rng = mulberry32(seed);

  // paperhandIndex: 10% chance of a "respectable" 40–69, otherwise 70–99
  const r1 = rng();
  const paperhandIndex = r1 < 0.1
    ? Math.round(40 + rng() * 29)
    : Math.round(70 + rng() * 29);

  const liquidationRisk = pickWeighted(RISK_LEVELS, rng, 2.5);
  const mentalState = pickWeighted(MENTAL_STATES, rng, 2.5);
  const lastBoughtTheTop = pickFrom(TOP_DURATIONS, rng);
  const favoriteCope = pickFrom(COPES, rng);

  // Net worth delta: -50% to -97% YTD
  const pct = Math.round(50 + rng() * 47);
  const netWorthDelta = `-${pct}% YTD`;

  return { paperhandIndex, liquidationRisk, mentalState, lastBoughtTheTop, favoriteCope, netWorthDelta };
}
