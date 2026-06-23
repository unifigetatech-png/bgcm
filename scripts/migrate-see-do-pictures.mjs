import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CARD_WIDTHS = [280, 340, 420, 680];
const CARD_SIZES = '(min-width: 901px) 338px, (min-width: 681px) 418px, 84vw';
const LOCAL_SIZES = '(min-width: 901px) 347px, 100vw';

function discoverSeeDoHtmlFiles() {
  const relPaths = [
    'see-do/index.html',
    'see-do/movie-world/index.html',
    'see-do/sea-world/index.html',
    'see-do/wet-n-wild/index.html',
    'movie-world-accommodation-gold-coast/index.html',
    'sea-world-accommodation-gold-coast/index.html',
    'wet-n-wild-accommodation-gold-coast/index.html',
  ];
  const files = [];
  for (const tree of ['src/public_html', '.']) {
    for (const rel of relPaths) {
      const file = path.join(ROOT, tree, rel);
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

function slugFromImagePath(imagePath) {
  return path.basename(imagePath, path.extname(imagePath));
}

function parkPicture(slug, alt) {
  const base = `/images/see-do/${slug}`;
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
              height="190"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function localPicture(slug, alt) {
  const base = `/images/see-do/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'avif')}
              "
              sizes="${LOCAL_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'webp')}
              "
              sizes="${LOCAL_SIZES}">
            <img
              src="${base}-340w.jpg"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'jpg')}
              "
              sizes="${LOCAL_SIZES}"
              width="347"
              height="260"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function migrateParkPhotos(html) {
  return html.replace(
    /<div class="park-photo" style="background-image:url\('([^']+)'\);" role="img" aria-label="([^"]*)">/g,
    (_match, src, alt) => {
      const slug = slugFromImagePath(src);
      return `<div class="park-photo">\n          ${parkPicture(slug, alt)}`;
    },
  );
}

function migrateLocalPhotos(html) {
  return html.replace(
    /<div class="local-photo (tall|short)" style="background-image:url\('([^']+)'\);" role="img" aria-label="([^"]*)">/g,
    (_match, sizeClass, src, alt) => {
      const slug = slugFromImagePath(src);
      return `<div class="local-photo ${sizeClass}">\n        ${localPicture(slug, alt)}`;
    },
  );
}

function bumpSeeDoCssVersion(html) {
  return html.replace(/\/css\/see-do\.css\?v=[^"]+/, '/css/see-do.css?v=1.0.3');
}

const files = discoverSeeDoHtmlFiles();
let updated = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = migrateParkPhotos(html);
  html = migrateLocalPhotos(html);
  html = bumpSeeDoCssVersion(html);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    updated += 1;
    console.log('Updated', path.relative(ROOT, file));
  } else {
    console.log('Skipped (no changes)', path.relative(ROOT, file));
  }
}

console.log(`\nDone. ${updated} of ${files.length} See & Do templates updated.`);

export { discoverSeeDoHtmlFiles, parkPicture, localPicture };
