import type { PhotoData } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export class PhotoApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'PhotoApiError';
    this.status = status;
    this.code = code;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new PhotoApiError(
      response.status,
      detail.message || detail.error || `请求失败（状态 ${response.status}）`,
      detail.error,
    );
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new PhotoApiError(502, '照片服务返回了无法识别的数据。', 'invalid_json');
  }
}

async function readErrorDetail(response: Response) {
  try {
    return (await response.clone().json()) as { message?: string; error?: string };
  } catch {
    return { message: await response.text() };
  }
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
