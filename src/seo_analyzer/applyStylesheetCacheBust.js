/**
 * applyStylesheetCacheBust.js
 * Applies ?v=1.0.2 cache-busting to all local /css/*.css stylesheet links.
 *
 * Usage: node src/seo_analyzer/applyStylesheetCacheBust.js
 */

const fs = require('fs-extra');
const path = require('path');

const moduleDir = __dirname;
const projectRoot = path.join(moduleDir, '../..');
const STYLESHEET_VERSION = '1.0.2';
const LOCAL_STYLESHEET_PATTERN = /href=(["'])(\/css\/[^"'?]+\.css)(?:\?[^"']*)?\1/gi;

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

function applyCacheBust(content) {
  return content.replace(
    LOCAL_STYLESHEET_PATTERN,
    (_match, quote, stylesheetPath) => `href=${quote}${stylesheetPath}?v=${STYLESHEET_VERSION}${quote}`,
  );
}

function main() {
  const htmlFiles = [...new Set(collectHtmlFiles(projectRoot))];
  let changedFiles = 0;

  for (const filePath of htmlFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = applyCacheBust(original);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changedFiles += 1;
      console.log(`Cache-busted: ${path.relative(projectRoot, filePath)}`);
    }
  }

  const missingVersion = htmlFiles.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return /href=(["'])\/css\/[^"']+\.css\1/i.test(content)
      && !/href=(["'])\/css\/[^"']+\.css\?v=1\.0\.2\1/i.test(content);
  });

  console.log(`\nFiles updated: ${changedFiles}`);
  console.log(`HTML files scanned: ${htmlFiles.length}`);

  if (missingVersion.length > 0) {
    console.warn('\nStylesheets missing ?v=1.0.2:');
    for (const filePath of missingVersion) {
      console.warn(`  ${path.relative(projectRoot, filePath)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('All local stylesheet links use ?v=1.0.2.');
}

main();
