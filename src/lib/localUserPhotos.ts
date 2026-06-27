import { useEffect, useMemo, useState } from 'react';
import { PHOTOS } from '../data/worldPhotos';
import { listServerPhotos } from './photoApi';
import type { PhotoData } from './types';

const STORAGE_KEY = 'last-evenings:user-photos';
const EVENT_NAME = 'last-evenings:user-photos-updated';
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
    return Array.isArray(parsed) ? parsed.filter(isStoredPhoto) : [];
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  emitPhotosUpdated();
}

export function saveLocalUserPhoto(photo: PhotoData) {
  const current = readStoredPhotos().filter((item) => item.id !== photo.id);
  writeStoredPhotos([{ ...photo, isUserSubmitted: true }, ...current]);
}

export function subscribeLocalUserPhotos(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
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

  useEffect(() => {
    refreshServerUserPhotos();
    return subscribeLocalUserPhotos(() => setUserPhotos(readStoredPhotos()));
  }, []);

  return useMemo(() => {
    const seen = new Set<string>();
    return [...userPhotos, ...serverPhotos, ...PHOTOS].filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
  }, [userPhotos]);
}
