import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** @type {Record<string, string>} */
const CSS_VERSIONS = {
  'chrome.css': '1.0.7',
  'home.css': '1.0.8',
  'rooms.css': '1.0.1',
  'blog.css': '1.0.3',
  'posts.css': '1.0.1',
  'see-do.css': '1.0.4',
};

function discoverHtmlFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...discoverHtmlFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function syncCssVersions(html) {
  return html.replace(
    /\/css\/(chrome|home|rooms|blog|posts|see-do)\.css\?v=[^"]+/g,
    (_match, sheet) => `/css/${sheet}.css?v=${CSS_VERSIONS[`${sheet}.css`]}`,
  );
}

const trees = [
  path.join(ROOT, 'src', 'public_html'),
  ROOT,
];

const htmlFiles = [...new Set(trees.flatMap((tree) => discoverHtmlFiles(tree)))];
let updated = 0;
const changes = [];

for (const file of htmlFiles.sort()) {
  const before = fs.readFileSync(file, 'utf8');
  const after = syncCssVersions(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    updated += 1;
    changes.push(path.relative(ROOT, file));
  }
}

console.log('Production CSS version sync');
console.log('Targets:', CSS_VERSIONS);
console.log(`\nUpdated ${updated} of ${htmlFiles.length} HTML templates.`);

if (changes.length > 0) {
  console.log('\nChanged files:');
  for (const file of changes) {
    console.log(`  ${file}`);
  }
}

const mismatches = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [sheet, version] of Object.entries(CSS_VERSIONS)) {
    const pattern = new RegExp(`/css/${sheet.replace('.', '\\.')}\\?v=([^"]+)`);
    const match = html.match(pattern);
    if (match && match[1] !== version) {
      mismatches.push(`${path.relative(ROOT, file)}: ${sheet}?v=${match[1]} (expected ${version})`);
    }
  }
}

if (mismatches.length > 0) {
  console.error('\nRemaining mismatches:');
  for (const line of mismatches) {
    console.error(`  ${line}`);
  }
  process.exitCode = 1;
} else {
  console.log('\nVerification passed — all referenced stylesheet versions match production tokens.');
}

export { CSS_VERSIONS, syncCssVersions, discoverHtmlFiles };
