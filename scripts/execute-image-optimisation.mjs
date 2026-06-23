#!/usr/bin/env node
/**
 * BGCM image optimisation executor (Phases 2–3).
 * Canonical tree: src/public_html/
 *
 * Usage:
 *   node scripts/execute-image-optimisation.mjs           # full run
 *   node scripts/execute-image-optimisation.mjs --lists-only
 *   node scripts/execute-image-optimisation.mjs --phase2-only
 *   node scripts/execute-image-optimisation.mjs --phase3-only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'src', 'public_html');
const IMAGES_DIR = path.join(PUBLIC, 'images');
const SOURCE_IMAGES_DIR = path.join(ROOT, 'images');
const MANIFEST_PATH = path.join(IMAGES_DIR, 'path-manifest.json');
const SCRATCHPAD = path.join(ROOT, 'scratchpad');
const STAGING_DIR = path.join(IMAGES_DIR, '_staging', 'hinterland-unused');

const WEBP_QUALITY = 78;
const WEBP_EFFORT = 6;
const BYTE_GATE_RATIO = 0.95; // replace only if new <= 95% of original (≥5% smaller)
const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif']);

const args = new Set(process.argv.slice(2));
const listsOnly = args.has('--lists-only');
const phase2Only = args.has('--phase2-only');
const phase3Only = args.has('--phase3-only');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkHtml(dir) {
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkHtml(full));
    else if (ent.isFile() && ent.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function normalisePublicWebp(match) {
  let p = match.split('?')[0].replace(/\\/g, '/');
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.startsWith('/images/')) return null;
  if (!p.toLowerCase().endsWith('.webp')) return null;
  return p;
}

/** @returns {Set<string>} */
function collectHtmlReferencedWebps() {
  const refs = new Set();
  const re = /\/images\/[A-Za-z0-9_./\-]+\.webp/gi;
  for (const file of walkHtml(PUBLIC)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(re)) {
      const norm = normalisePublicWebp(m[0]);
      if (norm) refs.add(norm);
    }
  }
  return refs;
}

/** @returns {Set<string>} */
function collectManifestTargetWebps(manifest) {
  const targets = new Set();
  for (const val of Object.values(manifest)) {
    if (typeof val === 'string' && val.toLowerCase().endsWith('.webp')) {
      targets.add(val.startsWith('/') ? val : `/${val}`);
    }
  }
  return targets;
}

