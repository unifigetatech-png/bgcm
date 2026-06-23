/**
 * fixMediaIssues.js
 * Burleigh Gold Coast Motel — BGCM
 *
 * One-time fix pass for all issues identified in media-audit.csv:
 *   1. Truncated filename: burleigh-heads-mote.webp → burleigh-heads-motel.webp
 *   2. Thin/generic alt texts upgraded to keyword-rich en-AU versions
 *   3. BBQ mentions in alt text replaced with brand-compliant phrasing
 *
 * Usage:
 *   node src/seo_analyzer/fixMediaIssues.js
 *   npm run fix:media
 *
 * Safe to re-run — only patches exact matches, leaves all other content untouched.
 */

const fs = require('fs-extra');
const path = require('path');

const moduleDir = __dirname;
const projectRoot = path.join(moduleDir, '../..');
const publicDir = path.join(projectRoot, 'src', 'public_html');

// ─── Fix 1: Truncated filenames ──────────────────────────────────────────────
// Simple string replace across entire file content (safe — unique substring).

const FILENAME_FIXES = [
  {
    find: 'burleigh-heads-mote.webp',
    replace: 'burleigh-heads-motel.webp',
    description: 'Interconnecting room slug truncated (mote → motel)',
  },
];

// ─── Fix 2 & 3: Alt text upgrades ───────────────────────────────────────────
// Format: { slug, oldAlt, newAlt }
// Matches by img slug + exact old alt — surgical, no collateral changes.
// Includes BBQ brand-compliance fixes (lines 70, 140 in audit).

const ALT_UPGRADES = [
  {
    slug: 'burleigh-motel-mural-full-facade-gold-coast-highway-miami.webp',
    oldAlt: 'Burleigh Gold Coast Motel facade',
    newAlt: 'Burleigh Gold Coast Motel mural facade on the Gold Coast Highway, Miami QLD',
  },
  {
    slug: 'burleigh-heads-beach-surfers-families-gold-coast-skyline-motel.webp',
    oldAlt: 'Burleigh Heads beach',
    newAlt: 'Burleigh Heads beach with surfers and the Gold Coast skyline — 200m from Burleigh Gold Coast Motel',
  },
  {
    slug: 'burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp',
    oldAlt: 'Burleigh Gold Coast Motel exterior',
    newAlt: 'Burleigh Gold Coast Motel exterior street view — 1908 Gold Coast Highway, Miami QLD',
  },
  {
    slug: 'surfers-burleigh-heads-headland-ocean-skyline-golden-hour-gold-coast-motel.webp',
    oldAlt: 'Surfers at Burleigh headland',
    newAlt: 'Surfers at Burleigh Heads headland at golden hour with the Gold Coast skyline behind',
  },
  {
    slug: 'surfers-burleigh-heads-headland-ocean-skyline-golden-hour-gold-coast-motel.webp',
    oldAlt: 'Burleigh Heads surfers and skyline',
    newAlt: 'Surfers at Burleigh Heads headland at golden hour with the Gold Coast skyline behind',
  },
  {
    slug: 'movie-world-family-entrance-gate-nearby-burleigh-gold-coast-motel.webp',
    oldAlt: 'Family at Movie World entrance',
    newAlt: 'Family at Warner Bros. Movie World entrance gate Gold Coast — near Burleigh Gold Coast Motel',
  },
  {
    slug: 'family-picnic-bench-beach-surf-lifesaving-flags-nearby-burleigh-gold-coast-motel.webp',
    oldAlt: 'Family cooking at a free gas BBQ in John Laws Park, Burleigh Heads foreshore',
    newAlt: 'Family using the free outdoor cooking area at John Laws Park, Burleigh Heads foreshore',
  },
  {
    slug: 'family-picnic-bench-beach-surf-lifesaving-flags-nearby-burleigh-gold-coast-motel.webp',
    oldAlt: 'Family cooking at the free John Laws Park BBQ area in Burleigh Heads with surf flags visible',
    newAlt: 'Family at the free outdoor cooking area in John Laws Park, Burleigh Heads — surf lifesaving flags visible',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Replace alt text within <img> tags that contain the given slug.
 * Targets the exact `alt="oldAlt"` string — no DOM parse overhead, no serialisation risk.
 */
function upgradeAlt(html, slug, oldAlt, newAlt) {
  let count = 0;
  const result = html.replace(/<img\b[^>]*>/gi, (imgTag) => {
    if (!imgTag.includes(slug)) {
      return imgTag;
    }
    if (!imgTag.includes(`alt="${oldAlt}"`)) {
      return imgTag;
    }
    count += 1;
    return imgTag.replace(`alt="${oldAlt}"`, `alt="${newAlt}"`);
  });
  return { html: result, count };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function fixMediaIssues() {
  const htmlFiles = await collectHtmlFiles(publicDir);
  console.log(`Scanning ${htmlFiles.length} HTML files for known issues…\n`);

  let totalFilenameRefs = 0;
  let totalAltUpgrades = 0;
  let filesModified = 0;

  for (const filePath of htmlFiles) {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    const relPath = path.relative(publicDir, filePath);

    for (const { find, replace, description } of FILENAME_FIXES) {
      if (content.includes(find)) {
        const occurrences = content.split(find).length - 1;
        content = content.split(find).join(replace);
        console.log(`  Filename [${description}]`);
        console.log(`     ${relPath} (${occurrences} ref${occurrences > 1 ? 's' : ''})`);
        totalFilenameRefs += occurrences;
        modified = true;
      }
    }

    for (const { slug, oldAlt, newAlt } of ALT_UPGRADES) {
      const { html: updated, count } = upgradeAlt(content, slug, oldAlt, newAlt);
      if (count > 0) {
        content = updated;
        console.log(`  Alt upgraded in ${relPath}`);
        console.log(`     Slug:    ${slug}`);
        console.log(`     Before:  "${oldAlt}"`);
        console.log(`     After:   "${newAlt}"`);
        totalAltUpgrades += count;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      filesModified += 1;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log('Fix pass complete');
  console.log(`   HTML files scanned:      ${htmlFiles.length}`);
  console.log(`   Files modified:           ${filesModified}`);
  console.log(`   Filename refs corrected:  ${totalFilenameRefs}`);
  console.log(`   Alt texts upgraded:       ${totalAltUpgrades}`);
  console.log('\nNext step: npm run export:media-csv to regenerate the clean audit list.');
}

fixMediaIssues().catch((err) => {
  console.error('Fix pass failed:', err.message);
  process.exit(1);
});
