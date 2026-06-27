import fs from 'node:fs';
import path from 'node:path';

const roots = ['src/components', 'src/lib', 'server'];
const extensions = new Set(['.ts', '.tsx', '.mjs']);
const forbiddenPatterns = [
  { pattern: /\bYouTube\b|youtube/i, reason: 'external video bridge' },
  { pattern: /\bTTS\b|语音合成|speech synthesis/i, reason: 'speech generation' },
  { pattern: /\bAudioContext\b|\bHTMLAudioElement\b|new Audio\(|<audio/i, reason: 'audio runtime' },
  { pattern: /播放器|播放控制|歌单|音乐推荐/, reason: 'playback feature' },
  { pattern: /\bDJ\b|DJ 面板/i, reason: 'DJ feature' },
];
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

for (const root of roots) {
  for (const file of walk(path.join(process.cwd(), root))) {
    const relativeFile = path.relative(process.cwd(), file);
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of forbiddenPatterns) {
        if (rule.pattern.test(line)) {
          violations.push({ file: relativeFile, line: index + 1, reason: rule.reason });
        }
      }
    });
  }
}

if (violations.length) {
  console.error('Runtime scope check failed:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} (${violation.reason})`);
  }
  process.exit(1);
}

console.log('Runtime scope check passed: no playback, video, DJ, or speech runtime code found.');
