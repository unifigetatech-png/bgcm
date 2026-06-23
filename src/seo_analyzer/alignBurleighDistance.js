/**
 * alignBurleighDistance.js
 * Rewrites outdated Burleigh Beach distance copy across all HTML templates.
 *
 * Usage: node src/seo_analyzer/alignBurleighDistance.js
 */

const fs = require('fs-extra');
const path = require('path');

const moduleDir = __dirname;
const projectRoot = path.join(moduleDir, '../..');

const BRAND = '200m from Burleigh Beach (a flat 6-minute walk)';

const REPLACEMENTS = [
  ['820 metres from Burleigh Beach on a flat foreshore path — a 10-minute walk', BRAND],
  ['820 metres from Burleigh Beach — a flat, 10-minute walk', BRAND],
  ['820 metres from Burleigh Beach — a flat 10-minute walk', BRAND],
  ['820 metres south on a flat foreshore path. The walk takes around 10 minutes', BRAND],
  ['Burleigh Beach is 820 metres, about 10 minutes', `Burleigh Beach is ${BRAND}`],
  ['Burleigh Beach is 820 metres, around 10 minutes', `Burleigh Beach is ${BRAND}`],
  ['<strong>Burleigh Beach</strong> — 820 metres, around 10 minutes\' walk. Patrolled, family-friendly, the iconic one with the headland behind it.', `<strong>Burleigh Beach</strong> — ${BRAND}. Patrolled, family-friendly, the iconic one with the headland behind it.`],
  ['<strong>Burleigh Beach</strong> — 820 metres, around 10 minutes\' walk.', `<strong>Burleigh Beach</strong> — ${BRAND}.`],
  ['<strong>Burleigh Beach</strong> — 820 metres, around 10 minutes. Patrolled, family-friendly.', `<strong>Burleigh Beach</strong> — ${BRAND}. Patrolled, family-friendly.`],
  ['<strong>Burleigh Beach</strong> — 820 metres, 10 minutes\' walk.', `<strong>Burleigh Beach</strong> — ${BRAND}.`],
  ['10 min walk · 820 m', '6 min walk · 200 m'],
  ['10 min walk · 820m', '6 min walk · 200m'],
  ['<span>10 min walk · 820m</span>', '<span>6 min walk · 200m</span>'],
  ['<tr><td>Burleigh Beach (patrolled)</td><td class="dist">820m</td><td>10 min walk</td></tr>', '<tr><td>Burleigh Beach (patrolled)</td><td class="dist">200m</td><td>6 min walk</td></tr>'],
  ['<tr><td>Burleigh Beach &amp; Headland Walk</td><td>820m</td><td>10-min walk</td></tr>', '<tr><td>Burleigh Beach &amp; Headland Walk</td><td>200m</td><td>6-min walk</td></tr>'],
  ['<tr><td>Burleigh Heads</td><td>820m walk</td>', '<tr><td>Burleigh Heads</td><td>200m walk</td>'],
  ['820 Metres, Flat Walk', '200 Metres, Flat 6-Minute Walk'],
  ['Burleigh Beach and the national park headland walk are 820m south — a 10-minute walk along the Gold Coast Highway.', `Burleigh Beach is ${BRAND}.`],
  ['Burleigh Beach and the national park headland walk are 820m south — about a 10-minute walk along the Gold Coast Highway.', `Burleigh Beach is ${BRAND}.`],
  ['Burleigh Beach and the headland national park are 820m south — about a 10-minute walk along the Gold Coast Highway.', `Burleigh Beach is ${BRAND}.`],
  ['Burleigh Beach and the headland national park walk are 820m south (10-min walk)', `Burleigh Beach is ${BRAND}`],
  ['The beach is 820m.', 'Burleigh Beach is 200m from the motel.'],
  ['820m to beach, 1.2km', '200m to Burleigh Beach, 1.2km'],
  ['820m to beach', '200m to Burleigh Beach'],
  ['820m to Burleigh Beach', '200m to Burleigh Beach'],
  ['820m to the beach', '200m to Burleigh Beach'],
  ['820m to the headland', '200m to Burleigh Beach (headland walk beyond)'],
  ['820m to Burleigh headland', '200m to Burleigh Beach'],
  ['820m to Burleigh', '200m to Burleigh Beach'],
  ['820m from Burleigh Beach and the headland walk', '200m from Burleigh Beach (a flat 6-minute walk), with the headland walk beyond'],
  ['820m from Burleigh Beach', '200m from Burleigh Beach'],
  ['820m from the motel', '200m from the motel'],
  ['820m from Burleigh Beach and help guests', '200m from Burleigh Beach and help guests'],
  ['820m south is the Burleigh Beach headland', '200m from Burleigh Beach (a flat 6-minute walk), with the headland beyond'],
  ['Burleigh Beach and the national park headland (820m south)', 'Burleigh Beach (200m south — a flat 6-minute walk) and the national park headland beyond'],
  ['and 820 metres from Burleigh Beach', `and ${BRAND}`],
  ['820 metres from Burleigh Beach', BRAND],
  ['820m south — flat foreshore walk, no highway crossing required.', '200m from Burleigh Beach — flat foreshore walk, no highway crossing required.'],
  ['The practical distance to Burleigh Heads central (James Street, the national park, the beach) is 820m on a flat path. That is a 10-minute walk.', `Burleigh Beach is ${BRAND}. James Street, the national park, and the headland are a short walk beyond the patrolled beach.`],
  ['The headland is 820m from the motel — about a 10-minute walk south along the Gold Coast Highway.', `Burleigh Beach is ${BRAND}. The national park entrance is at the southern end of the beach.`],
  ['820m walk (10 minutes)', '200m walk (6 minutes)'],
  ['820m walk', '200m walk'],
  ['patrolled beach 820m away', 'patrolled beach 200m away'],
  ['Walk to Burleigh Beach (820m)', 'Walk to Burleigh Beach (200m — flat 6-minute walk)'],
  ['Sunset walk 820m away', '200m to Burleigh Beach (flat 6-minute walk)'],
  ['820<em>m</em>', '200<em>m</em>'],
  ['Miami Beach is a 5-minute walk (400m). Burleigh Beach with its iconic headland is around 10 minutes on foot (820m).', `Miami Beach is a 5-minute walk (400m). Burleigh Beach is ${BRAND}.`],
  ['Miami Beach is approximately a <strong>5-minute walk</strong> (400m). Burleigh Beach with its iconic headland and national park is around <strong>10 minutes on foot</strong> (820m).', `Miami Beach is approximately a <strong>5-minute walk</strong> (400m). Burleigh Beach is <strong>${BRAND}</strong>.`],
  ['Miami Beach is a 5-minute walk (400 metres) from the motel. Burleigh Beach is a 10-minute walk (820 metres).', `Miami Beach is a 5-minute walk (400 metres) from the motel. Burleigh Beach is ${BRAND}.`],
  ['Burleigh Beach is a 10-minute walk (820 metres).', BRAND],
  ['Burleigh Beach is 10 minutes on foot.', 'Burleigh Beach is a flat 6-minute walk (200m).'],
  ['Plenty. Miami Beach is a 5-minute walk. Burleigh Beach is 10 minutes on foot.', `Plenty. Miami Beach is a 5-minute walk. Burleigh Beach is ${BRAND}.`],
  ['in the water at Burleigh in 10 minutes', 'in the water at Burleigh in 6 minutes'],
  ['a 10-minute walk from the motel', 'a flat 6-minute walk from the motel'],
  ['10 minutes from the motel', '6 minutes from the motel'],
  ['5-minute walk to Miami Beach, 10 to Burleigh', '5-minute walk to Miami Beach, 200m to Burleigh Beach (flat 6-min walk)'],
  ['5 min walk to Miami Beach, 10 to Burleigh', '5 min walk to Miami Beach, 200m to Burleigh Beach (flat 6-min walk)'],
  ['reach Burleigh Beach in 10', 'reach Burleigh Beach in 6 minutes (200m)'],
  ['<div class="dist-val">10 min</div><div class="dist-label">Burleigh Beach walk</div>', '<div class="dist-val">6 min</div><div class="dist-label">Burleigh Beach walk</div>'],
  ['820m', '200m'],
  ['820 m', '200 m'],
  ['820 metres', '200m from Burleigh Beach (a flat 6-minute walk)'],
  ['820 Metres', '200 Metres'],
  ['10-minute walk to Burleigh', 'flat 6-minute walk to Burleigh Beach'],
  ['10 min walk to Burleigh', '6 min walk to Burleigh Beach'],
];

