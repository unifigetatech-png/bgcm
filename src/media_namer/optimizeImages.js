import fs from 'fs-extra';
import path from 'node:path';
import sharp from 'sharp';
import { cleanSEOName } from './cleanSEOName.js';
import { hasBannedTerm } from './bannedTerms.js';
import {
  BANNED_TERMS,
  GEO_ANCHOR,
  IMAGE_EXTENSIONS,
  LOGO_FILENAME,
  MAX_IMAGE_WIDTH,
  TARGET_FOLDERS,
  WEBP_QUALITY,
  WEBP_REDUCTION_EFFORT,
} from './constants.js';

/**
 * Maps source folder prefixes (under /images/) to Pro-SEO keyword slugs.
 * Longest matching prefix wins during filename assembly.
 */
export const SEO_KEYWORD_MAP = {
  // --- CORE PROPERTY KEYS ---
  'motel/rooms/interconnecting': 'burleigh-gold-coast-motel-interconnecting-family-group-accommodation',
  'motel/rooms/family': 'family-accommodation-gold-coast-motel-rooms',
  'motel/rooms/quad': 'quad-room-accommodation-burleigh-heads-motel',
  'motel/rooms/triple-upstairs': 'triple-upstairs-room-accommodation-burleigh-heads',
  'motel/rooms/triple-ground-floor': 'triple-ground-floor-room-accommodation-no-stairs',
  'motel/rooms/double': 'double-queen-room-accommodation-burleigh-heads',
  'motel/rooms/bathrooms': 'burleigh-gold-coast-motel-ensuite-bathroom-cooking-facilities',
  'motel/rooms': 'budget-motel-rooms-burleigh-heads-accommodation',
  'motel/exterior': 'burleigh-gold-coast-motel-exterior-free-vehicle-parking',
  'motel/pool': 'burleigh-gold-coast-motel-swimming-pool-sun-lounges',
  'motel': 'burleigh-gold-coast-motel-accommodation-near-beach',

  // --- CORPORATE & CONTRACTOR AUDIENCE ---
  'corporate-long-stay': 'corporate-accommodation-group-bookings-long-stay-motel-gold-coast',
  'infrastructure-crews': 'john-holland-crew-contractor-accommodation-gold-coast-ute-parking',

  // --- THEME PARKS PRECINCT ---
  'theme-parks/movie-world': 'movie-world-accommodation-gold-coast-holiday-stay',
  'theme-parks/sea-world': 'sea-world-accommodation-gold-coast-holiday-stay',
  'theme-parks/wet-wild': 'wet-n-wild-accommodation-gold-coast-holiday-stay',
  'theme-parks': 'gold-coast-theme-park-accommodation-guide-burleigh',

  // --- TARGET HIGH-TRAFFIC EVENTS PRECINCT ---
  'events/cooly-rocks-on': 'cooly-rocks-on-festival-accommodation-gold-coast',
  'events/blues-on-broadbeach': 'blues-on-broadbeach-festival-accommodation-gold-coast',
  'events/gc-marathon': 'gold-coast-marathon-accommodation-burleigh-heads',
  'events/supercars-500': 'supercars-500-surfers-paradise-accommodation-gold-coast',
  'events/schoolies': 'schoolies-gold-coast-budget-motel-accommodation',
  'events/sea-world-carnivale': 'sea-world-carnivale-accommodation-near-burleigh-heads',
  'events/surface-festival': 'surface-festival-miami-art-accommodation-gold-coast',

  // --- LOCAL REGIONAL ATTRACTIONS & WALKS ---
  'local/burleigh': 'burleigh-heads-beach-attractions-gold-coast',
  'local/kirra': 'kirra-beach-point-break-surfing-gold-coast',
  'local/hota-broadbeach': 'hota-broadbeach-arts-entertainment-gold-coast',
  'local/pacific fair': 'pacific-fair-shopping-centre-broadbeach-gold-coast',
  'local/marketta': 'miami-marketta-street-food-night-markets',
  'local/tarte-bakery': 'tarte-bakery-miami-best-breakfast-near-motel',
  'local/curtis-falls': 'curtis-falls-tamborine-mountain-rainforest-walk',
  'local/hinterland': 'gold-coast-hinterland-scenic-day-trips',
  'local/main-beach': 'main-beach-surf-dining-precinct-gold-coast',
  'local/surfers-paradise': 'surfers-paradise-cavill-avenue-nightlife-gold-coast',
  'local': 'gold-coast-local-guide-near-burleigh-motel',
  'teq-queensland': 'queensland-gold-coast-tourism-near-burleigh-motel',
};

