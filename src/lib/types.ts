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

export interface WriterData {
  id: string;
  name_en: string;
  name_zh: string;
  city: string;
  lat: number;
  lng: number;
  portrait: string;
  soul_intro: {
    zh: string;
    en: string;
  };
  lantern_color: string;
  knock_text: {
    zh_title: string;
    en_title: string;
    zh_question: string;
    en_question: string;
  };
  opening_lines: string[];
  farewell_lines: string[];
  sleeping_text: {
    zh: string;
    en: string;
  };
  closed_window_text: {
    zh: string;
    en: string;
  };
}
