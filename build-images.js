#!/usr/bin/env node
/**
 * BGCM responsive image build pipeline.
 *
 * Generates AVIF / WebP / JPEG width ladders from master sources using sharp.
 * Run from project root: node build-images.js
 *                    or: npm run build:images
 *
 * Place master rasters in image-sources/homepage/ (see TASKS below).
 * Outputs land in src/public_html/images/ as {slug}-{width}w.{ext}.
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const PROJECT_ROOT = __dirname;

/** @type {readonly number[]} 16:9 and 3:2 card grids (rooms, parks, blog cards) */
const LADDER_CARD = Object.freeze([280, 340, 420, 680]);

/** @type {readonly number[]} Full-bleed heroes and 21:9 photo bands */
const LADDER_HERO_BAND = Object.freeze([640, 960, 1280, 1920]);

/** @type {readonly number[]} Rooms listing full-width hero photos (16:9) */
const LADDER_LISTING = Object.freeze([420, 680, 960, 1060]);

/** @type {readonly number[]} Rooms listing photo-strip thumbs (4:3) */
const LADDER_STRIP = Object.freeze([200, 280, 340]);

/** @type {readonly number[]} Blog index featured article (3:2) */
const LADDER_FEATURED = Object.freeze([540, 860, 1060]);

const FORMATS = Object.freeze({
  avif: { quality: 55 },
  webp: { quality: 75 },
  jpg: { quality: 80 },
});

const SOURCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif'];

/**
 * @typedef {Object} ImageTask
 * @property {string} label
 * @property {string} source
 * @property {string} destDir
 * @property {string} slug
 * @property {'16:9'|'3:2'|'21:9'|'4:3'|'1920:520'} aspectRatio
 * @property {readonly number[]} widths
 * @property {import('sharp').Position | import('sharp').Strategy} [position]
 */

