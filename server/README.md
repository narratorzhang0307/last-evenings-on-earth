# Server Layer

This folder holds the small runtime surface needed by the rebuilt app.

Current responsibilities:

- `GET /healthz`
- `GET /api/photos`
- `POST /api/photos`
- `DELETE /api/photos/:id`
- local SQLite persistence in `server/data.db`
- basic per-IP submission limits

Out of scope:

- music playback
- DJ decision loops
- TTS generation
- production deployment scripts from the previous project

Local start:

```bash
cd server
npm install
npm start
```

The frontend can point to this service with:

```bash
VITE_API_BASE=http://127.0.0.1:3008
```

Runtime databases and environment files stay outside the repository.
