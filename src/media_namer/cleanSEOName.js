import { GEO_ANCHOR } from './constants.js';

/**
 * Normalises a filename stem into a lowercase, hyphenated, SEO-friendly slug.
 * Appends the geo anchor when neither "burleigh" nor "motel" is present.
 *
 * @param {string} baseName - Filename without extension
 * @param {string} geoAnchor - Local authority suffix
 * @returns {string}
 */
export function cleanSEOName(baseName, geoAnchor) {
  let clean = String(baseName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!clean.includes('burleigh') && !clean.includes('motel')) {
    clean = `${clean}-${geoAnchor}`;
  }

  return clean;
}

export { GEO_ANCHOR };
