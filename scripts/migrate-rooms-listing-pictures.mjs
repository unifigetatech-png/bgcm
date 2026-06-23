import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS = [
  path.join(__dirname, '..', 'src', 'public_html', 'rooms', 'index.html'),
  path.join(__dirname, '..', 'rooms', 'index.html'),
];

const LISTING_WIDTHS = [420, 680, 960, 1060];
const LISTING_SIZES = '(min-width: 901px) 1060px, 100vw';
const STRIP_WIDTHS = [200, 280, 340];
const STRIP_SIZES = '200px';

function widthLadder(base, widths, ext) {
  return widths.map((w) => `${base}-${w}w.${ext} ${w}w`).join(',\n            ');
}

function slugFromImagePath(imagePath) {
  return path.basename(imagePath, path.extname(imagePath));
}

function listingPicture(slug, alt) {
  const base = `/images/rooms/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, LISTING_WIDTHS, 'avif')}
              "
              sizes="${LISTING_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, LISTING_WIDTHS, 'webp')}
              "
              sizes="${LISTING_SIZES}">
            <img
              src="${base}-1060w.jpg"
              srcset="
            ${widthLadder(base, LISTING_WIDTHS, 'jpg')}
              "
              sizes="${LISTING_SIZES}"
              width="1060"
              height="596"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function stripPicture(slug, alt) {
  const base = `/images/rooms/strips/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, STRIP_WIDTHS, 'avif')}
              "
              sizes="${STRIP_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, STRIP_WIDTHS, 'webp')}
              "
              sizes="${STRIP_SIZES}">
            <img
              src="${base}-200w.jpg"
              srcset="
            ${widthLadder(base, STRIP_WIDTHS, 'jpg')}
              "
              sizes="${STRIP_SIZES}"
              width="200"
              height="150"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function migrateRoomPhoto(html) {
  return html.replace(
    /<div class="room-photo" style="background-image:url\('\/images\/([^']+)'\)" role="img" aria-label="([^"]*)">\s*<div class="room-photo-price">([^<]+)<\/div>\s*<\/div>/g,
    (_match, imageFile, alt, price) => {
      const slug = slugFromImagePath(imageFile);
      return `<div class="room-photo">
      ${listingPicture(slug, alt)}
      <div class="room-photo-price">${price}</div>
    </div>`;
    },
  );
}

function migrateStripImages(html) {
  return html.replace(
    /<img src="\/images\/([^"]+)" alt="([^"]*)" loading="lazy" decoding="async">/g,
    (_match, imageFile, alt) => stripPicture(slugFromImagePath(imageFile), alt),
  );
}

for (const file of TARGETS) {
  let html = fs.readFileSync(file, 'utf8');
  html = migrateRoomPhoto(html);
  html = migrateStripImages(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated', file);
}
