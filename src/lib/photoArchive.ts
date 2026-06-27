import { CITIES } from '../data/literaryCities';
import { PHOTOS } from '../data/worldPhotos';
import type { CityData, PhotoData } from './types';

const cityCountryById = new Map(CITIES.map((city) => [city.id, city.country.split(/\s+/)[0]]));
const cityIdsByName = new Map(
  CITIES.flatMap((city) => [
    [city.id.toLowerCase(), city.id],
    [city.name.toLowerCase(), city.id],
    [city.nameNative, city.id],
  ]),
);

export function resolvePhotoCityId(photo: PhotoData) {
  const direct = cityIdsByName.get(photo.cityId.toLowerCase());
  if (direct) return direct;
  if (photo.city) {
    const byEnglishName = cityIdsByName.get(photo.city.toLowerCase());
    if (byEnglishName) return byEnglishName;
  }
  if (photo.city_zh) {
    const byNativeName = cityIdsByName.get(photo.city_zh);
    if (byNativeName) return byNativeName;
  }
  return photo.cityId;
}

export function getPhotosForCity(city: CityData, limit = 6, photos: PhotoData[] = PHOTOS) {
  return photos.filter((photo) => resolvePhotoCityId(photo) === city.id).slice(0, limit);
}

export function getPhotoCountry(photo: PhotoData) {
  return photo.country || cityCountryById.get(resolvePhotoCityId(photo)) || '其他';
}

export function groupPhotosByCountry(photos: PhotoData[] = PHOTOS) {
  return photos.reduce<Record<string, PhotoData[]>>((groups, photo) => {
    const country = getPhotoCountry(photo);
    groups[country] = groups[country] || [];
    groups[country].push(photo);
    return groups;
  }, {});
}

export function getPhotoStats(photos: PhotoData[] = PHOTOS) {
  const countries = new Set<string>();
  const cities = new Set<string>();
  photos.forEach((photo) => {
    countries.add(getPhotoCountry(photo));
    cities.add(photo.city_zh || photo.city || photo.cityId);
  });
  return {
    photoCount: photos.length,
    countryCount: countries.size,
    cityCount: cities.size,
  };
}
