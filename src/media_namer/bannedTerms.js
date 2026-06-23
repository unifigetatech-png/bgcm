import { BANNED_TERMS } from './constants.js';

/**
 * Returns true when a filename contains marketing terms banned by property guidelines.
 *
 * @param {string} filename
 * @param {RegExp[]} bannedTerms
 * @returns {boolean}
 */
export function hasBannedTerm(filename, bannedTerms) {
  return bannedTerms.some((term) => term.test(filename));
}

export { BANNED_TERMS };
