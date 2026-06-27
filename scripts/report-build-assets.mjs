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

console.log('JavaScript build asset report');
console.log(`Total: ${formatSize(totalBytes)} / gzip ${formatSize(totalGzipBytes)}`);
for (const asset of jsAssets) {
  console.log(`- ${asset.file}: ${formatSize(asset.bytes)} / gzip ${formatSize(asset.gzipBytes)}`);
}
