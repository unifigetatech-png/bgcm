import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PHONE_ARIA = 'Call Burleigh Gold Coast Motel on (07) 5576 3211';
const BOOK_HEADER_ARIA = 'Check availability and book direct from $125 per night';

/** @type {Record<string, string[]>} */
const report = {};

function note(file, change) {
  const rel = path.relative(ROOT, file);
  if (!report[rel]) {
    report[rel] = [];
  }
  report[rel].push(change);
}

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

function normalizeSkipLink(html, file) {
  const next = html.replace(
    /<a href="#(?:main|article|main-content)" class="skip-link">[^<]*<\/a>/g,
    '<a href="#main-content" class="skip-link">Skip to main content</a>',
  );
  if (next !== html) {
    note(file, 'skip-link → #main-content');
  }
  return next;
}

function demoteNestedMain(html, file) {
  let next = html.replace(
    /<main class="article-main">([\s\S]*?)<\/main>/g,
    '<div class="article-main">$1</div>',
  );
  if (next !== html) {
    note(file, 'article-main: main → div');
  }
  html = next;

  next = html.replace(
    /<main class="policy">([\s\S]*?)<\/main>/g,
    '<div class="policy">$1</div>',
  );
  if (next !== html) {
    note(file, 'policy: main → div');
  }
  return next;
}

function fixStandaloneMainId(html, file) {
  const next = html.replace(/<main id="main">/g, '<main id="main-content">');
  if (next !== html) {
    note(file, '404/main landmark id → main-content');
  }
  return next;
}

function stripSectionMainRole(html, file) {
  let next = html;
  const before = next;
  next = next.replace(/\s+id="main"\s+role="main"/g, '');
  next = next.replace(/\s+role="main"\s+id="main"/g, '');
  next = next.replace(/(<section[^>]*?)\s+id="main"(?=[\s>])/g, '$1');
  if (next !== before) {
    note(file, 'removed legacy id="main" role="main" from sections');
  }
  return next;
}

function insertMainLandmark(html, file) {
  if (html.includes('<main id="main-content">')) {
    return html;
  }

  let next = html;
  const mobileNavMatch = next.match(/<nav class="nav-mobile"[\s\S]*?<\/nav>/);
  if (mobileNavMatch) {
    const insertAt = mobileNavMatch.index + mobileNavMatch[0].length;
    next = `${next.slice(0, insertAt)}\n\n<main id="main-content">${next.slice(insertAt)}`;
    note(file, 'inserted <main id="main-content"> after mobile nav');
  } else {
    next = next.replace(/<\/header>\s*/, '</header>\n\n<main id="main-content">\n');
    note(file, 'inserted <main id="main-content"> after header');
  }

  if (!next.includes('</main>\n<footer') && !next.includes('</main>\r\n<footer')) {
    next = next.replace(/(\s*)<footer/, '\n</main>$1<footer');
    note(file, 'closed </main> before footer');
  }

  return next;
}

function applyChromeSemantics(html, file) {
  let next = html;

  if (next.includes('<header>') && !next.includes('class="site-header"')) {
    next = next.replace(/<header>/g, '<header class="site-header">');
    note(file, 'header → site-header');
  }

  if (next.includes('aria-label="Main navigation"')) {
    next = next.replace(/aria-label="Main navigation"/g, 'aria-label="Main Navigation"');
    note(file, 'nav aria-label → Main Navigation');
  }

  if (next.includes('<footer role="contentinfo">') && !next.includes('class="site-footer"')) {
    next = next.replace(/<footer role="contentinfo">/g, '<footer class="site-footer" role="contentinfo">');
    note(file, 'footer → site-footer');
  }

  if (next.includes('<footer>') && !next.includes('class="site-footer"')) {
    next = next.replace(/<footer>/g, '<footer class="site-footer">');
    note(file, 'footer → site-footer');
  }

  if (next.includes('<footer aria-label="Site footer">') && !next.includes('class="site-footer"')) {
    next = next.replace(
      /<footer aria-label="Site footer">/g,
      '<footer class="site-footer" aria-label="Site footer">',
    );
    note(file, 'footer → site-footer');
  }

  return next;
}

