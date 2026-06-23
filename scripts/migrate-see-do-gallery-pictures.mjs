import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CARD_WIDTHS = [280, 340, 420, 680];
const GALLERY_SIZES = '(min-width: 901px) 347px, (min-width: 681px) 50vw, 100vw';

function discoverAttractionGalleryFiles() {
  const relPaths = [
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

function galleryPicture(slug, alt) {
  const base = `/images/see-do/gallery/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'avif')}
              "
              sizes="${GALLERY_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'webp')}
              "
              sizes="${GALLERY_SIZES}">
            <img
              src="${base}-340w.jpg"
              srcset="
            ${widthLadder(base, CARD_WIDTHS, 'jpg')}
              "
              sizes="${GALLERY_SIZES}"
              width="347"
              height="260"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function migrateGalleryImages(html) {
  return html.replace(
    /<div class="gallery-img" style="background-image:url\('([^']+)'\)" role="img" aria-label="([^"]*)"><\/div>/g,
    (_match, src, alt) => {
      const slug = slugFromImagePath(src);
      return `<div class="gallery-img">\n          ${galleryPicture(slug, alt)}\n        </div>`;
    },
  );
}

function bumpSeeDoCssVersion(html) {
  return html.replace(/\/css\/see-do\.css\?v=[^"]+/, '/css/see-do.css?v=1.0.4');
}

const files = discoverAttractionGalleryFiles();
let updated = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let html = migrateGalleryImages(before);
  html = bumpSeeDoCssVersion(html);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    updated += 1;
    console.log('Updated', path.relative(ROOT, file));
  } else {
    console.log('Skipped (no changes)', path.relative(ROOT, file));
  }
}

console.log(`\nDone. ${updated} of ${files.length} attraction gallery templates updated.`);

export { galleryPicture, discoverAttractionGalleryFiles };
