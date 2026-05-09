import path from 'path';
import { fileURLToPath } from 'url';
import { pickFrom } from './seeded-random.js';

export const CHARACTER_TAGS = [
  'mario', 'luigi', 'peach', 'pikachu', 'ash',
  'dk', 'mew', 'charmander', 'bulbasaur', 'mewtwo',
] as const;

export type CharacterTag = typeof CHARACTER_TAGS[number];

const CHARACTERS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'characters');

/**
 * Resolves which character to display on the card.
 *   - If roastCharacterTag matches a known CHARACTER_TAG → use that character.
 *   - If 'general' or unrecognised → pick randomly via rng.
 * Returns the tag and the absolute path to the PNG asset.
 */
export function resolveCharacter(
  roastCharacterTag: string,
  rng: () => number,
): { tag: CharacterTag; assetPath: string } {
  const isKnown = (CHARACTER_TAGS as readonly string[]).includes(roastCharacterTag);
  const tag: CharacterTag = isKnown
    ? (roastCharacterTag as CharacterTag)
    : pickFrom(CHARACTER_TAGS, rng);

  return {
    tag,
    assetPath: path.join(CHARACTERS_DIR, `${tag}.png`),
  };
}