function isRasterImage(filePath) {
  return IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

async function collectImageFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectImageFiles(fullPath));
      continue;
    }

    if (entry.isFile() && isRasterImage(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimiseRasterImage(inputFilePath, outputFilePath) {
  await fs.ensureDir(path.dirname(outputFilePath));

  await sharp(inputFilePath)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_REDUCTION_EFFORT })
    .resize({ width: MAX_IMAGE_WIDTH, fit: 'inside', withoutEnlargement: true })
    .toFile(outputFilePath);
}

async function optimiseLogo(inputFilePath, outputFilePath) {
  await fs.ensureDir(path.dirname(outputFilePath));

  await sharp(inputFilePath)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outputFilePath);
}

/**
 * Converts source rasters to WebP with SEO-friendly filenames under outputBaseDir.
 *
 * @param {string} inputBaseDir - Root images directory
 * @param {string} outputBaseDir - Production output directory
 * @param {string[]} targetFolders - Top-level category folders to process
 * @param {function(string): void} log - Info logger
 * @param {function(string): void} warn - Warning logger
 * @returns {Promise<{ optimised: number, skipped: number }>}
 */
export async function optimizeAllFolders(
  inputBaseDir,
  outputBaseDir,
  targetFolders,
  log,
  warn,
) {
  if (!(await fs.pathExists(inputBaseDir))) {
    throw new Error(`Source directory not found at: ${inputBaseDir}`);
  }

  let optimised = 0;
  let skipped = 0;

  for (const folder of targetFolders) {
    const sourceSubFolder = path.join(inputBaseDir, folder);
    const outputSubFolder = path.join(outputBaseDir, folder.toLowerCase());

    if (!(await fs.pathExists(sourceSubFolder))) {
      log(`Skipping missing folder: ${folder}`);
      continue;
    }

    const files = await collectImageFiles(sourceSubFolder);
    log(`Processing folder: ${folder} (${files.length} images)`);

    for (const inputFilePath of files) {
      const fileName = path.basename(inputFilePath);

      if (hasBannedTerm(fileName, BANNED_TERMS)) {
        warn(`"${fileName}" contains a banned marketing term. Skipping to maintain accuracy.`);
        skipped += 1;
        continue;
      }

      const relativePath = path.relative(sourceSubFolder, inputFilePath);
      const relativeDir = path.dirname(relativePath);
      const cleanName = cleanSEOName(path.parse(fileName).name, GEO_ANCHOR);
      const outputDir = relativeDir === '.'
        ? outputSubFolder
        : path.join(outputSubFolder, relativeDir);
      const outputFilePath = path.join(outputDir, `${cleanName}.webp`);

      await optimiseRasterImage(inputFilePath, outputFilePath);
      log(`Optimised: images/${folder.toLowerCase()}/${path.join(relativeDir, `${cleanName}.webp`).replace(/\\/g, '/')}`);
      optimised += 1;
    }
  }

  const logoPath = path.join(inputBaseDir, LOGO_FILENAME);
  if (await fs.pathExists(logoPath)) {
    await optimiseLogo(logoPath, path.join(outputBaseDir, LOGO_FILENAME));
    log('Core brand logo saved to production image assets.');
  }

  return { optimised, skipped };
}

export { TARGET_FOLDERS };
