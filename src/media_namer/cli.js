import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeAllFolders, TARGET_FOLDERS } from './optimizeImages.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(moduleDir, '../..');
const inputBaseDir = path.join(projectRoot, 'images');
const outputBaseDir = path.join(projectRoot, 'src', 'public_html', 'images');

optimizeAllFolders(
  inputBaseDir,
  outputBaseDir,
  TARGET_FOLDERS,
  (message) => console.log(message),
  (message) => console.warn(message),
)
  .then(({ optimised, skipped }) => {
    console.log(`\nDone. Optimised ${optimised} image(s), skipped ${skipped}.`);
  })
  .catch((error) => {
    console.error('Processing failed:', error.message);
    process.exitCode = 1;
  });
