/**
 * exportMediaCSV.js
 * Burleigh Gold Coast Motel — BGCM
 *
 * Scans all HTML files in src/public_html/, extracts every image reference
 * (<img> tags and CSS background-image), and writes a full audit CSV.
 *
 * Usage:
 *   node src/seo_analyzer/exportMediaCSV.js
 *   npm run export:media-csv
 *
 * Output:
 *   media-audit.csv  (written to project root)
 */

const fs = require('fs-extra');
const path = require('path');
const { DOMParser } = require('linkedom');

// ─── Paths ───────────────────────────────────────────────────────────────────

const moduleDir = __dirname;
const projectRoot = path.join(moduleDir, '../..');
const publicDir = path.join(projectRoot, 'src', 'public_html');
const manifestPath = path.join(publicDir, 'images', 'path-manifest.json');
const outputPath = path.join(projectRoot, 'media-audit.csv');
const LIVE_BASE = 'https://burleighmotel.com.au';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape a CSV cell value */
function csvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert local file path to a live URL */
function toLiveUrl(filePath) {
  const rel = path.relative(publicDir, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') {
    return `${LIVE_BASE}/`;
  }
  const clean = rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
  return `${LIVE_BASE}/${clean}`;
}

/** Convert local file path to a readable page label */
function toPageLabel(filePath) {
  return path.relative(publicDir, filePath).replace(/\\/g, '/');
}

/** Extract just the filename slug from a src string */
function extractSlug(src) {
  if (!src) {
    return '';
  }
  return path.basename(src.split('?')[0]);
}

/** Extract background-image URLs from inline style attributes */
function extractBgImages(element) {
  const style = element.getAttribute('style') || '';
  const matches = [...style.matchAll(/background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi)];
  return matches.map((match) => match[1]);
}

/** Recursively collect all HTML files */
async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function exportMediaCSV() {
  let manifest = {};
  if (await fs.pathExists(manifestPath)) {
    manifest = await fs.readJson(manifestPath);
  } else {
    console.warn('path-manifest.json not found — in_manifest column will be empty.');
  }

  const manifestLookup = {};
  for (const [key, val] of Object.entries(manifest)) {
    manifestLookup[key.toLowerCase()] = val;
  }

  const htmlFiles = await collectHtmlFiles(publicDir);
  console.log(`Scanning ${htmlFiles.length} HTML files…`);

  const header = [
    'page_path',
    'page_live_url',
    'image_type',
    'image_src',
    'image_slug',
    'alt_text',
    'alt_status',
    'in_manifest',
    'manifest_public_path',
  ];

  const rows = [header.map(csvCell).join(',')];
  let imgCount = 0;
  let bgCount = 0;

  for (const filePath of htmlFiles) {
    const pageLabel = toPageLabel(filePath);
    const pageLiveUrl = toLiveUrl(filePath);

    const html = await fs.readFile(filePath, 'utf-8');
    const document = new DOMParser().parseFromString(html, 'text/html');

    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const src = (img.getAttribute('src') || '').trim();
      const alt = img.getAttribute('alt');
      const slug = extractSlug(src);

      const altStatus = alt === null
        ? 'MISSING'
        : alt.trim() === ''
          ? 'EMPTY'
          : 'OK';

      const srcKey = src.toLowerCase();
      const inManifest = srcKey in manifestLookup ? 'YES' : 'NO';
      const manifestPubPath = manifestLookup[srcKey] || '';

      rows.push([
        pageLabel,
        pageLiveUrl,
        'img_tag',
        src,
        slug,
        alt ?? '',
        altStatus,
        inManifest,
        manifestPubPath,
      ].map(csvCell).join(','));

      imgCount += 1;
    }

    const allElements = document.querySelectorAll('[style]');
    for (const el of allElements) {
      const bgUrls = extractBgImages(el);
      for (const src of bgUrls) {
        const slug = extractSlug(src);
        const srcKey = src.toLowerCase();
        const inManifest = srcKey in manifestLookup ? 'YES' : 'NO';
        const manifestPubPath = manifestLookup[srcKey] || '';

        rows.push([
          pageLabel,
          pageLiveUrl,
          'background_image',
          src,
          slug,
          '',
          'N/A',
          inManifest,
          manifestPubPath,
        ].map(csvCell).join(','));

        bgCount += 1;
      }
    }
  }

  await fs.writeFile(outputPath, rows.join('\n'), 'utf-8');

  console.log('\nmedia-audit.csv written to project root');
  console.log(`   Rows: ${rows.length - 1} total`);
  console.log(`   <img> tags:          ${imgCount}`);
  console.log(`   background-image:    ${bgCount}`);
  console.log(`   HTML files scanned:  ${htmlFiles.length}`);
  console.log('\n   Open media-audit.csv in Excel or Google Sheets.');
}

exportMediaCSV().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
