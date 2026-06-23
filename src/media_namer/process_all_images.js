import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { SEO_KEYWORD_MAP } from './optimizeImages.js';

export { SEO_KEYWORD_MAP };

const RASTER_AND_WEBP = [...IMAGE_EXTENSIONS, '.webp'];
const MANIFEST_FILENAME = 'path-manifest.json';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(moduleDir, '../..');
const inputBaseDir = path.join(projectRoot, 'images');
const outputBaseDir = path.join(projectRoot, 'src', 'public_html', 'images');

function slugifySegment(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function dedupeHyphenSegments(slug) {
  const parts = slug.split('-').filter(Boolean);
  const seen = new Set();
  const deduped = [];

  for (const part of parts) {
    if (seen.has(part)) {
      continue;
    }
    seen.add(part);
    deduped.push(part);
  }

  return deduped.join('-');
}

function resolveKeywordPrefix(relativeDir, keywordMap) {
  const normalised = relativeDir.replace(/\\/g, '/').toLowerCase();
  const keys = Object.keys(keywordMap).sort((left, right) => right.length - left.length);

  for (const key of keys) {
    const keyLower = key.toLowerCase();
    if (normalised === keyLower || normalised.startsWith(`${keyLower}/`)) {
      return keywordMap[key];
    }
  }

  return GEO_ANCHOR;
}

/**
 * Builds a unique flat filename from keyword prefix and source stem.
 *
 * @param {string} keywordPrefix
 * @param {string} baseStem
 * @param {Set<string>} usedNames
 * @returns {string}
 */
export function assembleFlatFilename(keywordPrefix, baseStem, usedNames) {
  const stem = slugifySegment(cleanSEOName(baseStem, GEO_ANCHOR));
  const prefix = slugifySegment(keywordPrefix);
  let candidate = stem;

  if (!stem.includes(prefix) && !stem.includes('burleigh') && !stem.includes('motel')) {
    candidate = `${prefix}-${stem}`;
  }

  candidate = dedupeHyphenSegments(candidate);

  let finalName = candidate;
  let counter = 2;

  while (usedNames.has(finalName)) {
    finalName = `${candidate}-${counter}`;
    counter += 1;
  }

  usedNames.add(finalName);
  return `${finalName}.webp`;
}

function isProcessableImage(filePath) {
  return RASTER_AND_WEBP.includes(path.extname(filePath).toLowerCase());
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

    if (entry.isFile() && isProcessableImage(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function prepareOutputDir(outputDir) {
  await fs.ensureDir(outputDir);
  const entries = await fs.readdir(outputDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      await fs.remove(fullPath);
      continue;
    }

    if (entry.name !== LOGO_FILENAME && entry.name !== MANIFEST_FILENAME) {
      await fs.unlink(fullPath);
    }
  }
}

async function writeWebp(inputFilePath, outputFilePath) {
  await sharp(inputFilePath)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_REDUCTION_EFFORT })
    .resize({ width: MAX_IMAGE_WIDTH, fit: 'inside', withoutEnlargement: true })
    .toFile(outputFilePath);
}

async function writeLogo(inputFilePath, outputFilePath) {
  await sharp(inputFilePath)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outputFilePath);
}

function registerManifestEntry(manifest, sourceRelativePath, flatPublicPath) {
  const posixSource = sourceRelativePath.replace(/\\/g, '/');
  const withoutExt = posixSource.replace(/\.(jpe?g|png|webp)$/i, '');

  const keys = [
    `/images/${posixSource}`,
    `images/${posixSource}`,
    `/images/${withoutExt}.jpg`,
    `images/${withoutExt}.jpg`,
    `/images/${withoutExt}.jpeg`,
    `images/${withoutExt}.jpeg`,
    `/images/${withoutExt}.png`,
    `images/${withoutExt}.png`,
    `/images/${withoutExt}.webp`,
    `images/${withoutExt}.webp`,
  ];

  for (const key of keys) {
    manifest[key.toLowerCase()] = flatPublicPath;
  }
}

export async function processAllImages(
  inputDir,
  outputDir,
  targetFolders,
  keywordMap,
  log,
  warn,
) {
  if (!(await fs.pathExists(inputDir))) {
    throw new Error(`Source directory not found at: ${inputDir}`);
  }

  await prepareOutputDir(outputDir);

  const usedNames = new Set();
  const manifest = {};
  let processed = 0;
  let skipped = 0;

  for (const folder of targetFolders) {
    const sourceSubFolder = path.join(inputDir, folder);

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

      const relativePath = path.relative(inputDir, inputFilePath);
      const relativeDir = path.dirname(relativePath);
      const keywordPrefix = resolveKeywordPrefix(relativeDir, keywordMap);
      const flatFilename = assembleFlatFilename(
        keywordPrefix,
        path.parse(fileName).name,
        usedNames,
      );
      const outputFilePath = path.join(outputDir, flatFilename);
      const flatPublicPath = `/images/${flatFilename}`;

      await writeWebp(inputFilePath, outputFilePath);
      registerManifestEntry(manifest, relativePath, flatPublicPath);

      log(`Flattened: ${relativePath.replace(/\\/g, '/')} -> images/${flatFilename}`);
      processed += 1;
    }
  }

  const logoPath = path.join(inputDir, LOGO_FILENAME);
  if (await fs.pathExists(logoPath)) {
    await writeLogo(logoPath, path.join(outputDir, LOGO_FILENAME));
    log('Core brand logo saved to production image assets.');
  }

  await fs.writeJson(path.join(outputDir, MANIFEST_FILENAME), manifest, { spaces: 2 });

  return { processed, skipped, manifestEntries: Object.keys(manifest).length };
}

processAllImages(
  inputBaseDir,
  outputBaseDir,
  TARGET_FOLDERS,
  SEO_KEYWORD_MAP,
  console.log,
  console.warn
)
  .then((results) => {
    console.log(`\n✨ Pipeline Completed Successfully!`);
    console.log(`📊 Processed: ${results.processed} | Skipped: ${results.skipped} | Manifest Keys Generated: ${results.manifestEntries}`);
  })
  .catch((err) => {
    console.error(`\n❌ Pipeline Failed Execution:`, err.message);
    process.exit(1);
  });