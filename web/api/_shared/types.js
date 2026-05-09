import { hashStringToSeed, isoWeekNumber, mulberry32, pickFrom } from './seeded-random.js';
/** 35 savage trading-card type badges. Deterministic per (userId + ISO week). */
export const TYPE_BADGES = [
    'PAPERHAND',
    'BAGHOLDER',
    'RUGPULLED',
    'EXIT-LIQUIDITY',
    'COPED-OUT',
    'TERMINAL-COPER',
    'FOMO-VICTIM',
    'BOUGHT-THE-TOP',
    'CHART-COOKED',
    'LIQUIDATED',
    'OVER-LEVERAGED',
    'EMOTIONAL-TRADER',
    'DIAMOND-HANDED-TRASH',
    'PERPETUALLY-EARLY',
    'DELUSIONAL-BULL',
    'CAPITULATED',
    'NGMI-CERTIFIED',
    'SOLD-AT-BOTTOM',
    'JEET-CONFIRMED',
    'LATE-ADOPTER',
    'TRENCH-DWELLER',
    'IRON-HANDED-NOTHING',
    'SCAMMED-AGAIN',
    'EXIT-LIQUIDITY-SUPREME',
    'HOPIUM-ADDICT',
    'CHART-DENIER',
    'RECOVERY-MODE',
    'TILTED-MAXIMALIST',
    'HARDCORE-COPER',
    'FUTURES-CASUALTY',
    'AIRDROP-FARMER-FAILED',
    'TOKEN-MAXI-RUGGED',
    'ECOSYSTEM-VICTIM',
    'MICROCAP-MARTYR',
    'SLOW-RUGGED',
];
/**
 * Returns a deterministic type badge for the given userId.
 * Rotates every Monday (ISO week boundary) — same user, same badge all week.
 */
export function pickType(userId) {
    const week = isoWeekNumber();
    const seed = hashStringToSeed(`${userId}:type:${week}`);
    const rng = mulberry32(seed);
    return pickFrom(TYPE_BADGES, rng);
}
