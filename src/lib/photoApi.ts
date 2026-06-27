import type { PhotoData } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function listServerPhotos() {
  const data = await parseJson<{ photos: PhotoData[] }>(await fetch(`${API_BASE}/api/photos`));
  return data.photos;
}

export async function registerServerPhoto(photo: PhotoData) {
  const data = await parseJson<{ ok: boolean; photo: PhotoData }>(
    await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    }),
  );
  return data.photo;
}

