import { useEffect, useMemo, useState } from 'react';
import { PHOTOS } from '../data/worldPhotos';
import { listServerPhotos } from './photoApi';
import type { PhotoData } from './types';

const STORAGE_KEY = 'last-evenings:user-photos';
const EVENT_NAME = 'last-evenings:user-photos-updated';
let serverPhotos: PhotoData[] = [];
let pendingServerRefresh: Promise<void> | null = null;

function readStoredPhotos() {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as PhotoData[]) : [];
  } catch {
    return [];
  }
}

function writeStoredPhotos(photos: PhotoData[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
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
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
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
