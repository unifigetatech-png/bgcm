/**
 * alignBookingCopy.js
 * Replaces legacy "best price" hooks with direct-booking certainty copy.
 *
 * Usage: node src/seo_analyzer/alignBookingCopy.js
 */

const fs = require('fs-extra');
const path = require('path');

const moduleDir = __dirname;
const projectRoot = path.join(moduleDir, '../..');

const DIRECT_BOOKING_CTA = 'Book direct for instant confirmation, guaranteed courtyard parking, and seasonal room availability — rooms are limited.';
const DIRECT_BOOKING_SHORT = 'Direct booking · courtyard parking confirmed · rooms are limited in peak season';
const HERO_CTA_SUB = 'No resort fees · No booking fees · Instant confirmation and courtyard parking when you book direct';

const REPLACEMENTS = [
  ['Best price guaranteed when booked direct. No platform fees.', 'Direct booking confirmed. Guaranteed courtyard parking when you book with us. No platform fees.'],
  ['Best price guaranteed when you book direct. No platform fees.', 'Direct booking confirmed. Guaranteed courtyard parking when you book with us. No platform fees.'],
  ['No platform fees, no resort fees. Best price guaranteed when booked direct.', 'No platform fees, no resort fees. Direct booking with guaranteed courtyard parking and instant confirmation.'],
  ['No platform fees, no resort fees. Best price guaranteed when booked direct.', 'No platform fees, no resort fees. Direct booking with guaranteed courtyard parking and instant confirmation.'],
  ['<strong>No booking platform fees.</strong> No resort fees. No mark-up sitting between you and your room. Best price guaranteed when you book direct — if you find a lower public rate elsewhere, call us and we\'ll match it.', '<strong>No booking platform fees.</strong> No resort fees. Book direct for instant confirmation, guaranteed courtyard parking, and seasonal room availability — rooms are limited in peak season.'],
  ['Best price guaranteed when you book direct. No booking fees, no third-party markup, instant confirmation.', 'Book direct for instant confirmation, guaranteed courtyard parking, and no third-party markup. Rooms are limited during peak seasons.'],
  ['Book direct through our website for the best price — no booking fees and no third-party markup.', 'Book direct through our website for instant confirmation, guaranteed courtyard parking, and no third-party markup'],
  [' for the best price — no booking fees, no third-party markup', ' for instant confirmation, guaranteed courtyard parking, and no third-party markup'],
  ['aria-label="Open booking and book direct for the best price"', 'aria-label="Open booking for instant confirmation and guaranteed courtyard parking"'],
  ['<span class="room-hero-price-note">Best price<br>booked direct</span>', '<span class="room-hero-price-note">Book direct<br>courtyard parking</span>'],
  ['<p class="hero-cta-sub">No resort fees · No booking fees · Best price when you book direct</p>', `<p class="hero-cta-sub">${HERO_CTA_SUB}</p>`],
  ['<p>Best price when you book direct — no booking fees, no surprises.</p>', `<p>${DIRECT_BOOKING_CTA}</p>`],
  ['<p>Best price when you book direct.</p>', `<p>${DIRECT_BOOKING_CTA}</p>`],
  ['<p>Best price guaranteed. Free parking. Motel pool. 30 min to Wet\'n\'Wild.</p>', '<p>Direct booking · courtyard parking confirmed. Motel pool. 30 min to Wet\'n\'Wild.</p>'],
  ['<p>Best price guaranteed. Free parking. Pool. 30 min to Movie World.</p>', '<p>Direct booking · courtyard parking confirmed. Pool. 30 min to Movie World.</p>'],
  ['<p>Best price guaranteed. Free parking. Pool. 25 min to Sea World.</p>', '<p>Direct booking · courtyard parking confirmed. Pool. 25 min to Sea World.</p>'],
  ['<p>Best price guaranteed. Free parking. Pool. Walk to two beaches.</p>', '<p>Direct booking · courtyard parking confirmed. Pool. Walk to two beaches.</p>'],
  ['<p>Best price guaranteed · Free parking · Outdoor pool · Walk to the beach</p>', `<p>${DIRECT_BOOKING_SHORT} · Outdoor pool · Walk to the beach</p>`],
  ['<div class="aside-heading">Best price guaranteed</div>', '<div class="aside-heading">Direct booking · courtyard parking</div>'],
  ['<span>from $125 · best price guaranteed</span>', '<span>from $125 · instant confirmation · courtyard parking</span>'],
  ['. Best price when you book direct.', '. Book direct for instant confirmation and guaranteed courtyard parking.'],
  ['Book direct for best price.', 'Book direct for guaranteed courtyard parking and instant confirmation.'],
  ['Book direct for best rate.', 'Book direct for instant confirmation and courtyard parking.'],
  ['per night · best price direct', 'per night · book direct · courtyard parking'],
];

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

function collectJsFiles(dir, files = []) {
  const targets = [
    path.join(projectRoot, 'js'),
    path.join(projectRoot, 'src', 'public_html', 'js'),
  ];

  for (const jsDir of targets) {
    if (!fs.existsSync(jsDir)) {
      continue;
    }

    for (const entry of fs.readdirSync(jsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(path.join(jsDir, entry.name));
      }
    }
  }

  return files;
}

function alignContent(content) {
  let updated = content;

  for (const [find, replace] of REPLACEMENTS) {
    updated = updated.split(find).join(replace);
  }

  return updated;
}

function main() {
  const targets = [...new Set([...collectHtmlFiles(projectRoot), ...collectJsFiles()])];
  let changedFiles = 0;

  for (const filePath of targets) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = alignContent(original);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changedFiles += 1;
      console.log(`Aligned: ${path.relative(projectRoot, filePath)}`);
    }
  }

  const remaining = targets.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return /lowest price guarantee|best price guaranteed|Best price when you book direct|best price direct|Book direct for best price/i.test(content);
  });

  console.log(`\nFiles updated: ${changedFiles}`);
  console.log(`Targets scanned: ${targets.length}`);

  if (remaining.length > 0) {
    console.warn('\nRemaining best-price copy:');
    for (const filePath of remaining) {
      console.warn(`  ${path.relative(projectRoot, filePath)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('No legacy best-price hooks remain.');
}

main();
