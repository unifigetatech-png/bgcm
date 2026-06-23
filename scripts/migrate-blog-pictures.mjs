import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS = [
  path.join(__dirname, '..', 'src', 'public_html', 'blog', 'index.html'),
  path.join(__dirname, '..', 'blog', 'index.html'),
];

const CARD_WIDTHS = [280, 340, 420, 680];
const CARD_SIZES = '(min-width: 901px) 338px, (min-width: 681px) 418px, 84vw';
const FEATURED_WIDTHS = [540, 860, 1060];
const FEATURED_SIZES = '(min-width: 901px) 530px, 100vw';

const FEATURED_SLUG = 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation';

const SLUG_MAP = {
  '30468a_4703134a158e411597c3500200a9da41': FEATURED_SLUG,
  '30468a_efebfb96011345918d2643a6defd4098': 'why-burleigh-best-place-stay-gold-coast',
  '30468a_340c40a6147342fe8224f21888429b10': 'tradie-accommodation-gold-coast-budget-rooms',
  '30468a_1833acf4308c4bfeb3864c36d7cda104': 'romantic-getaway-burleigh-heads',
  EZfrdMN8Qww: 'school-holiday-gold-coast-theme-park-accommodation',
};

const SOURCE_MAP = {
  'tradie-accommodation-gold-coast-budget-rooms':
    'burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp',
  'romantic-getaway-burleigh-heads':
    'couple-mick-schamburg-lookout-deck-sunset-surfers-ocean-burleigh-gold-coast-motel.webp',
  'school-holiday-gold-coast-theme-park-accommodation':
    'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp',
};

function widthLadder(base, widths, ext) {
  return widths.map((w) => `${base}-${w}w.${ext} ${w}w`).join(',\n            ');
}

function slugFromSrc(src) {
  for (const [needle, slug] of Object.entries(SLUG_MAP)) {
    if (src.includes(needle)) {
      return slug;
    }
  }
  if (src.startsWith('/images/')) {
    return path.basename(src, path.extname(src));
  }
  throw new Error(`Unable to resolve blog image slug for source: ${src}`);
}

function cardPicture(slug, alt) {
  const base = `/images/blog/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'avif')}
              "
              sizes="${CARD_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'webp')}
              "
              sizes="${CARD_SIZES}">
            <img
              src="${base}-340w.jpg"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'jpg')}
              "
              sizes="${CARD_SIZES}"
              width="338"
              height="225"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function featuredPicture(slug, alt) {
  const base = `/images/blog/featured/${slug}`;
  return `<picture>
      <source
        type="image/avif"
        srcset="
            ${widthLadder(base, FEATURED_WIDTHS, 'avif')}
        "
        sizes="${FEATURED_SIZES}">
      <source
        type="image/webp"
        srcset="
            ${widthLadder(base, FEATURED_WIDTHS, 'webp')}
        "
        sizes="${FEATURED_SIZES}">
      <img
        src="${base}-1060w.jpg"
        srcset="
            ${widthLadder(base, FEATURED_WIDTHS, 'jpg')}
        "
        sizes="${FEATURED_SIZES}"
        width="530"
        height="353"
        alt="${alt}"
        loading="eager"
        fetchpriority="high"
        decoding="async">
    </picture>`;
}

function migrateFeatured(html) {
  return html.replace(
    /<div class="featured-thumb">\s*<img[^>]*alt="([^"]*)"[^>]*>\s*<span class="featured-tag">/,
    (_match, alt) => `<div class="featured-thumb">\n      ${featuredPicture(FEATURED_SLUG, alt)}\n      <span class="featured-tag">`,
  );
}

function migratePostThumbs(html) {
  return html.replace(
    /<div class="post-thumb">\s*<img src="([^"]+)" alt="([^"]*)"[^>]*>\s*<span class="post-cat">/g,
    (_match, src, alt) => {
      const slug = slugFromSrc(src);
      return `<div class="post-thumb">\n          ${cardPicture(slug, alt)}\n          <span class="post-cat">`;
    },
  );
}

for (const file of TARGETS) {
  let html = fs.readFileSync(file, 'utf8');
  html = migrateFeatured(html);
  html = migratePostThumbs(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated', file);
}

export { SLUG_MAP, SOURCE_MAP, FEATURED_SLUG, slugFromSrc };
