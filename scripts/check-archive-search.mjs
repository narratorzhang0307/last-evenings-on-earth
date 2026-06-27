import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const rootDir = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'last-evenings-archive-search-'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertMatch(matcher, query, values, expected, label) {
  const activeQuery = matcher.normalizeArchiveSearchText(query);
  const matched = matcher.archiveTextMatchesQuery(activeQuery, values);
  assertEqual(matched, expected, label);
}

async function loadArchiveSearch() {
  const sourcePath = path.join(rootDir, 'src/lib/archiveSearch.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
  }).outputText;
  const targetPath = path.join(tempDir, 'archiveSearch.mjs');
  fs.writeFileSync(targetPath, transpiled);
  return import(pathToFileURL(targetPath).href);
}

try {
  const archiveSearch = await loadArchiveSearch();

  assertEqual(archiveSearch.ARCHIVE_QUERY_MAX_LENGTH, 80, '档案搜索输入上限');
  assertEqual(archiveSearch.normalizeArchiveSearchText('  ＰＡＲＩＳ　Kafka  '), 'paris kafka', '全角和空白规范化');
  assertEqual(archiveSearch.normalizeArchiveSearchText(['夜晚', '  巴黎  ']), '夜晚 巴黎', '数组文本规范化');

  assertMatch(archiveSearch, '', ['任意档案'], true, '空查询应保留结果');
  assertMatch(archiveSearch, '巴黎 阿赫玛托娃', ['安娜·阿赫玛托娃', '彼得堡 巴黎'], true, '多个关键词全部命中');
  assertMatch(archiveSearch, '巴黎 卡夫卡', ['安娜·阿赫玛托娃', '彼得堡 巴黎'], false, '缺少关键词时不命中');
  assertMatch(archiveSearch, '金黄 辽远', [['傍晚的光线金黄而辽远', '四月的清爽如此温情']], true, '诗歌正文数组可检索');
  assertMatch(archiveSearch, '42', [42], true, '数字字段可检索');

  if (failures.length) {
    console.error('档案检索校验失败：');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('档案检索校验通过：规范化、多关键词交集、数组正文和数字字段正常。');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
