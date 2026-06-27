export interface CityData {
  id: string;
  name: string;
  nameNative: string;
  country: string;
  lat: number;
  lng: number;
  author: string;
  book: string;
  excerpt: string;
  poems: string[];
}

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export interface PhotoData {
  id: string;
  lat: number;
  lng: number;
  url: string;
  cityId: string;
  rot: number;
  city?: string;
  city_zh?: string;
  photographer?: string;
  photographer_username?: string;
  photographer_url?: string;
  unsplash_url?: string;
  source?: 'unsplash' | 'pexels';
  download_location?: string;
  original_url?: string;
  alt_text?: string;
  color?: string;
  blur_hash?: string | null;
  query_used?: string;
  isUserSubmitted?: boolean;
  country?: string;
  description?: string;
  signature?: string;
  submittedAt?: number;
  imgWidth?: number;
  imgHeight?: number;
}

export interface MajorCity {
  nameZh: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export interface PoemPoint {
  id: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  author_zh: string;
  author_en: string;
  title_zh: string;
  body_zh: string[];
  translator: string;
  reliability: '⭐' | '⭐⭐' | '⭐⭐⭐';
  source_note: string;
  author: string;
  poem: string;
}