function diskPathFromPublicWebp(publicPath) {
  const rel = publicPath.replace(/^\/images\//, '');
  return path.join(IMAGES_DIR, rel);
}

function manifestSourcesForTarget(manifest, targetWebp) {
  const sources = [];
  for (const [key, val] of Object.entries(manifest)) {
    const normVal = val.startsWith('/') ? val : `/${val}`;
    if (normVal === targetWebp) sources.push(key);
  }
  return sources;
}

function flatManifestTarget(publicWebp) {
  const base = path.basename(publicWebp, '.webp').replace(/-\d+w$/i, '');
  return `/images/${base}.webp`;
}

function resolveSourceRaster(manifest, targetWebp) {
  let keys = manifestSourcesForTarget(manifest, targetWebp);
  if (keys.length === 0) {
    keys = manifestSourcesForTarget(manifest, flatManifestTarget(targetWebp));
  }
  const candidates = [];

  for (const key of keys) {
    const cleaned = key.replace(/^\/images\//, 'images/').replace(/^images\//, 'images/');
    const rel = cleaned.startsWith('images/') ? cleaned.slice('images/'.length) : cleaned;
    const abs = path.join(SOURCE_IMAGES_DIR, rel);
    if (fs.existsSync(abs) && RASTER_EXT.has(path.extname(abs).toLowerCase())) {
      candidates.push(abs);
    }
  }

  if (candidates.length === 0) return null;

  const score = (p) => {
    const ext = path.extname(p).toLowerCase();
    const extRank = ext === '.jpg' || ext === '.jpeg' ? 4 : ext === '.png' ? 3 : ext === '.tif' || ext === '.tiff' ? 2 : 1;
    let size = 0;
    try { size = fs.statSync(p).size; } catch { /* ignore */ }
    return extRank * 1e12 + size;
  };

  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0];
}

/** @returns {Map<string, number>} */
function buildDisplayWidthsFromHtml(htmlFiles) {
  /** @type {Map<string, number>} */
  const widths = new Map();

  const note = (webpPath, w) => {
    if (!Number.isFinite(w) || w <= 0) return;
    const prev = widths.get(webpPath) ?? 0;
    if (w > prev) widths.set(webpPath, w);
  };

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');

    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0];
      const srcM = tag.match(/\bsrc=["']([^"']+)["']/i);
      if (!srcM) continue;
      const webp = normalisePublicWebp(srcM[1]);
      if (!webp) continue;
      const widthM = tag.match(/\bwidth=["']?(\d+)["']?/i);
      if (widthM) note(webp, Number(widthM[1]));
    }

    for (const m of html.matchAll(/<source\b[^>]*>/gi)) {
      const tag = m[0];
      const srcsetM = tag.match(/\bsrcset=["']([^"']+)["']/i);
      if (!srcsetM) continue;
      for (const part of srcsetM[1].split(',')) {
        const bits = part.trim().split(/\s+/);
        if (bits.length < 2) continue;
        const webp = normalisePublicWebp(bits[0]);
        const wM = bits[1].match(/^(\d+)w$/i);
        if (webp && wM) note(webp, Number(wM[1]));
      }
    }

    for (const m of html.matchAll(/url\((['"]?)(\/images\/[^)'"]+\.webp)\1\)/gi)) {
      const webp = normalisePublicWebp(m[2]);
      if (webp) note(webp, 1400);
    }
  }

  return widths;
}

function widthFromFilename(publicWebp) {
  const base = path.basename(publicWebp);
  const m = base.match(/-(\d+)w\.webp$/i);
  return m ? Number(m[1]) : null;
}

function buildLists() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const htmlRefs = collectHtmlReferencedWebps();
  const manifestTargets = collectManifestTargetWebps(manifest);

  const live = [...htmlRefs].sort();
  const staging = [...manifestTargets]
    .filter((t) => {
      const disk = diskPathFromPublicWebp(t);
      return fs.existsSync(disk) && !htmlRefs.has(t);
    })
    .sort();

  return { manifest, live, staging, htmlRefs };
}

function writeLists(live, staging) {
  ensureDir(SCRATCHPAD);
  fs.writeFileSync(path.join(SCRATCHPAD, 'live-images.json'), `${JSON.stringify(live, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(SCRATCHPAD, 'staging-images.json'), `${JSON.stringify(staging, null, 2)}\n`, 'utf8');
}

function phase2MoveStaging(manifest, staging) {
  ensureDir(STAGING_DIR);
  let moved = 0;

  for (const publicPath of staging) {
    const src = diskPathFromPublicWebp(publicPath);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(STAGING_DIR, path.basename(src));
    fs.renameSync(src, dest);
    moved += 1;
  }

  const stagingSet = new Set(staging);
  const pruned = {};
  let removedEntries = 0;

  for (const [key, val] of Object.entries(manifest)) {
    const normVal = val.startsWith('/') ? val : `/${val}`;
    if (stagingSet.has(normVal)) {
      removedEntries += 1;
      continue;
    }
    pruned[key] = val;
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(pruned, null, 2)}\n`, 'utf8');

  return { moved, removedEntries, remainingManifestKeys: Object.keys(pruned).length };
}

async function phase3OptimiseLive(manifest, live, htmlFiles) {
  const displayWidths = buildDisplayWidthsFromHtml(htmlFiles);
  const reportPath = path.join(SCRATCHPAD, 'optimise-report.csv');
  const tmpDir = path.join(SCRATCHPAD, '_optimise-tmp');
  ensureDir(tmpDir);

  const header = [
    'public_path',
    'disk_path',
    'source_raster',
    'target_width',
    'original_bytes',
    'candidate_bytes',
    'saved_bytes',
    'saved_pct',
    'action',
    'error',
  ];

  /** @type {string[][]} */
  const rows = [header];
  let replaced = 0;
  let skipped = 0;
  let noSource = 0;
  let failed = 0;

  for (const publicPath of live) {
    const diskPath = diskPathFromPublicWebp(publicPath);
    const row = [publicPath, diskPath, '', '', '', '', '', '', '', ''];

    if (!fs.existsSync(diskPath)) {
      row[8] = 'missing_on_disk';
      rows.push(row);
      failed += 1;
      continue;
    }

    const originalBytes = fs.statSync(diskPath).size;
    row[4] = String(originalBytes);

    const fromName = widthFromFilename(publicPath);
    const fromHtml = displayWidths.get(publicPath) ?? null;
    const targetWidth = fromName ?? fromHtml ?? 1400;
    row[3] = String(targetWidth);

    const source = resolveSourceRaster(manifest, publicPath);
    if (!source) {
      row[8] = 'no_source_raster';
      row[9] = 'manifest lookup failed in images/';
      rows.push(row);
      noSource += 1;
      continue;
    }
    row[2] = path.relative(ROOT, source).replace(/\\/g, '/');

    const tmpOut = path.join(tmpDir, path.basename(diskPath));

    try {
      const pipeline = sharp(source).rotate();
      const meta = await pipeline.metadata();
      const resizeWidth = meta.width && meta.width > targetWidth ? targetWidth : meta.width;

      let enc = pipeline;
      if (resizeWidth && resizeWidth < (meta.width ?? resizeWidth)) {
        enc = enc.resize({ width: resizeWidth, withoutEnlargement: true });
      }

      await enc.webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT }).toFile(tmpOut);

      const candidateBytes = fs.statSync(tmpOut).size;
      row[5] = String(candidateBytes);
      const saved = originalBytes - candidateBytes;
      row[6] = String(saved);
      row[7] = originalBytes > 0 ? ((saved / originalBytes) * 100).toFixed(2) : '0.00';

      if (candidateBytes <= originalBytes * BYTE_GATE_RATIO) {
        fs.copyFileSync(tmpOut, diskPath);
        row[8] = 'replaced';
        replaced += 1;
      } else {
        row[8] = 'kept_original';
        skipped += 1;
      }
    } catch (err) {
      row[8] = 'encode_failed';
      row[9] = err instanceof Error ? err.message : String(err);
      failed += 1;
    } finally {
      if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    }

    rows.push(row);
  }

  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');

  fs.writeFileSync(reportPath, `${csv}\n`, 'utf8');

  return { replaced, skipped, noSource, failed, reportPath, total: live.length };
}

async function main() {
  ensureDir(SCRATCHPAD);
  const htmlFiles = walkHtml(PUBLIC);
  const { manifest, live, staging } = buildLists();

  writeLists(live, staging);

  console.log(`Live WebPs (HTML-referenced): ${live.length}`);
  console.log(`Staging WebPs (manifest-only on disk): ${staging.length}`);

  if (staging.length !== 62) {
    console.warn(`Expected 62 staging orphans; computed ${staging.length}. Proceeding with computed list.`);
  }

  if (listsOnly) return;

  if (!phase3Only) {
    const p2 = phase2MoveStaging(manifest, staging);
    console.log(`Phase 2: moved ${p2.moved} files to ${path.relative(ROOT, STAGING_DIR)}`);
    console.log(`Phase 2: pruned ${p2.removedEntries} manifest entries (${p2.remainingManifestKeys} keys remain)`);
  }

  if (!phase2Only) {
    const manifestAfter = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const p3 = await phase3OptimiseLive(manifestAfter, live, htmlFiles);
    console.log(`Phase 3: ${p3.total} live targets — replaced ${p3.replaced}, kept ${p3.skipped}, no source ${p3.noSource}, failed ${p3.failed}`);
    console.log(`Report: ${path.relative(ROOT, p3.reportPath)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
