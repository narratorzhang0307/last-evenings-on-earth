import type { PhotoData } from './types';

const API_BASE = import.meta.env.VITE_API_BASE?.trim() || '';
const HAS_CONFIGURED_API_BASE = API_BASE.length > 0;
const SERVER_PHOTO_LIMIT = 200;
const ERROR_MESSAGE_MAX_LENGTH = 180;

export interface PhotoRateLimitInfo {
  limit?: number;
  remaining?: number;
  resetAt?: number;
}

export class PhotoApiError extends Error {
  status: number;
  code?: string;
  rateLimit?: PhotoRateLimitInfo;

  constructor(status: number, message: string, code?: string, rateLimit?: PhotoRateLimitInfo) {
    super(message);
    this.name = 'PhotoApiError';
    this.status = status;
    this.code = code;
    this.rateLimit = rateLimit;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new PhotoApiError(
      response.status,
      detail.message || detail.error || `请求失败（状态 ${response.status}）`,
      detail.error,
      readRateLimit(response, detail.resetAt),
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
    const detail = (await response.clone().json()) as { message?: string; error?: string; resetAt?: number };
    return { ...detail, message: trimErrorMessage(detail.message) };
  } catch {
    return { message: trimErrorMessage(await response.text()) };
  }
}

function readRateLimit(response: Response, resetAt?: number) {
  const limit = readNumberHeader(response, 'X-RateLimit-Limit');
  const remaining = readNumberHeader(response, 'X-RateLimit-Remaining');
  const resetHeader = readNumberHeader(response, 'X-RateLimit-Reset');
  if (limit === undefined && remaining === undefined && resetHeader === undefined && resetAt === undefined) return undefined;
  return { limit, remaining, resetAt: resetHeader ?? resetAt };
}

function readNumberHeader(response: Response, header: string) {
  const rawValue = response.headers.get(header);
  if (rawValue === null) return undefined;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : undefined;
}

function trimErrorMessage(message?: string) {
  if (!message) return undefined;
  const trimmed = message.trim();
  return trimmed.length > ERROR_MESSAGE_MAX_LENGTH
    ? `${trimmed.slice(0, ERROR_MESSAGE_MAX_LENGTH)}...`
    : trimmed;
}

function isPhotoPayload(value: unknown): value is PhotoData {
  if (!value || typeof value !== 'object') return false;
  const photo = value as Partial<PhotoData>;
  return (
    typeof photo.id === 'string' &&
    typeof photo.url === 'string' &&
    typeof photo.cityId === 'string' &&
    Number.isFinite(photo.lat) &&
    Number.isFinite(photo.lng)
  );
}

export async function listServerPhotos() {
  if (!HAS_CONFIGURED_API_BASE) return [];
  const data = await parseJson<{ photos: PhotoData[] }>(
    await fetch(`${API_BASE}/api/photos?limit=${SERVER_PHOTO_LIMIT}`, {
      headers: { Accept: 'application/json' },
    }),
  );
  return Array.isArray(data.photos) ? data.photos.filter(isPhotoPayload) : [];
}

export async function registerServerPhoto(photo: PhotoData) {
  if (!HAS_CONFIGURED_API_BASE) {
    throw new PhotoApiError(503, '照片服务未配置，已使用本机保存。', 'api_base_missing');
  }
  const data = await parseJson<{ ok: boolean; photo: PhotoData }>(
    await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    }),
  );
  if (!isPhotoPayload(data.photo)) {
    throw new PhotoApiError(502, '照片服务没有返回可保存的照片。', 'missing_photo');
  }
  return data.photo;
}
