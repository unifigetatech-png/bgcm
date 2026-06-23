import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TARGETS = [
  path.join(ROOT, 'src', 'public_html', 'index.html'),
  path.join(ROOT, 'index.html'),
];

const ROOM_SIZES = '(min-width: 901px) 338px, (min-width: 681px) 418px, 84vw';
const BAND_SIZES = '100vw';
const HERO_SIZES = '100vw';

function widthLadder(base, widths, ext) {
  return widths.map((w) => `${base}-${w}w.${ext} ${w}w`).join(',\n            ');
}

function roomPicture(slug, alt) {
  const base = `/images/${slug}`;
  const widths = [280, 340, 420, 680];
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, widths, 'avif')}
              "
              sizes="${ROOM_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, widths, 'webp')}
              "
              sizes="${ROOM_SIZES}">
            <img
              src="${base}-340w.jpg"
              srcset="
            ${widthLadder(base, widths, 'jpg')}
              "
              sizes="${ROOM_SIZES}"
              width="338"
              height="190"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function bandPicture(slug, alt) {
  const base = `/images/${slug}`;
  const widths = [640, 960, 1280, 1920];
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, widths, 'avif')}
              "
              sizes="${BAND_SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, widths, 'webp')}
              "
              sizes="${BAND_SIZES}">
            <img
              src="${base}-1920w.jpg"
              srcset="
            ${widthLadder(base, widths, 'jpg')}
              "
              sizes="${BAND_SIZES}"
              width="1920"
              height="823"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

function heroPicture() {
  const slug = 'burleigh-motel-mural-full-facade-gold-coast-highway-miami';
  const base = `/images/${slug}`;
  const widths = [640, 960, 1280, 1920];
  const alt = 'Burleigh Gold Coast Motel exterior with tropical mural under blue sky';
  return `<picture>
    <source
      type="image/avif"
      srcset="
            ${widthLadder(base, widths, 'avif')}
      "
      sizes="${HERO_SIZES}">
    <source
      type="image/webp"
      srcset="
            ${widthLadder(base, widths, 'webp')}
      "
      sizes="${HERO_SIZES}">
    <img
      src="${base}-1280w.jpg"
      srcset="
            ${widthLadder(base, widths, 'jpg')}
      "
      sizes="${HERO_SIZES}"
      width="1920"
      height="1080"
      alt="${alt}"
      loading="eager"
      fetchpriority="high"
      decoding="async">
  </picture>`;
}

const ROOMS = [
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/double-queen-room-ceiling-fan-air-con-burleigh-gold-coast-motel\.webp'\)" role="img" aria-label="Double room with queen bed and private ensuite — Burleigh Gold Coast Motel">\s*<div class="room-price">FROM \$125 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'double-queen-room-ceiling-fan-air-con-burleigh-gold-coast-motel',
    alt: 'Double room with queen bed and private ensuite — Burleigh Gold Coast Motel',
    price: 'FROM $125 / NIGHT',
  },
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/ground-floor-triple-room-tv-microwave-burleigh-gold-coast-motel\.webp'\)" role="img" aria-label="Ground floor triple room — Burleigh Gold Coast Motel Miami">\s*<div class="room-price">FROM \$165 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'ground-floor-triple-room-tv-microwave-burleigh-gold-coast-motel',
    alt: 'Ground floor triple room — Burleigh Gold Coast Motel Miami',
    price: 'FROM $165 / NIGHT',
  },
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/triple-room-queen-single-ocean-view-burleigh-gold-coast-motel\.webp'\)" role="img" aria-label="Triple room with queen and single bed — Burleigh Gold Coast Motel">\s*<div class="room-price">FROM \$165 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'triple-room-queen-single-ocean-view-burleigh-gold-coast-motel',
    alt: 'Triple room with queen and single bed — Burleigh Gold Coast Motel',
    price: 'FROM $165 / NIGHT',
  },
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/quad-room-queen-two-singles-burleigh-gold-coast-motel\.webp'\)" role="img" aria-label="Quadruple room with queen and two single beds — Burleigh Gold Coast Motel">\s*<div class="room-price">FROM \$185 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'quad-room-queen-two-singles-burleigh-gold-coast-motel',
    alt: 'Quadruple room with queen and two single beds — Burleigh Gold Coast Motel',
    price: 'FROM $185 / NIGHT',
  },
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/family-room-queen-three-singles-burleigh-gold-coast-motel\.webp'\)" role="img" aria-label="Family room with queen and three single beds — Burleigh Gold Coast Motel">\s*<div class="room-price">FROM \$195 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'family-room-queen-three-singles-burleigh-gold-coast-motel',
    alt: 'Family room with queen and three single beds — Burleigh Gold Coast Motel',
    price: 'FROM $195 / NIGHT',
  },
  {
    old: /<div class="room-img" style="background-image:url\('\/images\/interconnecting-rooms-queen-single-beds-burleigh-heads-motel\.webp'\)" role="img" aria-label="Interconnecting rooms with two private ensuites — Burleigh Gold Coast Motel">\s*<div class="room-price">From \$295 \/ NIGHT<\/div>\s*<\/div>/,
    slug: 'interconnecting-rooms-queen-single-beds-burleigh-heads-motel',
    alt: 'Interconnecting rooms with two private ensuites — Burleigh Gold Coast Motel',
    price: 'From $295 / NIGHT',
  },
];

for (const file of TARGETS) {
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(
    /<div class="hero-bg" role="img" aria-label="Burleigh Gold Coast Motel exterior with tropical mural under blue sky"><\/div>/,
    `<div class="hero-bg" aria-hidden="true">\n    ${heroPicture()}\n  </div>`
  );

  html = html.replace(
    /<div class="photo-band-bg" style="background-image:url\('\/images\/burleigh-gold-coast-motel-pool-sun-lounges-courtyard\.webp'\)" role="img" aria-label="Outdoor fenced swimming pool — Burleigh Gold Coast Motel Miami Gold Coast"><\/div>/,
    `<div class="photo-band-bg">\n    ${bandPicture('burleigh-gold-coast-motel-pool-sun-lounges-courtyard', 'Outdoor fenced swimming pool — Burleigh Gold Coast Motel Miami Gold Coast')}\n  </div>`
  );

  html = html.replace(
    /<div class="photo-band-bg" style="background-image:url\('\/images\/miami-hill-lookout-sunset-gold-coast-burleigh-motel-accommodation\.webp'\)" role="img" aria-label="Sunset view from Miami Hill lookout, Gold Coast"><\/div>/,
    `<div class="photo-band-bg">\n    ${bandPicture('miami-hill-lookout-sunset-gold-coast-burleigh-motel-accommodation', 'Sunset view from Miami Hill lookout, Gold Coast')}\n  </div>`
  );

  for (const room of ROOMS) {
    html = html.replace(
      room.old,
      `<div class="room-img">\n          ${roomPicture(room.slug, room.alt)}\n          <div class="room-price">${room.price}</div>\n        </div>`
    );
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated', file);
}