/** @type {ImageTask[]} */
const TASKS = [
  {
    label: 'Homepage hero — motel mural facade',
    source: 'image-sources/homepage/burleigh-motel-mural-full-facade-gold-coast-highway-miami.jpg',
    destDir: 'src/public_html/images',
    slug: 'burleigh-motel-mural-full-facade-gold-coast-highway-miami',
    aspectRatio: '16:9',
    widths: LADDER_HERO_BAND,
    position: 'north',
  },
  {
    label: 'Homepage photo band — pool courtyard',
    source: 'image-sources/homepage/burleigh-gold-coast-motel-pool-sun-lounges-courtyard.jpg',
    destDir: 'src/public_html/images',
    slug: 'burleigh-gold-coast-motel-pool-sun-lounges-courtyard',
    aspectRatio: '21:9',
    widths: LADDER_HERO_BAND,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage photo band — Miami Hill sunset',
    source: 'image-sources/homepage/miami-hill-lookout-sunset-gold-coast-burleigh-motel-accommodation.jpg',
    destDir: 'src/public_html/images',
    slug: 'miami-hill-lookout-sunset-gold-coast-burleigh-motel-accommodation',
    aspectRatio: '21:9',
    widths: LADDER_HERO_BAND,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — double',
    source: 'image-sources/homepage/double-queen-room-ceiling-fan-air-con-burleigh-gold-coast-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'double-queen-room-ceiling-fan-air-con-burleigh-gold-coast-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — triple ground floor',
    source: 'image-sources/homepage/ground-floor-triple-room-tv-microwave-burleigh-gold-coast-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'ground-floor-triple-room-tv-microwave-burleigh-gold-coast-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — triple upstairs',
    source: 'image-sources/homepage/triple-room-queen-single-ocean-view-burleigh-gold-coast-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'triple-room-queen-single-ocean-view-burleigh-gold-coast-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — quad',
    source: 'image-sources/homepage/quad-room-queen-two-singles-burleigh-gold-coast-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'quad-room-queen-two-singles-burleigh-gold-coast-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — family',
    source: 'image-sources/homepage/family-room-queen-three-singles-burleigh-gold-coast-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'family-room-queen-three-singles-burleigh-gold-coast-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage room card — interconnecting',
    source: 'image-sources/homepage/interconnecting-rooms-queen-single-beds-burleigh-heads-motel.jpg',
    destDir: 'src/public_html/images',
    slug: 'interconnecting-rooms-queen-single-beds-burleigh-heads-motel',
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },

  // ── Homepage blog preview cards (3:2, /images/blog/) ──
  {
    label: 'Homepage blog preview — theme parks',
    source: 'src/public_html/images/warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp',
    destDir: 'src/public_html/images/blog',
    slug: 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation',
    aspectRatio: '3:2',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage blog preview — why burleigh',
    source: 'src/public_html/images/burleigh-heads-beach-surfers-families-gold-coast-skyline-motel.webp',
    destDir: 'src/public_html/images/blog',
    slug: 'why-burleigh-best-place-stay-gold-coast',
    aspectRatio: '3:2',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },
  {
    label: 'Homepage blog preview — beaches guide',
    source: 'src/public_html/images/surfers-burleigh-heads-headland-ocean-skyline-golden-hour-gold-coast-motel.webp',
    destDir: 'src/public_html/images/blog',
    slug: 'best-gold-coast-beaches-surf-guide',
    aspectRatio: '3:2',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  },

  // ── Rooms listing full-width photos (16:9, /images/rooms/) ──
  ...[
    'double-queen-room-ceiling-fan-air-con-burleigh-gold-coast-motel',
    'ground-floor-triple-room-tv-microwave-burleigh-gold-coast-motel',
    'triple-room-queen-single-ocean-view-burleigh-gold-coast-motel',
    'quad-room-queen-two-singles-burleigh-gold-coast-motel',
    'family-room-queen-three-singles-burleigh-gold-coast-motel',
    'interconnecting-rooms-queen-single-beds-burleigh-heads-motel',
  ].map((slug) => ({
    label: `Rooms listing hero — ${slug}`,
    source: `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/rooms',
    slug,
    aspectRatio: '16:9',
    widths: LADDER_LISTING,
    position: sharp.strategy.entropy,
  })),

  // ── Rooms listing photo-strip thumbs (4:3, /images/rooms/strips/) ──
  ...[
    'double-queen-room-ensuite-microwave-bar-fridge-burleigh-motel',
    'private-ensuite-vessel-sink-arch-mirror-burleigh-motel',
    'burleigh-gold-coast-motel-pool-sun-lounges-courtyard',
    'ground-floor-triple-no-stairs-queen-single-burleigh-motel',
    'triple-room-queen-single-tv-fridge-burleigh-motel',
    'triple-room-sleeps-3-air-con-burleigh-heads-motel',
    'burleigh-motel-mural-palm-trees-gold-coast-highway-miami',
    'interconnecting-room-six-guests-v2-burleigh-gold-coast-motel',
    'interconnecting-rooms-dining-area-tv-burleigh-gold-coast-motel',
  ].map((slug) => ({
    label: `Rooms listing strip — ${slug}`,
    source: `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/rooms/strips',
    slug,
    aspectRatio: '4:3',
    widths: LADDER_STRIP,
    position: sharp.strategy.entropy,
  })),

  // ── Blog index featured article (3:2, /images/blog/featured/) ──
  {
    label: 'Blog index featured — theme parks guide',
    source: 'src/public_html/images/warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp',
    destDir: 'src/public_html/images/blog/featured',
    slug: 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation',
    aspectRatio: '3:2',
    widths: LADDER_FEATURED,
    position: sharp.strategy.entropy,
  },

  // ── Blog index grid thumbs (3:2, /images/blog/) ──
  ...[
    ['burleigh-gold-coast-motel-exterior-street-view-miami-qld', 'burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp'],
    ['burleigh-gold-coast-motel-front-entrance-vacancy-miami', 'burleigh-gold-coast-motel-front-entrance-vacancy-miami.webp'],
    ['burleigh-motel-mural-full-facade-gold-coast-highway-miami', 'burleigh-motel-mural-full-facade-gold-coast-highway-miami.webp'],
    ['burleigh-heads-beach-surfers-families-gold-coast-skyline-motel', 'burleigh-heads-beach-surfers-families-gold-coast-skyline-motel.webp'],
    ['sea-world-family-arriving-entrance-gate-nearby-burleigh-gold-coast-motel', 'sea-world-family-arriving-entrance-gate-nearby-burleigh-gold-coast-motel.webp'],
    ['tradie-accommodation-gold-coast-budget-rooms', 'burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp'],
    ['romantic-getaway-burleigh-heads', 'couple-mick-schamburg-lookout-deck-sunset-surfers-ocean-burleigh-gold-coast-motel.webp'],
    ['school-holiday-gold-coast-theme-park-accommodation', 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp'],
  ].map(([slug, sourceFile]) => ({
    label: `Blog index grid — ${slug}`,
    source: `src/public_html/images/${sourceFile}`,
    destDir: 'src/public_html/images/blog',
    slug,
    aspectRatio: '3:2',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  })),

  // ── Blog article related-post thumbs (3:2, /images/blog/) ──
  ...[
    'couple-mick-schamburg-lookout-deck-sunset-surfers-ocean-burleigh-gold-coast-motel',
    'surfers-burleigh-heads-headland-ocean-skyline-golden-hour-gold-coast-motel',
    'movie-world-family-entrance-gate-nearby-burleigh-gold-coast-motel',
    'surfers-boards-burleigh-headland-rocks-ocean-skyline-gold-coast-motel',
    'school-holiday-gold-coast-theme-park-accommodation',
  ].map((slug) => ({
    label: `Blog article related thumb — ${slug}`,
    source: slug === 'school-holiday-gold-coast-theme-park-accommodation'
      ? 'src/public_html/images/warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp'
      : `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/blog',
    slug,
    aspectRatio: '3:2',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  })),

  // ── Blog article post heroes (1920×520, /images/blog/heroes/) ──
  ...[
    ['why-burleigh-best-place-stay-gold-coast', 'burleigh-motel-mural-full-facade-gold-coast-highway-miami.webp'],
    ['tradie-accommodation-gold-coast-budget-rooms-in-queensland', 'burleigh-gold-coast-motel-exterior-mural-entrance-guest-parking.webp'],
    ['school-holiday-gold-coast-accommodation', 'movie-world-family-entrance-gate-nearby-burleigh-gold-coast-motel.webp'],
    ['sea-world-carnivale-2027-accommodation', 'sea-world-family-arriving-entrance-gate-nearby-burleigh-gold-coast-motel.webp'],
    ['free-things-to-do-burleigh', 'burleigh-heads-beach-surfers-families-gold-coast-skyline-motel.webp'],
    ['best-gold-coast-beaches-surf-guide', 'surfers-burleigh-heads-headland-ocean-skyline-golden-hour-gold-coast-motel.webp'],
    ['burleigh-heads-accommodation-done-right', 'burleigh-gold-coast-motel-front-entrance-vacancy-miami.webp'],
    ['romantic-getaway-burleigh-heads', 'couple-mick-schamburg-lookout-deck-sunset-surfers-ocean-burleigh-gold-coast-motel.webp'],
    ['budget-travel-gold-coast-burleigh', 'burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp'],
    ['discover-burleigh-gold-coast-motel-your-ideal-stay', 'burleigh-motel-mural-full-facade-gold-coast-highway-miami.webp'],
    ['gold-coast-theme-park-accommodation-guide-stay-smart-save-big', 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation.webp'],
  ].map(([slug, sourceFile]) => ({
    label: `Blog article hero — ${slug}`,
    source: `src/public_html/images/${sourceFile}`,
    destDir: 'src/public_html/images/blog/heroes',
    slug,
    aspectRatio: '1920:520',
    widths: LADDER_HERO_BAND,
    position: 'north',
  })),

  // ── See & Do park cards (16:9, /images/see-do/) ──
  ...[
    'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation',
    'sea-world-gold-coast-marine-experience-burleigh-motel-accommodation',
    'wet-n-wild-gold-coast-wave-pool-group-friends-burleigh-motel-accommodation',
  ].map((slug) => ({
    label: `See-do park card — ${slug}`,
    source: `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/see-do',
    slug,
    aspectRatio: '16:9',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  })),

  // ── See & Do local grid photos (4:3, /images/see-do/) ──
  ...[
    'north-burleigh-heads-beach-aerial-gold-coast',
    'burleigh-heads-national-park-gold-coast',
    'miami-hill-lookout-sunset-gold-coast-burleigh-motel-accommodation',
  ].map((slug) => ({
    label: `See-do local photo — ${slug}`,
    source: `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/see-do',
    slug,
    aspectRatio: '4:3',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  })),

  // ── See & Do attraction gallery slots (4:3, /images/see-do/gallery/) ──
  ...[
    'movie-world-family-selfie-entrance-gate-nearby-burleigh-gold-coast-motel',
    'movie-world-joker-ride-couple-laughing-nearby-burleigh-gold-coast-motel',
    'movie-world-superman-escape-roller-coaster-nearby-burleigh-gold-coast-motel',
    'movie-world-street-parade-marilyn-monroe-vintage-car-nearby-burleigh-gold-coast-motel',
    'movie-world-wonder-woman-child-meet-greet-nearby-burleigh-gold-coast-motel',
    'movie-world-tweety-bird-family-photo-nearby-burleigh-gold-coast-motel',
    'sea-world-dolphin-leaping-lagoon-palm-trees-nearby-burleigh-gold-coast-motel',
    'sea-world-family-dolphin-interaction-lagoon-nearby-burleigh-gold-coast-motel',
    'sea-world-cruises-catamaran-aerial-group-gold-coast-nearby-burleigh-motel',
    'sea-world-dad-son-shark-tank-back-view-nearby-burleigh-gold-coast-motel',
    'sea-world-couple-snorkelling-coral-reef-underwater-nearby-burleigh-gold-coast-motel',
    'sea-world-spongebob-kid-high-five-bikini-bottom-nearby-burleigh-gold-coast-motel',
    'wet-n-wild-gold-coast-two-girls-wave-pool-nearby-burleigh-motel',
    'wet-n-wild-gold-coast-couple-tube-ride-nearby-burleigh-motel',
    'wet-n-wild-gold-coast-group-four-tube-ride-v1-nearby-burleigh-motel',
    'wet-n-wild-gold-coast-group-water-slide-nearby-burleigh-motel',
    'wet-n-wild-gold-coast-group-four-tube-ride-v2-nearby-burleigh-motel',
    'wet-n-wild-gold-coast-group-wave-pool-nearby-burleigh-motel',
  ].map((slug) => ({
    label: `See-do gallery — ${slug}`,
    source: `src/public_html/images/${slug}.webp`,
    destDir: 'src/public_html/images/see-do/gallery',
    slug,
    aspectRatio: '4:3',
    widths: LADDER_CARD,
    position: sharp.strategy.entropy,
  })),
];

/**
 * @param {string} aspectRatio
 * @returns {{ width: number, height: number }}
 */
function parseAspectRatio(aspectRatio) {
  const parts = aspectRatio.split(':').map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n) || n <= 0)) {
    throw new Error(`Invalid aspect ratio "${aspectRatio}". Use "16:9", "3:2", "21:9", or "4:3".`);
  }
  return { width: parts[0], height: parts[1] };
}

/**
 * @param {number} targetWidth
 * @param {string} aspectRatio
 * @returns {number}
 */
function targetHeight(targetWidth, aspectRatio) {
  const ratio = parseAspectRatio(aspectRatio);
  return Math.round((targetWidth * ratio.height) / ratio.width);
}

/**
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * @param {ImageTask} task
 * @returns {string}
 */
function resolveSourcePath(task) {
  const candidates = [];

  if (path.isAbsolute(task.source)) {
    candidates.push(task.source);
  } else {
    candidates.push(path.join(PROJECT_ROOT, task.source));
  }

  const legacyDir = path.join(PROJECT_ROOT, 'src', 'public_html', 'images');
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(path.join(legacyDir, `${task.slug}${ext}`));
  }

  const primary = path.join(PROJECT_ROOT, task.source);
  const sourceDir = path.dirname(primary);
  const sourceStem = path.parse(primary).name;
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(path.join(sourceDir, `${sourceStem}${ext}`));
  }

  const seen = new Set();
  for (const candidate of candidates) {
    const key = path.resolve(candidate);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Source not found for "${task.label}".\n`
    + `  Expected: ${task.source}\n`
    + `  Fallback: src/public_html/images/${task.slug}.{jpg|webp|png}`,
  );
}

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number} width
 * @param {number} height
 * @param {import('sharp').Position | import('sharp').Strategy} position
 * @param {'avif'|'webp'|'jpg'} format
 */
async function writeVariant(inputPath, outputPath, width, height, position, format) {
  let pipeline = sharp(inputPath, { failOn: 'none' })
    .rotate()
    .resize(width, height, {
      fit: 'cover',
      position,
      withoutEnlargement: false,
    });

  if (format === 'avif') {
    pipeline = pipeline.avif({ quality: FORMATS.avif.quality });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality: FORMATS.webp.quality });
  } else {
    pipeline = pipeline.jpeg({ quality: FORMATS.jpg.quality, mozjpeg: true });
  }

  await pipeline.toFile(outputPath);
}

