import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const assetsDir = path.join(process.cwd(), 'dist', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('Build assets not found. Run npm run build first.');
  process.exit(1);
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const jsAssets = fs
  .readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const filePath = path.join(assetsDir, file);
    const source = fs.readFileSync(filePath);
    return {
      file,
      bytes: source.byteLength,
      gzipBytes: gzipSync(source).byteLength,
    };
  })
  .sort((a, b) => b.bytes - a.bytes);

if (!jsAssets.length) {
  console.error('No JavaScript assets found in dist/assets.');
  process.exit(1);
}

const totalBytes = jsAssets.reduce((sum, asset) => sum + asset.bytes, 0);
const totalGzipBytes = jsAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
const kib = 1024;
const budgetViolations = [];

if (totalGzipBytes > 760 * kib) {
  budgetViolations.push(`total gzip size ${formatSize(totalGzipBytes)} exceeds 760.00 kB`);
}

for (const asset of jsAssets) {
  if (asset.file.startsWith('three-runtime-')) {
    if (asset.bytes > 1400 * kib) {
      budgetViolations.push(`${asset.file} raw size ${formatSize(asset.bytes)} exceeds 1400.00 kB`);
    }
    if (asset.gzipBytes > 380 * kib) {
      budgetViolations.push(`${asset.file} gzip size ${formatSize(asset.gzipBytes)} exceeds 380.00 kB`);
    }
    continue;
  }

  if (asset.bytes > 520 * kib) {
    budgetViolations.push(`${asset.file} raw size ${formatSize(asset.bytes)} exceeds 520.00 kB`);
  }
}

console.log('JavaScript build asset report');
console.log(`Total: ${formatSize(totalBytes)} / gzip ${formatSize(totalGzipBytes)}`);
for (const asset of jsAssets) {
  console.log(`- ${asset.file}: ${formatSize(asset.bytes)} / gzip ${formatSize(asset.gzipBytes)}`);
}

if (budgetViolations.length) {
  console.error('JavaScript build budget failed:');
  for (const violation of budgetViolations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('JavaScript build budget passed.');
