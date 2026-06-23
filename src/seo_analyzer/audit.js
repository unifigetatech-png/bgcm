const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');

const MODULE_DIR = __dirname;
const PUBLIC_HTML_DIR = path.join(MODULE_DIR, '../public_html');
const PROJECT_ROOT = path.join(MODULE_DIR, '../..');
const IMAGES_DIR = path.join(PUBLIC_HTML_DIR, 'images');
const CSS_DIR = path.join(PUBLIC_HTML_DIR, 'css');
const JS_DIR = path.join(PUBLIC_HTML_DIR, 'js');
const MANIFEST_PATH = path.join(IMAGES_DIR, 'path-manifest.json');
const FALLBACK_WEBP = '/images/burleigh-gold-coast-motel-exterior-street-view-miami-qld.webp';

const PHOTO_CONTAINER_SELECTOR = [
  '.park-photo',
  '.local-photo',
  '.loc-photo',
  '.story-photo',
  '.strip-img',
  '.room-img',
  '.room-photo',
  '.room-hero-photo',
  '.post-img',
  '.location-img',
  '.photo-band-bg',
  '.crosssell-card-photo',
  '.gallery-img',
].join(',');

const SYNC_SKIP_DIRS = new Set(['src', 'node_modules', 'images', 'css', 'js', 'cgi-bin']);

