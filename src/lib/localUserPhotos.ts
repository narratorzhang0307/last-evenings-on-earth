import { useEffect, useMemo, useState } from 'react';
import { PHOTOS } from '../data/worldPhotos';
import { listServerPhotos } from './photoApi';
import type { PhotoData } from './types';

const STORAGE_KEY = 'last-evenings:user-photos';
const EVENT_NAME = 'last-evenings:user-photos-updated';
const LOCAL_USER_PHOTO_LIMIT = 60;
let serverPhotos: PhotoData[] = [];
let pendingServerRefresh: Promise<void> | null = null;

function emitPhotosUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function readStoredPhotos() {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isStoredPhoto).slice(0, LOCAL_USER_PHOTO_LIMIT) : [];
  } catch {
    return [];
  }
}

function isStoredPhoto(value: unknown): value is PhotoData {
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

function writeStoredPhotos(photos: PhotoData[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    emitPhotosUpdated();
  } catch {
    // 本地兜底保存失败时，不阻断当前投稿在页面内继续展示。
  }
}

export function saveLocalUserPhoto(photo: PhotoData) {
  const current = readStoredPhotos().filter((item) => item.id !== photo.id);
  writeStoredPhotos([{ ...photo, isUserSubmitted: true }, ...current].slice(0, LOCAL_USER_PHOTO_LIMIT));
}

export function subscribeLocalUserPhotos(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener('storage', handleStorage);
  };
}

export function refreshServerUserPhotos() {
  if (!pendingServerRefresh) {
    pendingServerRefresh = listServerPhotos()
      .then((photos) => {
        serverPhotos = photos;
        emitPhotosUpdated();
      })
      .catch(() => {
        serverPhotos = [];
        emitPhotosUpdated();
      })
      .finally(() => {
        pendingServerRefresh = null;
      });
  }
  return pendingServerRefresh;
}

export function rememberServerUserPhoto(photo: PhotoData) {
  serverPhotos = [{ ...photo, isUserSubmitted: true }, ...serverPhotos.filter((item) => item.id !== photo.id)];
  emitPhotosUpdated();
}

export function useAllPhotos() {
  const [userPhotos, setUserPhotos] = useState<PhotoData[]>(() => readStoredPhotos());
  const [photosRevision, setPhotosRevision] = useState(0);

  useEffect(() => {
    refreshServerUserPhotos();
    return subscribeLocalUserPhotos(() => {
      setUserPhotos(readStoredPhotos());
      setPhotosRevision((revision) => revision + 1);
    });
  }, []);

  return useMemo(() => {
    const seen = new Set<string>();
    return [...userPhotos, ...serverPhotos, ...PHOTOS].filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
  }, [photosRevision, userPhotos]);
}