const CLEANUP_REPLACEMENTS = [
  ['Burleigh Beach is 200m from Burleigh Beach (a flat 6-minute walk)', 'The motel is 200m from Burleigh Beach (a flat 6-minute walk)'],
  ['<strong>Burleigh Beach</strong> — 200m from Burleigh Beach (a flat 6-minute walk)', '<strong>Burleigh Beach</strong> — 200m from the motel (a flat 6-minute walk)'],
  ['Burleigh Beach is <strong>200m from Burleigh Beach (a flat 6-minute walk)</strong>', 'Burleigh Beach is <strong>200m from the motel (a flat 6-minute walk)</strong>'],
  ['Burleigh Beach with its iconic headland is around 10 minutes on foot (200m).', BRAND],
  ['and a ten-minute walk to the headland', ', with the headland national park walk just beyond the beach'],
  ['Burleigh Beach — the main patrolled surf beach — is 200m from Burleigh Beach (a flat 6-minute walk)', 'Burleigh Beach — the main patrolled surf beach — is 200m from the motel (a flat 6-minute walk)'],
  ['Burleigh Beach is a 10-minute walk (around 200 metres)', BRAND],
  ['Burleigh Beach is a 10-minute walk (820 metres)', BRAND],
  ['The headland is 200m from the motel — about a 10-minute walk south along the Gold Coast Highway.', `${BRAND}. The national park entrance is at the southern end of Burleigh Beach.`],
  ['10-minute walk · Patrolled · Headland behind it', '6-minute walk · Patrolled · Headland behind it'],
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

function alignContent(content) {
  let updated = content;

  for (const [find, replace] of REPLACEMENTS) {
    updated = updated.split(find).join(replace);
  }

  for (const [find, replace] of CLEANUP_REPLACEMENTS) {
    updated = updated.split(find).join(replace);
  }

  return updated;
}

function main() {
  const htmlFiles = [
    ...collectHtmlFiles(projectRoot),
    ...collectHtmlFiles(path.join(projectRoot, 'src', 'public_html')),
  ];
  const uniqueFiles = [...new Set(htmlFiles)];
  let changedFiles = 0;
  let totalReplacements = 0;

  for (const filePath of uniqueFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = alignContent(original);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changedFiles += 1;
      const rel = path.relative(projectRoot, filePath);
      console.log(`Aligned: ${rel}`);
    }
  }

  const remaining = uniqueFiles.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return /820\s*m\b|820m\b|820\s*metres?|820\s*Metres?|10.minute walk to Burleigh|10 to Burleigh|10-minute walk \(around 200|10-minute walk · Patrolled/i.test(content)
      && !/max-width:\s*820px/.test(content);
  });

  console.log(`\nFiles updated: ${changedFiles}`);
  console.log(`HTML files scanned: ${uniqueFiles.length}`);

  if (remaining.length > 0) {
    console.warn('\nRemaining distance conflicts:');
    for (const filePath of remaining) {
      console.warn(`  ${path.relative(projectRoot, filePath)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('No conflicting Burleigh distance copy remains.');
}

main();
