import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SLUG_MAP = {
  '30468a_4703134a158e411597c3500200a9da41': 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation',
  '30468a_efebfb96011345918d2643a6defd4098': 'why-burleigh-best-place-stay-gold-coast',
  '30468a_340c40a6147342fe8224f21888429b10': 'tradie-accommodation-gold-coast-budget-rooms',
  '30468a_1833acf4308c4bfeb3864c36d7cda104': 'romantic-getaway-burleigh-heads',
  EZfrdMN8Qww: 'school-holiday-gold-coast-theme-park-accommodation',
};

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

const CARD_WIDTHS = [280, 340, 420, 680];
const CARD_SIZES = '(min-width: 901px) 338px, (min-width: 681px) 418px, 84vw';
const HERO_WIDTHS = [640, 960, 1280, 1920];
const HERO_SIZES = '100vw';

function discoverPostHtmlFiles() {
  const files = [];
  for (const tree of ['src/public_html/post', 'post']) {
    const postRoot = path.join(ROOT, tree);
    if (!fs.existsSync(postRoot)) {
      continue;
    }
    for (const slug of fs.readdirSync(postRoot)) {
      const file = path.join(postRoot, slug, 'index.html');
      if (fs.existsSync(file)) {
        files.push(file);
      }
    }
  }
  return files;
}

function widthLadder(base, widths, ext) {
  return widths.map((w) => `${base}-${w}w.${ext} ${w}w`).join(',\n            ');
}

function heroPicture(postSlug, alt) {
  const base = `/images/blog/heroes/${postSlug}`;
  return `<picture>
    <source
      type="image/avif"
      srcset="
            ${widthLadder(base, HERO_WIDTHS, 'avif')}
      "
      sizes="${HERO_SIZES}">
    <source
      type="image/webp"
      srcset="
            ${widthLadder(base, HERO_WIDTHS, 'webp')}
      "
      sizes="${HERO_SIZES}">
    <img
      src="${base}-1920w.jpg"
      srcset="
            ${widthLadder(base, HERO_WIDTHS, 'jpg')}
      "
      sizes="${HERO_SIZES}"
      width="1920"
      height="520"
      alt="${alt}"
      loading="eager"
      fetchpriority="high"
      decoding="async">
  </picture>`;
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

function postSlugFromFile(filePath) {
  return path.basename(path.dirname(filePath));
}

function migrateHero(html, postSlug) {
  if (html.includes('class="post-hero-img">\n    <picture>')) {
    return html;
  }
  return html.replace(
    /<div class="post-hero-img">\s*<img[^>]*alt="([^"]*)"[^>]*>\s*<\/div>/,
    (_match, alt) => `<div class="post-hero-img">\n    ${heroPicture(postSlug, alt)}\n  </div>`,
  );
}

function migrateRelatedThumbs(html) {
  return html.replace(
    /<div class="related-thumb"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/div>/g,
    (_match, src, alt) => {
      const slug = slugFromSrc(src);
      return `<div class="related-thumb">${cardPicture(slug, alt)}</div>`;
    },
  );
}

function bumpPostsCssVersion(html) {
  return html.replace(/\/css\/posts\.css\?v=[^"]+/, '/css/posts.css?v=1.0.1');
}

const files = discoverPostHtmlFiles();
let updated = 0;

for (const file of files) {
  const postSlug = postSlugFromFile(file);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = migrateHero(html, postSlug);
  html = migrateRelatedThumbs(html);
  html = bumpPostsCssVersion(html);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    updated += 1;
    console.log('Updated', path.relative(ROOT, file));
  } else {
    console.log('Skipped (no changes)', path.relative(ROOT, file));
  }
}

console.log(`\nDone. ${updated} of ${files.length} post templates updated.`);

export { heroPicture, cardPicture, discoverPostHtmlFiles, SLUG_MAP, slugFromSrc };
