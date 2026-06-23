/**
 * Syncs transport section HTML and CSS from html_builder into homepage templates.
 *
 * Usage: node src/html_builder/syncTransportSection.js
 */

import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateTransportSectionHtml,
  generateTransportSectionStyles,
  generateTransportSectionResponsiveStyles,
} from './transportSection.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(moduleDir, '../..');

const TARGET_FILES = [
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'src', 'public_html', 'index.html'),
];

const HTML_START = '<!-- ▼ CONTENT: location-strip ▼ -->';
const HTML_END = '<!-- ▲ END CONTENT: location-strip ▲ -->';
const CSS_START = '/* ── TRANSPORT & MAP SPLIT ── */';
const CSS_END = '/* ── LOCATION SPLIT (legacy alias) ── */';
const RESPONSIVE_MARKER = '  .transport-section-wrapper{flex-direction:column;';
const LEGACY_RESPONSIVE_MARKER = '  .transport-section-wrapper{grid-template-columns:1fr;';

function replaceBetween(content, startMarker, endMarker, replacement, includeEnd) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Markers not found: ${startMarker} … ${endMarker}`);
  }

  const endPos = includeEnd ? endIndex + endMarker.length : endIndex;
  return `${content.slice(0, startIndex)}${replacement}${content.slice(endPos)}`;
}

function replaceResponsiveBlock(content) {
  const blockStart = content.indexOf(RESPONSIVE_MARKER) !== -1
    ? content.indexOf(RESPONSIVE_MARKER)
    : content.indexOf(LEGACY_RESPONSIVE_MARKER);
  if (blockStart === -1) {
    throw new Error('Responsive transport styles marker not found.');
  }

  const blockEnd = content.indexOf('\n  .location-split{', blockStart);
  if (blockEnd === -1) {
    throw new Error('End of responsive transport block not found.');
  }

  return `${content.slice(0, blockStart)}${generateTransportSectionResponsiveStyles()}${content.slice(blockEnd)}`;
}

function syncFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = replaceBetween(
    content,
    HTML_START,
    HTML_END,
    generateTransportSectionHtml(),
    true,
  );

  content = replaceBetween(
    content,
    CSS_START,
    CSS_END,
    `${generateTransportSectionStyles()}\n\n`,
    false,
  );

  content = replaceResponsiveBlock(content);

  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  for (const filePath of TARGET_FILES) {
    if (!fs.pathExistsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }

    syncFile(filePath);
    console.log(`Synced transport section: ${path.relative(projectRoot, filePath)}`);
  }
}

main();