const IMAGE_REF_PATTERN = /((?:https?:\/\/[^/"'\s]+)?\/?images\/[^"'()\s]+?\.(?:webp|jpe?g|png))/gi;
const LEGACY_RASTER_PATTERN = /((?:https?:\/\/[^/"'\s]+)?\/?images\/[^"'()\s]+?)\.(jpe?g|png)/gi;
const LOCAL_STYLESHEET_PATTERN = /href=["'](\/css\/[^"']+\.css(?:\?[^"']*)?)["']/gi;
const LOCAL_SCRIPT_PATTERN = /src=["'](\/js\/[^"']+\.js)["']/gi;

function collectPublicAssets(assetDir, publicPrefix) {
  const registry = new Map();

  walkDirectory(assetDir, (filePath) => {
    const relativePath = path.relative(assetDir, filePath).replace(/\\/g, '/');
    const publicPath = `${publicPrefix}/${relativePath}`;
    registry.set(publicPath.toLowerCase(), publicPath);
  });

  return registry;
}

function registerDeploymentAssets() {
  const stylesheets = collectPublicAssets(CSS_DIR, '/css');
  const scripts = collectPublicAssets(JS_DIR, '/js');

  return { stylesheets, scripts };
}

function normalizeAssetPath(assetPath) {
  return assetPath.split('?')[0].toLowerCase();
}

function verifyHtmlAssetRefs(htmlFiles, assetRegistry) {
  const missingRefs = [];
  const referencedPaths = new Set();

  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const relativeFile = path.relative(PUBLIC_HTML_DIR, filePath).replace(/\\/g, '/');

    let match;
    const stylesheetPattern = new RegExp(LOCAL_STYLESHEET_PATTERN.source, 'gi');
    while ((match = stylesheetPattern.exec(html)) !== null) {
      const assetPath = normalizeAssetPath(match[1]);
      referencedPaths.add(assetPath);
      if (!assetRegistry.stylesheets.has(assetPath)) {
        missingRefs.push({ file: relativeFile, ref: match[1], type: 'stylesheet' });
      }
    }

    const scriptPattern = new RegExp(LOCAL_SCRIPT_PATTERN.source, 'gi');
    while ((match = scriptPattern.exec(html)) !== null) {
      const assetPath = normalizeAssetPath(match[1]);
      referencedPaths.add(assetPath);
      if (!assetRegistry.scripts.has(assetPath)) {
        missingRefs.push({ file: relativeFile, ref: match[1], type: 'script' });
      }
    }
  }

  return {
    missingRefs,
    referencedPaths,
    stylesheetCount: assetRegistry.stylesheets.size,
    scriptCount: assetRegistry.scripts.size,
  };
}

function printAssetRegistryReport(assetRegistry, assetVerification) {
  console.log('=== Deployment asset registry ===\n');
  console.log('Stylesheets (src/public_html/css/)');
  for (const publicPath of [...assetRegistry.stylesheets.values()].sort()) {
    console.log(`  ${publicPath}`);
  }
  console.log('');
  console.log('Scripts (src/public_html/js/)');
  for (const publicPath of [...assetRegistry.scripts.values()].sort()) {
    console.log(`  ${publicPath}`);
  }
  console.log('');
  console.log('Asset link verification');
  console.log(`  Stylesheets registered: ${assetVerification.stylesheetCount}`);
  console.log(`  Scripts registered: ${assetVerification.scriptCount}`);
  console.log(`  Unique local asset refs in HTML: ${assetVerification.referencedPaths.size}`);
  console.log(`  Missing asset refs: ${assetVerification.missingRefs.length}`);
  console.log('');
}

function isExcludedAsset(imagePath) {
  return /(?:logo\.png|favicon|apple-touch-icon|android-chrome)/i.test(imagePath);
}

function parseLocalImagePath(imageRef) {
  const cleaned = imageRef.replace(/^['"]|['"]$/g, '');
  const absoluteMatch = cleaned.match(/^https?:\/\/[^/]+(\/images\/.*)$/i);
  if (absoluteMatch) {
    return absoluteMatch[1];
  }
  return cleaned.replace(/\/Images\//g, '/images/').replace(/^Images\//i, 'images/');
}

function normaliseImageRef(imageRef) {
  const cleaned = parseLocalImagePath(imageRef).toLowerCase();
  if (cleaned.startsWith('/images/')) {
    return cleaned;
  }
  if (cleaned.startsWith('images/')) {
    return `/${cleaned}`;
  }
  return cleaned;
}

function isNestedImagePath(imageRef) {
  const normalised = normaliseImageRef(parseLocalImagePath(imageRef));
  if (!normalised.startsWith('/images/')) {
    return false;
  }
  const relative = normalised.slice('/images/'.length);
  return relative.includes('/');
}

function toFlatWebpPath(resolvedPath) {
  const normalised = normaliseImageRef(parseLocalImagePath(resolvedPath));

  if (isExcludedAsset(normalised)) {
    return normalised;
  }

  let flatName = path.basename(normalised);
  if (/\.(jpe?g|png)$/i.test(flatName)) {
    flatName = flatName.replace(/\.(jpe?g|png)$/i, '.webp');
  }

  return `/images/${flatName}`;
}

function formatResolvedRef(resolvedPath, originalRef) {
  const flatPath = toFlatWebpPath(resolvedPath);
  const absoluteMatch = originalRef.match(/^(https?:\/\/[^/]+)/i);

  if (absoluteMatch) {
    return `${absoluteMatch[1]}${flatPath}`;
  }

  if (originalRef.startsWith('images/') && !originalRef.startsWith('/images/')) {
    return flatPath.replace(/^\//, '');
  }

  return flatPath;
}

function normaliseImagePathCasing(html) {
  return html.replace(/Images\//g, 'images/');
}

function walkDirectory(directory, visitor) {
  if (!fs.existsSync(directory)) {
    return;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, visitor);
      continue;
    }
    visitor(fullPath);
  }
}

function collectHtmlFiles(directory) {
  const htmlFiles = [];
  walkDirectory(directory, (filePath) => {
    if (filePath.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  });
  return htmlFiles;
}

function collectProjectHtmlFiles(baseDir, skipTopLevelDirs) {
  const htmlFiles = [];

  walkDirectory(baseDir, (filePath) => {
    if (!filePath.endsWith('.html')) {
      return;
    }

    const relativePath = path.relative(baseDir, filePath);
    const topLevelDir = relativePath.split(path.sep)[0];
    if (skipTopLevelDirs.has(topLevelDir)) {
      return;
    }

    htmlFiles.push(filePath);
  });

  return htmlFiles;
}

function loadPathManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return new Map();
  }

  const rawManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manifest = new Map();

  for (const [sourcePath, targetPath] of Object.entries(rawManifest)) {
    manifest.set(sourcePath.toLowerCase(), targetPath);
    manifest.set(normaliseImageRef(sourcePath).toLowerCase(), targetPath);
  }

  return manifest;
}

function buildFlatWebpIndex(imagesDir) {
  const byFilename = new Map();
  const byStem = new Map();
  const stemsByToken = new Map();

  if (!fs.existsSync(imagesDir)) {
    return { byFilename, byStem, stemsByToken };
  }

  for (const entry of fs.readdirSync(imagesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.webp')) {
      continue;
    }

    const publicPath = `/images/${entry.name}`;
    const stem = path.basename(entry.name, '.webp').toLowerCase();

    byFilename.set(entry.name.toLowerCase(), publicPath);
    byStem.set(stem, publicPath);

    for (const token of stem.split('-').filter((part) => part.length > 3)) {
      if (!stemsByToken.has(token)) {
        stemsByToken.set(token, []);
      }
      stemsByToken.get(token).push(publicPath);
    }
  }

  return { byFilename, byStem, stemsByToken };
}

function scoreStemOverlap(referenceStem, candidateStem) {
  const referenceTokens = new Set(referenceStem.split('-').filter(Boolean));
  const candidateTokens = candidateStem.split('-').filter(Boolean);
  let score = 0;

  for (const token of candidateTokens) {
    if (referenceTokens.has(token)) {
      score += 1;
    }
  }

  if (candidateStem.includes(referenceStem) || referenceStem.includes(candidateStem)) {
    score += 3;
  }

  return score;
}

function resolveByStemMatch(referencePath, flatIndex) {
  const stem = path.basename(referencePath, path.extname(referencePath)).toLowerCase();
  const directMatch = flatIndex.byStem.get(stem);
  if (directMatch) {
    return directMatch;
  }

  let bestPath = null;
  let bestScore = 0;

  for (const [candidateStem, candidatePath] of flatIndex.byStem.entries()) {
    const score = scoreStemOverlap(stem, candidateStem);
    if (score > bestScore) {
      bestScore = score;
      bestPath = candidatePath;
    }
  }

  if (bestScore >= 4) {
    return bestPath;
  }

  return null;
}

function resolveImagePath(imageRef, manifest, flatIndex) {
  const localPath = parseLocalImagePath(imageRef);
  const normalised = normaliseImageRef(localPath);

  if (!normalised.startsWith('/images/')) {
    return imageRef;
  }

  if (isExcludedAsset(normalised)) {
    return formatResolvedRef(normalised, imageRef);
  }

  const manifestMatch = manifest.get(normalised) || manifest.get(localPath.toLowerCase());
  if (manifestMatch) {
    return formatResolvedRef(manifestMatch, imageRef);
  }

  const flatFilename = path.basename(normalised);
  const directFlat = flatIndex.byFilename.get(flatFilename);
  if (directFlat) {
    return formatResolvedRef(directFlat, imageRef);
  }

  const stemMatch = resolveByStemMatch(normalised, flatIndex);
  if (stemMatch) {
    return formatResolvedRef(stemMatch, imageRef);
  }

  if (/\.(jpe?g|png)$/i.test(normalised)) {
    const webpGuess = normalised.replace(/\.(jpe?g|png)$/i, '.webp');
    const guessMatch = manifest.get(webpGuess) || flatIndex.byFilename.get(path.basename(webpGuess));
    if (guessMatch) {
      return formatResolvedRef(guessMatch, imageRef);
    }
  }

  return formatResolvedRef(normalised, imageRef);
}

function imageRefNeedsRepair(imageRef, manifest, flatIndex) {
  if (/Images\//.test(imageRef)) {
    return true;
  }

  if (/\.(jpe?g|png)$/i.test(imageRef) && !isExcludedAsset(imageRef)) {
    return true;
  }

  if (isNestedImagePath(imageRef)) {
    return true;
  }

  const target = resolveImagePath(imageRef, manifest, flatIndex);
  return target !== imageRef;
}

function extractBackgroundUrl(styleValue) {
  if (!styleValue) {
    return '';
  }

  const match = styleValue.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return match ? match[1] : '';
}

function isGreySpot(element) {
  const styleValue = element.getAttribute('style') || '';
  const backgroundUrl = extractBackgroundUrl(styleValue);
  if (backgroundUrl) {
    return false;
  }

  const childImage = element.querySelector('img[src]');
  if (childImage && childImage.getAttribute('src')) {
    return false;
  }

  const inlineBackground = styleValue.match(/background\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return !inlineBackground;
}

function scanHtmlFile(filePath, baseDir, rootLabel, manifest, flatIndex) {
  const html = fs.readFileSync(filePath, 'utf8');
  const { document } = parseHTML(html);
  const relativeFile = path.relative(baseDir, filePath).replace(/\\/g, '/');

  const legacyRasterRefs = [];
  const staleNestedPaths = [];
  const greySpots = [];

  let match;
  const seenRefs = new Set();
  const legacyPattern = new RegExp(LEGACY_RASTER_PATTERN.source, 'gi');
  while ((match = legacyPattern.exec(html)) !== null) {
    const fullRef = `${match[1]}.${match[2]}`;
    if (isExcludedAsset(fullRef) || seenRefs.has(fullRef)) {
      continue;
    }
    seenRefs.add(fullRef);
    legacyRasterRefs.push({
      ref: fullRef,
      suggestedPath: resolveImagePath(fullRef, manifest, flatIndex),
    });
  }

  const imagePattern = new RegExp(IMAGE_REF_PATTERN.source, 'gi');
  while ((match = imagePattern.exec(html)) !== null) {
    const fullRef = match[1];
    if (isExcludedAsset(fullRef) || seenRefs.has(fullRef)) {
      continue;
    }
    seenRefs.add(fullRef);

    if (imageRefNeedsRepair(fullRef, manifest, flatIndex) && !legacyRasterRefs.some((item) => item.ref === fullRef)) {
      staleNestedPaths.push({
        ref: fullRef,
        suggestedPath: resolveImagePath(fullRef, manifest, flatIndex),
      });
    }
  }

  document.querySelectorAll(PHOTO_CONTAINER_SELECTOR).forEach((element) => {
    if (!isGreySpot(element)) {
      return;
    }

    greySpots.push({
      tag: element.tagName.toLowerCase(),
      className: element.getAttribute('class') || '',
      ariaLabel: element.getAttribute('aria-label') || '',
    });
  });

  return {
    file: relativeFile,
    filePath,
    rootLabel,
    legacyRasterRefs,
    staleNestedPaths,
    greySpots,
  };
}

function auditAllTemplates() {
  const manifest = loadPathManifest();
  const flatIndex = buildFlatWebpIndex(IMAGES_DIR);
  const findings = [];
  const scanTargets = [
    { baseDir: PROJECT_ROOT, rootLabel: 'site', skipTopLevelDirs: SYNC_SKIP_DIRS },
    { baseDir: PUBLIC_HTML_DIR, rootLabel: 'public_html', skipTopLevelDirs: new Set(['images']) },
  ];

  for (const target of scanTargets) {
    if (!fs.existsSync(target.baseDir)) {
      continue;
    }

    for (const filePath of collectProjectHtmlFiles(target.baseDir, target.skipTopLevelDirs)) {
      findings.push(scanHtmlFile(
        filePath,
        target.baseDir,
        target.rootLabel,
        manifest,
        flatIndex,
      ));
    }
  }

  if (findings.length === 0) {
    console.warn('No HTML templates found in project structure.');
    return {
      findings,
      totals: { files: 0, legacyRefs: 0, staleNestedPaths: 0, greySpots: 0 },
    };
  }

  const totals = {
    files: findings.length,
    legacyRefs: findings.reduce((sum, item) => sum + item.legacyRasterRefs.length, 0),
    staleNestedPaths: findings.reduce((sum, item) => sum + item.staleNestedPaths.length, 0),
    greySpots: findings.reduce((sum, item) => sum + item.greySpots.length, 0),
  };

  return { findings, totals };
}

function printAuditReport(report) {
  console.log('\n=== Site image audit ===\n');

  if (report.totals.files === 0) {
    console.log('No HTML files scanned.');
    return;
  }

  for (const finding of report.findings) {
    if (
      finding.legacyRasterRefs.length === 0
      && finding.staleNestedPaths.length === 0
      && finding.greySpots.length === 0
    ) {
      continue;
    }

    console.log(`File: [${finding.rootLabel}] ${finding.file}`);

    for (const legacyRef of finding.legacyRasterRefs) {
      console.log(`  Legacy raster: ${legacyRef.ref} -> ${legacyRef.suggestedPath}`);
    }

    for (const stalePath of finding.staleNestedPaths) {
      console.log(`  Nested path: ${stalePath.ref} -> ${stalePath.suggestedPath}`);
    }

    for (const greySpot of finding.greySpots) {
      console.log(`  Grey spot: <${greySpot.tag} class="${greySpot.className}">`);
    }

    console.log('');
  }

  console.log('Summary');
  console.log(`  HTML files scanned: ${report.totals.files}`);
  console.log(`  Legacy .jpg/.png refs: ${report.totals.legacyRefs}`);
  console.log(`  Nested paths to flatten: ${report.totals.staleNestedPaths}`);
  console.log(`  Empty photo containers: ${report.totals.greySpots}`);
  console.log('');
}

function syncHtmlIntoPublicHtml() {
  fs.mkdirSync(PUBLIC_HTML_DIR, { recursive: true });

  walkDirectory(PROJECT_ROOT, (filePath) => {
    if (!filePath.endsWith('.html')) {
      return;
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const topLevelDir = relativePath.split(path.sep)[0];
    if (SYNC_SKIP_DIRS.has(topLevelDir)) {
      return;
    }

    const destination = path.join(PUBLIC_HTML_DIR, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(filePath, destination);
  });
}

function injectFallbackBackground(html, className) {
  const fallbackStyle = `background-image:url('${FALLBACK_WEBP}')`;
  const classPattern = new RegExp(
    `(<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*)(>)`,
    'i',
  );

  return html.replace(classPattern, (fullMatch, opening, closing) => {
    if (/style=["'][^"']*background/i.test(opening)) {
      return fullMatch;
    }

    if (/style=["']/i.test(opening)) {
      return opening.replace(/style=(["'])/i, `style=$1${fallbackStyle}; `) + closing;
    }

    return `${opening} style="${fallbackStyle}"${closing}`;
  });
}

function applyFixes(report) {
  const manifest = loadPathManifest();
  const flatIndex = buildFlatWebpIndex(IMAGES_DIR);
  let updatedFiles = 0;
  let replacedRefs = 0;
  let filledGreySpots = 0;

  for (const finding of report.findings) {
    const filePath = finding.filePath;
    let html = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;

    const casingNormalised = normaliseImagePathCasing(html);
    if (casingNormalised !== html) {
      html = casingNormalised;
      fileChanged = true;
      replacedRefs += 1;
    }

    html = html.replace(IMAGE_REF_PATTERN, (fullMatch, imageRef) => {
      if (!imageRefNeedsRepair(imageRef, manifest, flatIndex)) {
        return fullMatch;
      }

      const resolved = resolveImagePath(imageRef, manifest, flatIndex);
      if (resolved === imageRef) {
        return fullMatch;
      }

      fileChanged = true;
      replacedRefs += 1;
      return resolved;
    });

    for (const greySpot of finding.greySpots) {
      const primaryClass = greySpot.className.split(/\s+/)[0];
      if (!primaryClass) {
        continue;
      }

      const updatedHtml = injectFallbackBackground(html, primaryClass);
      if (updatedHtml !== html) {
        html = updatedHtml;
        fileChanged = true;
        filledGreySpots += 1;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, html, 'utf8');
      updatedFiles += 1;
    }
  }

  return { updatedFiles, replacedRefs, filledGreySpots };
}

function ensurePublicHtmlReady() {
  const htmlFiles = collectHtmlFiles(PUBLIC_HTML_DIR);
  if (htmlFiles.length === 0) {
    console.log('Initialising src/public_html/ from site HTML...');
    syncHtmlIntoPublicHtml();
  }
}

function main() {
  const shouldFix = process.argv.includes('--fix');

  ensurePublicHtmlReady();

  const assetRegistry = registerDeploymentAssets();
  const publicHtmlFiles = collectHtmlFiles(PUBLIC_HTML_DIR);
  const assetVerification = verifyHtmlAssetRefs(publicHtmlFiles, assetRegistry);
  printAssetRegistryReport(assetRegistry, assetVerification);

  if (assetVerification.missingRefs.length > 0) {
    for (const missingRef of assetVerification.missingRefs) {
      console.warn(`Missing ${missingRef.type}: ${missingRef.ref} (${missingRef.file})`);
    }
    console.log('');
  }

  const report = auditAllTemplates();
  printAuditReport(report);

  if (!shouldFix) {
    if (
      report.totals.legacyRefs > 0
      || report.totals.staleNestedPaths > 0
      || report.totals.greySpots > 0
    ) {
      console.log('Run with --fix to update HTML paths and fill empty photo containers.');
    }
    return;
  }

  if (
    report.totals.legacyRefs === 0
    && report.totals.staleNestedPaths === 0
    && report.totals.greySpots === 0
  ) {
    console.log('No fixes required.');
    return;
  }

  console.log('\n=== Project-wide HTML image repair ===\n');

  const fixSummary = applyFixes(report);
  console.log('Repair summary');
  console.log(`  HTML files repaired: ${fixSummary.updatedFiles}`);
  console.log(`  Image paths updated: ${fixSummary.replacedRefs}`);
  console.log(`  Grey spots filled: ${fixSummary.filledGreySpots}`);
  console.log('');

  const postFixReport = auditAllTemplates();
  printAuditReport(postFixReport);
}

main();
