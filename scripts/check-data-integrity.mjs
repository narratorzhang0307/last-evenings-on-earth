import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const rootDir = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'last-evenings-data-'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string`);
}

function assertCoordinate(lat, lng, label) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) fail(`${label} has invalid latitude`);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) fail(`${label} has invalid longitude`);
}

function assertUnique(items, keyOf, label) {
  const seen = new Set();
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) fail(`${label} has duplicate key: ${key}`);
    seen.add(key);
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function loadTsData(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
  }).outputText;
  const targetPath = path.join(tempDir, relativePath.replace(/\//g, '__').replace(/\.ts$/, '.mjs'));
  fs.writeFileSync(targetPath, transpiled);
  return import(pathToFileURL(targetPath).href);
}

function checkCities(cities, arcs) {
  if (!Array.isArray(cities) || !cities.length) fail('CITIES must be a non-empty array');
  assertUnique(cities, (city) => city.id, 'CITIES');

  for (const city of cities) {
    assertNonEmptyString(city.id, `city.id`);
    if (!/^[a-z0-9-]+$/.test(city.id)) fail(`city ${city.id} has an unsafe id`);
    assertNonEmptyString(city.name, `city ${city.id}.name`);
    assertNonEmptyString(city.nameNative, `city ${city.id}.nameNative`);
    assertNonEmptyString(city.country, `city ${city.id}.country`);
    assertNonEmptyString(city.author, `city ${city.id}.author`);
    assertNonEmptyString(city.book, `city ${city.id}.book`);
    assertNonEmptyString(city.excerpt, `city ${city.id}.excerpt`);
    assertCoordinate(city.lat, city.lng, `city ${city.id}`);
    if (!Array.isArray(city.poems) || !city.poems.some((line) => typeof line === 'string' && line.trim())) {
      fail(`city ${city.id} must have at least one poem line`);
    }
  }

  if (Array.isArray(arcs)) {
    arcs.forEach((arc, index) => {
      assertCoordinate(arc.startLat, arc.startLng, `arc ${index} start`);
      assertCoordinate(arc.endLat, arc.endLng, `arc ${index} end`);
    });
  }
}

function checkMajorCities(majorCities) {
  if (!Array.isArray(majorCities) || !majorCities.length) fail('MAJOR_CITIES must be a non-empty array');
  assertUnique(majorCities, (city) => city.nameEn, 'MAJOR_CITIES English names');
  assertUnique(majorCities, (city) => city.nameZh, 'MAJOR_CITIES Chinese names');
  majorCities.forEach((city) => {
    assertNonEmptyString(city.nameZh, 'major city nameZh');
    assertNonEmptyString(city.nameEn, `major city ${city.nameZh}.nameEn`);
    assertCoordinate(city.lat, city.lng, `major city ${city.nameZh}`);
  });
}

function checkPhotos(photos) {
  if (!Array.isArray(photos) || !photos.length) fail('PHOTOS must be a non-empty array');
  assertUnique(photos, (photo) => photo.id, 'PHOTOS');
  photos.forEach((photo) => {
    assertNonEmptyString(photo.id, 'photo.id');
    assertNonEmptyString(photo.cityId, `photo ${photo.id}.cityId`);
    assertCoordinate(photo.lat, photo.lng, `photo ${photo.id}`);
    if (!isHttpUrl(photo.url)) fail(`photo ${photo.id} must use an http(s) url`);
    if (photo.original_url && !isHttpUrl(photo.original_url)) fail(`photo ${photo.id} original_url must use http(s)`);
    if (!Number.isFinite(photo.rot)) fail(`photo ${photo.id}.rot must be finite`);
    if (photo.imgWidth !== undefined && (!Number.isFinite(photo.imgWidth) || photo.imgWidth <= 0)) {
      fail(`photo ${photo.id}.imgWidth must be positive`);
    }
    if (photo.imgHeight !== undefined && (!Number.isFinite(photo.imgHeight) || photo.imgHeight <= 0)) {
      fail(`photo ${photo.id}.imgHeight must be positive`);
    }
  });
}

function checkPoems(poems) {
  if (!Array.isArray(poems) || !poems.length) fail('POEMS must be a non-empty array');
  assertUnique(poems, (poem) => poem.id, 'POEMS');
  poems.forEach((poem) => {
    assertNonEmptyString(poem.id, 'poem.id');
    assertCoordinate(poem.lat, poem.lng, `poem ${poem.id}`);
    assertNonEmptyString(poem.city, `poem ${poem.id}.city`);
    assertNonEmptyString(poem.region, `poem ${poem.id}.region`);
    assertNonEmptyString(poem.author_zh, `poem ${poem.id}.author_zh`);
    assertNonEmptyString(poem.title_zh, `poem ${poem.id}.title_zh`);
    if (!Array.isArray(poem.body_zh) || !poem.body_zh.some((line) => typeof line === 'string' && line.trim())) {
      fail(`poem ${poem.id} must have body lines`);
    }
    if (!['⭐', '⭐⭐', '⭐⭐⭐'].includes(poem.reliability)) fail(`poem ${poem.id} has invalid reliability`);
  });
}

function checkWriters(writers) {
  if (!Array.isArray(writers) || !writers.length) fail('WRITERS must be a non-empty array');
  assertUnique(writers, (writer) => writer.id, 'WRITERS');
  writers.forEach((writer) => {
    assertNonEmptyString(writer.id, 'writer.id');
    assertNonEmptyString(writer.name_en, `writer ${writer.id}.name_en`);
    assertNonEmptyString(writer.name_zh, `writer ${writer.id}.name_zh`);
    assertNonEmptyString(writer.city, `writer ${writer.id}.city`);
    assertCoordinate(writer.lat, writer.lng, `writer ${writer.id}`);
    if (!isHttpUrl(writer.portrait)) fail(`writer ${writer.id}.portrait must use an http(s) url`);
    assertNonEmptyString(writer.soul_intro?.zh, `writer ${writer.id}.soul_intro.zh`);
    assertNonEmptyString(writer.knock_text?.zh_title, `writer ${writer.id}.knock_text.zh_title`);
    if (!Array.isArray(writer.opening_lines) || !writer.opening_lines.some((line) => line.trim())) {
      fail(`writer ${writer.id} must have opening lines`);
    }
    if (!Array.isArray(writer.farewell_lines) || !writer.farewell_lines.some((line) => line.trim())) {
      fail(`writer ${writer.id} must have farewell lines`);
    }
  });
}

try {
  const [{ CITIES, ARCS }, { MAJOR_CITIES }, { PHOTOS }, { POEMS }, { WRITERS }] = await Promise.all([
    loadTsData('src/data/literaryCities.ts'),
    loadTsData('src/data/majorCities.ts'),
    loadTsData('src/data/worldPhotos.ts'),
    loadTsData('src/data/poems.ts'),
    loadTsData('src/data/writers.ts'),
  ]);

  checkCities(CITIES, ARCS);
  checkMajorCities(MAJOR_CITIES);
  checkPhotos(PHOTOS);
  checkPoems(POEMS);
  checkWriters(WRITERS);

  if (failures.length) {
    console.error('Data integrity check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(
    `Data integrity check passed: ${CITIES.length} cities, ${MAJOR_CITIES.length} major cities, ${PHOTOS.length} photos, ${POEMS.length} poems, ${WRITERS.length} writers.`,
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
