import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const allowedFiles = new Set(['.env.example', 'server/.env.example']);

const forbiddenRules = [
  { pattern: /(^|\/)node_modules\//, reason: 'dependency directory' },
  { pattern: /(^|\/)dist\//, reason: 'build output' },
  { pattern: /(^|\/)build\//, reason: 'build output' },
  { pattern: /(^|\/)__pycache__\//, reason: 'python cache' },
  { pattern: /(^|\/)\.pytest_cache\//, reason: 'test cache' },
  { pattern: /(^|\/)\.cache\//, reason: 'tool cache' },
  { pattern: /(^|\/)\.env($|\.)/, reason: 'local environment file' },
  { pattern: /(^|\/)data\.db(-shm|-wal)?$/i, reason: 'runtime database' },
  { pattern: /\.(sqlite|sqlite3)$/i, reason: 'runtime database' },
  { pattern: /\.(mp3|m4a|wav|aac|flac)$/i, reason: 'audio file' },
  { pattern: /\.(mp4|mov|webm|avi)$/i, reason: 'video file' },
  { pattern: /\.(pem|key|p12)$/i, reason: 'local secret material' },
  { pattern: /\.(zip|tar|gz|tgz|7z|rar)$/i, reason: 'archive artifact' },
  { pattern: /\.(log)$/i, reason: 'runtime log' },
  { pattern: /(^|\/)frost\/data\/raw_books\//, reason: 'raw book source' },
  { pattern: /(^|\/)frost\/knowledge\/(index_store|chroma_db)\//, reason: 'knowledge cache' },
  { pattern: /(^|\/)frost\/memory\/chroma_user\//, reason: 'memory cache' },
];

const violations = [];

for (const file of trackedFiles) {
  if (allowedFiles.has(file)) continue;
  const matchedRule = forbiddenRules.find((rule) => rule.pattern.test(file));
  if (matchedRule) violations.push({ file, reason: matchedRule.reason });
}

if (violations.length) {
  console.error('Repository boundary check failed:');
  for (const violation of violations) {
    console.error(`- ${violation.file} (${violation.reason})`);
  }
  process.exit(1);
}

console.log(`Repository boundary check passed: ${trackedFiles.length} tracked files scanned.`);
