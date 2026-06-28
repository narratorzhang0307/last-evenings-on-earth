import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const rootDir = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'last-evenings-radio-mode-'));
const failures = [];
const sourceFiles = ['src/lib/radioMode.ts', 'src/components/RadioModePanel.tsx'];
const forbiddenSourceRules = [
  { pattern: /播放|歌单|音乐推荐/, reason: '声轨运行词汇' },
  { pattern: /\bDJ\b/i, reason: '主持运行链路' },
  { pattern: /\bTTS\b|语音合成/i, reason: '语音生成链路' },
  { pattern: /\bYouTube\b|youtube/i, reason: '外部视频桥接' },
  { pattern: /\bAudioContext\b|\bHTMLAudioElement\b|new Audio\(|<audio/i, reason: '声音运行对象' },
];
const forbiddenGeneratedRules = forbiddenSourceRules.filter((rule) => !/声轨/.test(rule.reason));

function fail(message) {
  failures.push(message);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} 必须是非空字符串`);
}

function assertNoForbiddenText(text, rules, label) {
  for (const rule of rules) {
    if (rule.pattern.test(text)) fail(`${label} 出现${rule.reason}`);
  }
}

function checkSourceBoundary() {
  for (const relativeFile of sourceFiles) {
    const source = fs.readFileSync(path.join(rootDir, relativeFile), 'utf8');
    assertNoForbiddenText(source, forbiddenSourceRules, relativeFile);
  }
}

async function loadBriefings() {
  const entryPath = path.join(tempDir, 'radio-mode-entry.ts');
  const outfile = path.join(tempDir, 'radio-mode-entry.mjs');
  fs.writeFileSync(
    entryPath,
    `
      import { CITIES } from ${JSON.stringify(path.join(rootDir, 'src/data/literaryCities.ts'))};
      import { PHOTOS } from ${JSON.stringify(path.join(rootDir, 'src/data/worldPhotos.ts'))};
      import { buildRadioBriefing } from ${JSON.stringify(path.join(rootDir, 'src/lib/radioMode.ts'))};

      const now = new Date('2026-06-28T12:00:00.000Z');
      export const briefings = CITIES.slice(0, 6).map((city) => buildRadioBriefing(city, { photos: PHOTOS, now }));
    `,
  );

  await build({
    entryPoints: [entryPath],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  });

  return import(pathToFileURL(outfile).href);
}

function checkBriefingShape(briefing, index) {
  const label = `briefing ${index + 1}`;
  assertNonEmptyString(briefing.cityId, `${label}.cityId`);
  assertNonEmptyString(briefing.stationName, `${label}.stationName`);
  assertNonEmptyString(briefing.frequency, `${label}.frequency`);
  assertNonEmptyString(briefing.localTime, `${label}.localTime`);
  assertNonEmptyString(briefing.sunsetStatus, `${label}.sunsetStatus`);
  assertNonEmptyString(briefing.summary, `${label}.summary`);
  if (!/^\d{2,3}\.\d FM$/.test(briefing.frequency)) fail(`${label}.frequency 格式不稳定`);
  if (!Array.isArray(briefing.segments) || briefing.segments.length < 5) fail(`${label}.segments 不足五段`);

  const ids = new Set();
  for (const segment of briefing.segments || []) {
    if (ids.has(segment.id)) fail(`${label}.segments 存在重复 id: ${segment.id}`);
    ids.add(segment.id);
    assertNonEmptyString(segment.label, `${label}.${segment.id}.label`);
    assertNonEmptyString(segment.title, `${label}.${segment.id}.title`);
    assertNonEmptyString(segment.text, `${label}.${segment.id}.text`);
    assertNonEmptyString(segment.meta, `${label}.${segment.id}.meta`);
  }

  assertNoForbiddenText(JSON.stringify(briefing), forbiddenGeneratedRules, label);
}

try {
  checkSourceBoundary();
  const { briefings } = await loadBriefings();
  if (!Array.isArray(briefings) || briefings.length < 6) fail('电台样本不足六座城市');
  briefings.forEach(checkBriefingShape);

  if (failures.length) {
    console.error('电台模式校验失败：');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`电台模式校验通过：${briefings.length} 座城市的台呼、频率、时间和片段结构稳定。`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
