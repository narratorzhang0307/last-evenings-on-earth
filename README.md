# Last Evenings on Earth

A clean rebuild of the night atlas experience from the original local project.

This repository keeps the city, dusk, writer, poem, and photo interactions, while leaving the music and playback system out of scope.

## Current Shape

- React + TypeScript + Vite application shell
- Safety-first repository boundary for secrets, runtime databases, caches, audio files, and large local source assets
- Room for a small server layer under `server/`

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://127.0.0.1:3000` by default.