/**
 * @param {ImageTask} task
 * @returns {Promise<number>}
 */
async function processTask(task) {
  const sourcePath = resolveSourcePath(task);
  const destDir = path.isAbsolute(task.destDir)
    ? task.destDir
    : path.join(PROJECT_ROOT, task.destDir);

  ensureDir(destDir);

  const position = task.position ?? sharp.strategy.entropy;
  let written = 0;

  console.log(`\n▶ ${task.label}`);
  console.log(`  Source : ${path.relative(PROJECT_ROOT, sourcePath)}`);
  console.log(`  Output : ${path.relative(PROJECT_ROOT, destDir)}/`);
  console.log(`  Crop   : ${task.aspectRatio} @ ${task.widths.join(', ')}w`);

  for (const width of task.widths) {
    const height = targetHeight(width, task.aspectRatio);
    const stem = `${task.slug}-${width}w`;

    for (const format of ['avif', 'webp', 'jpg']) {
      const outputPath = path.join(destDir, `${stem}.${format}`);
      await writeVariant(sourcePath, outputPath, width, height, position, format);
      written += 1;
      console.log(`  ✓ ${path.relative(PROJECT_ROOT, outputPath).replace(/\\/g, '/')} (${width}×${height})`);
    }
  }

  return written;
}

async function main() {
  console.log('BGCM image build — sharp responsive ladder export');
  console.log(`Tasks: ${TASKS.length}`);

  let totalFiles = 0;

  for (const task of TASKS) {
    totalFiles += await processTask(task);
  }

  console.log(`\nDone. ${totalFiles} optimised files written across ${TASKS.length} tasks.`);
}

main().catch((error) => {
  console.error('\nBuild failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

module.exports = {
  TASKS,
  LADDER_CARD,
  LADDER_HERO_BAND,
  LADDER_LISTING,
  LADDER_STRIP,
  LADDER_FEATURED,
  parseAspectRatio,
  targetHeight,
  processTask,
};
