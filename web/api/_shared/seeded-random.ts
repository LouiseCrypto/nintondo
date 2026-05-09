/**
 * Deterministic PRNG utilities for Nintondo card rendering.
 * Pure functions — no side effects, no I/O.
 */

/** mulberry32: fast 32-bit PRNG seeded by an integer. Returns a function producing [0, 1) floats. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * cyrb53: fast string → 53-bit integer hash.
 * Produces well-distributed values suitable for seeding a PRNG.
 */
export function hashStringToSeed(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Returns the ISO week number (1–53) for the given date (defaults to today UTC). */
export function isoWeekNumber(date?: Date): number {
  const d = date ?? new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Pick a uniformly random item from an array using the given rng. */
export function pickFrom<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Weighted pick — items earlier in the array are more likely.
 * bias > 1 pulls toward the front; bias = 1 is uniform.
 */
export function pickWeighted<T>(items: readonly T[], rng: () => number, bias = 2.5): T {
  const idx = Math.min(
    Math.floor(Math.pow(rng(), 1 / bias) * items.length),
    items.length - 1,
  );
  return items[idx];
}
