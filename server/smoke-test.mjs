import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'last-evenings-photos-'));
}

function getOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForHealthy(baseUrl, child) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`照片服务提前退出，退出码 ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      // 服务启动期间会短暂拒绝连接。
    }
    await wait(150);
  }
  throw new Error('照片服务启动超时');
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`响应不是 JSON：${text.slice(0, 120)}`);
  }
}

async function requestJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const json = await readJson(response);
  return { response, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    wait(3000).then(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }),
  ]);
}

function removeTempDir(tempDir) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

async function run() {
  const tempDir = createTempDir();
  const dbPath = path.join(tempDir, 'photos.db');
  const port = await getOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverOutput = '';

  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: __dirname,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      DB_PATH: dbPath,
      IP_SUBMIT_LIMIT: '1',
      CORS_ORIGIN: 'http://127.0.0.1:3000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForHealthy(baseUrl, child);

    const health = await requestJson(baseUrl, '/healthz');
    assert(health.response.status === 200, '健康检查应返回 200');
    assert(health.response.headers.get('x-content-type-options') === 'nosniff', '照片服务应返回 nosniff 响应头');
    assert(health.json?.ok === true, '健康检查应返回 ok=true');
    assert(health.json?.photos === 0, '临时数据库初始照片数应为 0');

    const options = await fetch(`${baseUrl}/api/photos`, { method: 'OPTIONS' });
    assert(options.status === 204, '预检请求应返回 204');
    assert(options.headers.get('access-control-max-age') === '600', '预检缓存时间应为 600 秒');
    assert(
      String(options.headers.get('access-control-allow-headers')).includes('Accept'),
      '预检请求应允许 Accept 请求头',
    );

    const emptyList = await requestJson(baseUrl, '/api/photos?limit=999');
    assert(emptyList.response.status === 200, '照片列表应返回 200');
    assert(emptyList.response.headers.get('x-photo-limit') === '200', '照片列表应把上限压到 200');
    assert(
      String(emptyList.response.headers.get('access-control-expose-headers')).includes('X-Photo-Limit'),
      '跨域响应应暴露照片列表上限响应头',
    );
    assert(Array.isArray(emptyList.json?.photos), '照片列表应返回 photos 数组');
    assert(emptyList.json.photos.length === 0, '临时数据库的照片列表应为空');

    const invalidJson = await requestJson(baseUrl, '/api/photos', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{"bad"',
    });
    assert(invalidJson.response.status === 400, '无效 JSON 应返回 400');
    assert(invalidJson.json?.error === 'invalid_json', '无效 JSON 应返回 invalid_json');

    const hugeBody = JSON.stringify({
      id: 'usr_huge_body',
      url: 'https://example.com/huge.jpg',
      city: 'Hangzhou',
      country: 'China',
      lat: 30.2741,
      lng: 120.1551,
      description: 'x'.repeat(150 * 1024),
    });
    const tooLarge = await requestJson(baseUrl, '/api/photos', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: hugeBody,
    });
    assert(tooLarge.response.status === 413, '超大请求体应返回 413');
    assert(tooLarge.json?.error === 'payload_too_large', '超大请求体应返回 payload_too_large');

    const photo = {
      id: 'usr_smoke_one',
      url: 'https://example.com/dusk.jpg',
      city: 'Hangzhou',
      city_zh: '杭州',
      country: '中国',
      lat: 30.2741,
      lng: 120.1551,
      description: '服务端冒烟验收',
      signature: '验收',
      imgWidth: -240,
      imgHeight: 0,
    };

    const created = await requestJson(baseUrl, '/api/photos', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
    assert(created.response.status === 201, '有效照片应返回 201');
    assert(created.json?.photo?.id === photo.id, '注册响应应返回照片编号');
    assert(created.json?.photo?.imgWidth === undefined, '非正照片宽度不应入库');
    assert(created.json?.photo?.imgHeight === undefined, '非正照片高度不应入库');
    assert(created.response.headers.get('x-ratelimit-remaining') === '0', '首张照片后剩余额度应为 0');
    assert(
      String(created.response.headers.get('access-control-expose-headers')).includes('X-RateLimit-Remaining'),
      '跨域响应应暴露剩余投稿额度响应头',
    );

    const duplicate = await requestJson(baseUrl, '/api/photos', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
    assert(duplicate.response.status === 409, '重复照片编号应返回 409');
    assert(duplicate.json?.error === 'duplicate_id', '重复照片编号应返回 duplicate_id');

    const secondPhoto = { ...photo, id: 'usr_smoke_two', url: 'https://example.com/dusk-two.jpg' };
    const limited = await requestJson(baseUrl, '/api/photos', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(secondPhoto),
    });
    assert(limited.response.status === 429, '超过投稿额度应返回 429');
    assert(limited.json?.error === 'rate_limit_exceeded', '超过投稿额度应返回 rate_limit_exceeded');

    const listAfterCreate = await requestJson(baseUrl, '/api/photos?limit=5');
    assert(listAfterCreate.json?.photos?.length === 1, '注册后列表应包含一张照片');
    assert(listAfterCreate.json.photos[0].id === photo.id, '列表中的照片编号应匹配注册记录');

    const deleted = await requestJson(baseUrl, `/api/photos/${photo.id}`, { method: 'DELETE' });
    assert(deleted.response.status === 200, '软删除存在照片应返回 200');
    assert(deleted.json?.affected === 1, '软删除应影响一条记录');

    const missingDelete = await requestJson(baseUrl, '/api/photos/usr_missing', { method: 'DELETE' });
    assert(missingDelete.response.status === 404, '删除不存在照片应返回 404');
    assert(missingDelete.json?.error === 'photo_not_found', '删除不存在照片应返回 photo_not_found');

    const listAfterDelete = await requestJson(baseUrl, '/api/photos');
    assert(listAfterDelete.json?.photos?.length === 0, '软删除后普通列表应为空');

    const unknownApi = await requestJson(baseUrl, '/api/not-here');
    assert(unknownApi.response.status === 404, '未知接口应返回 404');
    assert(unknownApi.json?.error === 'api_not_found', '未知接口应返回 api_not_found');

    console.log('照片服务冒烟验收通过：端点、限流、软删除和错误码正常。');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    if (serverOutput.trim()) {
      console.error('\n服务输出：');
      console.error(serverOutput.trim());
    }
    process.exitCode = 1;
  } finally {
    await stopServer(child);
    removeTempDir(tempDir);
  }
}

run();