function applyInteractiveSemantics(html, file) {
  let next = html;

  if (next.includes('id="navHamburger"') && !next.includes('aria-controls="navMobile"')) {
    next = next.replace(
      /(<button class="nav-hamburger" id="navHamburger"[^>]*)(>)/g,
      '$1 aria-controls="navMobile"$2',
    );
    note(file, 'hamburger aria-controls=navMobile');
  }

  if (next.includes('class="nav-mobile"') && !next.includes('role="region"')) {
    next = next.replace(
      /<nav class="nav-mobile" id="navMobile"/g,
      '<nav class="nav-mobile" id="navMobile" role="region"',
    );
    note(file, 'mobile nav role=region');
  }

  const dropdownBefore = next;
  next = next.replace(
    /<div class="nav-has-dropdown">\s*<a href="([^"]+)"(?![^>]*aria-haspopup)/g,
    '<div class="nav-has-dropdown">\n      <a href="$1" aria-haspopup="true"',
  );
  if (next !== dropdownBefore) {
    note(file, 'nav dropdown aria-haspopup=true');
  }

  const headerPhoneBefore = next;
  next = next.replace(
    /<a href="tel:\+61755763211" class="header-phone" data-track="phone" data-source="header">/g,
    `<a href="tel:+61755763211" class="header-phone" data-track="phone" data-source="header" aria-label="${PHONE_ARIA}">`,
  );
  if (next !== headerPhoneBefore) {
    note(file, 'header phone aria-label');
  }

  const mobilePhoneBefore = next;
  next = next.replace(
    /<a href="tel:\+61755763211" data-track="phone" data-source="mobile-nav">/g,
    `<a href="tel:+61755763211" data-track="phone" data-source="mobile-nav" aria-label="${PHONE_ARIA}">`,
  );
  if (next !== mobilePhoneBefore) {
    note(file, 'mobile nav phone aria-label');
  }

  const bookBefore = next;
  next = next.replace(
    /<button class="btn-gold" data-open-booking="header"(?![^>]*aria-label)[^>]*>Book Now<\/button>/g,
    `<button class="btn-gold" data-open-booking="header" aria-label="${BOOK_HEADER_ARIA}">Book Now</button>`,
  );
  if (next !== bookBefore) {
    note(file, 'header Book Now aria-label');
  }

  return next;
}

function normalizeDisplayLabels(html, file) {
  let next = html;
  const before = next;
  next = next.replace(
    /<div class="(section-label|gallery-label|faq-label|featured-label)"([^>]*)>([^<]*)<\/div>/g,
    '<p class="$1"$2>$3</p>',
  );
  if (next !== before) {
    note(file, 'display labels: div → p');
  }
  return next;
}

function auditPictureAlts(html, file) {
  const issues = [];
  const pictureBlocks = html.match(/<picture>[\s\S]*?<\/picture>/g) ?? [];
  for (const block of pictureBlocks) {
    const imgMatch = block.match(/<img\b[^>]*>/);
    if (!imgMatch) {
      continue;
    }
    const tag = imgMatch[0];
    if (!/\salt=/.test(tag)) {
      issues.push('picture img missing alt attribute');
    } else if (/\salt=""/.test(tag)) {
      issues.push('picture img has empty alt (verify decorative intent)');
    }
  }
  if (issues.length > 0) {
    note(file, `alt audit: ${issues.join('; ')}`);
  }
  return issues;
}

function migrateFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = normalizeSkipLink(html, file);
  html = demoteNestedMain(html, file);
  html = fixStandaloneMainId(html, file);
  html = stripSectionMainRole(html, file);
  html = insertMainLandmark(html, file);
  html = applyChromeSemantics(html, file);
  html = applyInteractiveSemantics(html, file);
  html = normalizeDisplayLabels(html, file);
  auditPictureAlts(html, file);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
  }
}

const trees = [path.join(ROOT, 'src', 'public_html'), ROOT];
const htmlFiles = [...new Set(trees.flatMap((tree) => discoverHtmlFiles(tree)))].sort();

/** @type {string[]} */
const altIssues = [];

for (const file of htmlFiles) {
  migrateFile(file);
}

let updated = 0;
for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file);
  if (report[rel]?.length) {
    updated += 1;
  }
}

console.log('Accessibility & semantic HTML migration');
console.log(`Scanned ${htmlFiles.length} templates, updated ${updated}.\n`);

for (const [file, changes] of Object.entries(report).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${file}`);
  for (const change of changes) {
    console.log(`  · ${change}`);
  }
}

const verify = {
  skipMainContent: 0,
  siteHeader: 0,
  siteFooter: 0,
  mainLandmark: 0,
  pictureEmptyAlt: 0,
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('href="#main-content"')) {
    verify.skipMainContent += 1;
  }
  if (html.includes('class="site-header"')) {
    verify.siteHeader += 1;
  }
  if (html.includes('class="site-footer"')) {
    verify.siteFooter += 1;
  }
  if (html.includes('id="main-content"')) {
    verify.mainLandmark += 1;
  }
  const blocks = html.match(/<picture>[\s\S]*?<\/picture>/g) ?? [];
  for (const block of blocks) {
    const img = block.match(/<img\b[^>]*>/)?.[0] ?? '';
    if (/\salt=""/.test(img)) {
      verify.pictureEmptyAlt += 1;
    }
  }
}

console.log('\nVerification:');
console.log(`  skip-link #main-content: ${verify.skipMainContent}/${htmlFiles.length}`);
console.log(`  site-header: ${verify.siteHeader}/${htmlFiles.length}`);
console.log(`  site-footer: ${verify.siteFooter}/${htmlFiles.length}`);
console.log(`  main id="main-content": ${verify.mainLandmark}/${htmlFiles.length}`);
console.log(`  picture imgs with empty alt: ${verify.pictureEmptyAlt}`);

export { discoverHtmlFiles, migrateFile };
