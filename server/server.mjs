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
`);

const listPhotosStmt = db.prepare(`
  SELECT id, url, city, city_zh, country, lat, lng, description, signature, rot, img_width, img_height, submitted_at
  FROM photos
  WHERE deleted_at IS NULL
  ORDER BY submitted_at DESC
`);

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

app.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
});

