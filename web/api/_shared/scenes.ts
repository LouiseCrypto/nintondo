import { hashStringToSeed, mulberry32, pickFrom } from './seeded-random';

/** 20 scene captions — max 30 chars each. */
export const SCENE_CAPTIONS = [
  'PORTFOLIO REVIEW',
  'MORNING AFTER',
  'CHART CHECKING',
  'STILL COPING',
  'REFRESHING DEXSCREENER',
  'EXPLAINING TO SPOUSE',
  'CHECKING LOSSES',
  'ANOTHER L LOADING',
  'LATE NIGHT TRADING',
  'BAGHOLD ERA',
  'PAPERHANDING IN 4K',
  'GETTING JEETED ON',
  'FOMO-IN PHASE',
  'CONFIRMATION BIAS HOUR',
  'HOPIUM SESSION',
  'DEEP COPE TERRITORY',
  'EMOTIONAL DAMAGE',
  'CHART POSTING THERAPY',
  'RECOVERY ARC FAILED',
  'TILTED MAXIMUM',
] as const;

/**
 * Returns a deterministic scene caption for the given (userId, roastId) pair.
 * Same roast always gets the same scene — varies across roasts for the same user.
 */
export function pickScene(userId: number, roastId: string): string {
  const seed = hashStringToSeed(`${userId}:scene:${roastId}`);
  const rng = mulberry32(seed);
  return pickFrom(SCENE_CAPTIONS, rng);
}
