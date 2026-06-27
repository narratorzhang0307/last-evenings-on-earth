import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

for (const envPath of [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env.local')]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const PORT = Number(process.env.PORT || 3008);
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const SUBMIT_LIMIT = Number(process.env.IP_SUBMIT_LIMIT || 50);
const SUBMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    city TEXT,
    city_zh TEXT,
    country TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    description TEXT,
    signature TEXT,
    rot INTEGER DEFAULT 0,
    img_width INTEGER,
    img_height INTEGER,
    submitted_at INTEGER NOT NULL,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_photos_submitted_at ON photos(submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);

  CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_start INTEGER NOT NULL,
    last_hit INTEGER NOT NULL
  );
`);

const listPhotosStmt = db.prepare(`
  SELECT id, url, city, city_zh, country, lat, lng, description, signature, rot, img_width, img_height, submitted_at
  FROM photos
  WHERE deleted_at IS NULL
  ORDER BY submitted_at DESC
`);

const insertPhotoStmt = db.prepare(`
  INSERT INTO photos (
    id, url, city, city_zh, country, lat, lng, description, signature, rot, img_width, img_height, submitted_at, created_at
  ) VALUES (
    @id, @url, @city, @city_zh, @country, @lat, @lng, @description, @signature, @rot, @img_width, @img_height, @submitted_at, @created_at
  )
`);

const softDeletePhotoStmt = db.prepare('UPDATE photos SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL');
const selectRateStmt = db.prepare('SELECT count, window_start FROM rate_limits WHERE ip = ?');
const insertRateStmt = db.prepare('INSERT INTO rate_limits (ip, count, window_start, last_hit) VALUES (?, ?, ?, ?)');
const updateRateStmt = db.prepare('UPDATE rate_limits SET count = ?, window_start = ?, last_hit = ? WHERE ip = ?');

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || '').split(',')[0];
  return String(firstForwarded || req.ip || req.socket?.remoteAddress || 'unknown').replace('::ffff:', '').trim();
}

function consumeSubmitQuota(ip) {
  const now = Date.now();
  const row = selectRateStmt.get(ip);
  if (!row || now - row.window_start > SUBMIT_WINDOW_MS) {
    insertRateStmt.run(ip, 1, now, now);
    return { allowed: true, remaining: Math.max(0, SUBMIT_LIMIT - 1), resetAt: now + SUBMIT_WINDOW_MS };
  }
  if (row.count >= SUBMIT_LIMIT) {
    updateRateStmt.run(row.count, row.window_start, now, ip);
    return { allowed: false, remaining: 0, resetAt: row.window_start + SUBMIT_WINDOW_MS };
  }
  const nextCount = row.count + 1;
  updateRateStmt.run(nextCount, row.window_start, now, ip);
  return { allowed: true, remaining: Math.max(0, SUBMIT_LIMIT - nextCount), resetAt: row.window_start + SUBMIT_WINDOW_MS };
}

function rowToPhoto(row) {
  return {
    id: row.id,
    url: row.url,
    cityId: (row.city || row.city_zh || 'user-city').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    rot: row.rot ?? 0,
    city: row.city || undefined,
    city_zh: row.city_zh || undefined,
    country: row.country || undefined,
    description: row.description || undefined,
    signature: row.signature || undefined,
    lat: row.lat,
    lng: row.lng,
    imgWidth: row.img_width || undefined,
    imgHeight: row.img_height || undefined,
    isUserSubmitted: true,
    submittedAt: row.submitted_at,
    query_used: '亲笔投稿',
  };
}

function sendError(res, status, error, message, extra = {}) {
  return res.status(status).json({ error, message, ...extra });
}

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '128kb' }));

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'last-evenings-on-earth', photos: listPhotosStmt.all().length });
});

app.get('/api/photos', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=15');
  res.json({ photos: listPhotosStmt.all().map(rowToPhoto) });
});

app.post('/api/photos', (req, res) => {
  const quota = consumeSubmitQuota(getClientIp(req));
  res.set('X-RateLimit-Limit', String(SUBMIT_LIMIT));
  res.set('X-RateLimit-Remaining', String(quota.remaining));
  res.set('X-RateLimit-Reset', String(quota.resetAt));
  if (!quota.allowed) {
    return sendError(res, 429, 'rate_limit_exceeded', '今天的投稿次数已经用完，请稍后再试。', {
      resetAt: quota.resetAt,
    });
  }

  const body = req.body || {};
  const id = String(body.id || `usr_${Date.now().toString(36)}`).trim();
  const url = String(body.url || '').trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!/^usr_[a-z0-9_-]+$/i.test(id)) return sendError(res, 400, 'invalid_id', '照片编号格式不正确。');
  if (!/^https?:\/\//i.test(url)) return sendError(res, 400, 'invalid_url', '照片链接需要以 http 或 https 开头。');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return sendError(res, 400, 'missing_coordinates', '照片坐标不能为空。');
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return sendError(res, 400, 'coordinates_out_of_range', '照片坐标超出可用范围。');
  }

  const now = Date.now();
  const row = {
    id,
    url,
    city: String(body.city || '').slice(0, 80) || null,
    city_zh: String(body.city_zh || '').slice(0, 80) || null,
    country: String(body.country || '').slice(0, 80) || null,
    lat,
    lng,
    description: String(body.description || '').slice(0, 500) || null,
    signature: String(body.signature || '').slice(0, 40) || null,
    rot: Number.isFinite(Number(body.rot)) ? Math.max(-5, Math.min(5, Number(body.rot))) : 0,
    img_width: Number.isFinite(Number(body.imgWidth)) ? Number(body.imgWidth) : null,
    img_height: Number.isFinite(Number(body.imgHeight)) ? Number(body.imgHeight) : null,
    submitted_at: Number.isFinite(Number(body.submittedAt)) ? Number(body.submittedAt) : now,
    created_at: now,
  };

  try {
    insertPhotoStmt.run(row);
    return res.status(201).json({ ok: true, photo: rowToPhoto(row) });
  } catch (error) {
    if (String(error).includes('UNIQUE')) return sendError(res, 409, 'duplicate_id', '这张照片已经登记过。');
    console.error('[photos] register failed', error);
    return sendError(res, 500, 'register_failed', '照片登记失败，请稍后再试。');
  }
});

app.delete('/api/photos/:id', (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!/^usr_[a-z0-9_-]+$/i.test(id)) return sendError(res, 400, 'invalid_id', '照片编号格式不正确。');
  const result = softDeletePhotoStmt.run(Date.now(), id);
  res.json({ ok: true, affected: result.changes });
});

app.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
});
