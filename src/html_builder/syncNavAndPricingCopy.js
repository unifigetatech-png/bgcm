/**
 * syncNavAndPricingCopy.js
 * Normalises footer location links and homepage booking hooks.
 *
 * Usage: node src/html_builder/syncNavAndPricingCopy.js
 */

import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NAV_PATH_FIXES, normaliseNavigationPaths } from './navigation.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(moduleDir, '../..');

const REPLACEMENTS = [
  ...NAV_PATH_FIXES,
  [
    '<li><a href="/location/">Location &amp; directions</a></li>',
    '<li><a href="/location/">Location &amp; Directions</a></li>\n        <li><a href="/location/#interactive-map">Interactive Map Grid</a></li>',
  ],
  [
    '<li><a href="/location/">Location</a></li>\n        <li><a href="/contact/">Contact</a></li>',
    '<li><a href="/location/">Location &amp; Directions</a></li>\n        <li><a href="/location/#interactive-map">Interactive Map Grid</a></li>\n        <li><a href="/contact/">Contact</a></li>',
  ],
  [
    '<li><a href="/blog/">Blog</a></li><li><a href="/location/">Location</a></li><li><a href="/contact/">Contact</a></li>',
    '<li><a href="/blog/">Blog</a></li><li><a href="/location/">Location &amp; Directions</a></li><li><a href="/location/#interactive-map">Interactive Map Grid</a></li><li><a href="/contact/">Contact</a></li>',
  ],
];

const MAP_WRAP_MARKER = 'id="interactive-map"';

function collectHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, files);
      continue;
    }

    if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function syncContent(content, filePath) {
  let updated = normaliseNavigationPaths(content);

  for (const [find, replace] of REPLACEMENTS) {
    updated = updated.split(find).join(replace);
  }

  if (updated.includes('class="map-wrap map-wrap--embed"') && !updated.includes(MAP_WRAP_MARKER)) {
    updated = updated.replace(
      '<div class="map-wrap map-wrap--embed"',
      '<div id="interactive-map" class="map-wrap map-wrap--embed"',
    );
  }

  return updated;
}

function main() {
  const htmlFiles = [...new Set(collectHtmlFiles(projectRoot))];
  let changedFiles = 0;

  for (const filePath of htmlFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = syncContent(original, filePath);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changedFiles += 1;
      console.log(`Synced: ${path.relative(projectRoot, filePath)}`);
    }
  }

  console.log(`\nFiles updated: ${changedFiles}`);
  console.log(`HTML files scanned: ${htmlFiles.length}`);
}

main();
