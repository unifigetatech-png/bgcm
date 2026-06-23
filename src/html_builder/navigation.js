/**
 * Canonical lowercase navigation paths for Linux/cPanel routing.
 */

export const NAV_PATHS = {
  home: '/',
  rooms: '/rooms/',
  seeDo: '/see-do/',
  blog: '/blog/',
  location: '/location/',
  locationMap: '/location/#interactive-map',
  contact: '/contact/',
  about: '/about/',
};

/** Broken uppercase or legacy paths → canonical lowercase slugs. */
export const NAV_PATH_FIXES = [
  ['href="/Location/index.html"', `href="${NAV_PATHS.location}"`],
  ['href="/Location/"', `href="${NAV_PATHS.location}"`],
  ['href="/Rooms/"', `href="${NAV_PATHS.rooms}"`],
  ['href="/Contact/"', `href="${NAV_PATHS.contact}"`],
  ['href="/Blog/"', `href="${NAV_PATHS.blog}"`],
  ['href="/About/"', `href="${NAV_PATHS.about}"`],
  ['href="/See-Do/"', `href="${NAV_PATHS.seeDo}"`],
  ['href="/SEE-DO/"', `href="${NAV_PATHS.seeDo}"`],
];

export function normaliseNavigationPaths(content) {
  let updated = content;

  for (const [find, replace] of NAV_PATH_FIXES) {
    updated = updated.split(find).join(replace);
  }

  return updated;
}
