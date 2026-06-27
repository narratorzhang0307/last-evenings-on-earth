import { POEMS } from '../data/poems';
import type { CityData, PoemPoint } from './types';

export function regionToCountry(region: string) {
  return region.split(/[；;,，]/)[0]?.trim() || '未知';
}

export function getPoemFirstLine(poem: PoemPoint) {
  return poem.body_zh.find((line) => line.trim()) || poem.poem || poem.title_zh;
}

function normalizeCityName(name: string) {
  return name.trim().toLowerCase();
}

export function getPoemsForCity(city: CityData, limit = 4, poems: PoemPoint[] = POEMS) {
  const cityNames = new Set([city.nameNative, city.name, city.id].map(normalizeCityName));
  return poems
    .filter((poem) => {
      const poemCity = normalizeCityName(poem.city);
      const region = normalizeCityName(poem.region);
      return cityNames.has(poemCity) || region.includes(normalizeCityName(city.nameNative)) || region.includes(normalizeCityName(city.name));
    })
    .slice(0, limit);
}

export function groupPoemsByCountry(poems: PoemPoint[] = POEMS) {
  return poems.reduce<Record<string, PoemPoint[]>>((groups, poem) => {
    const country = regionToCountry(poem.region);
    groups[country] = groups[country] || [];
    groups[country].push(poem);
    return groups;
  }, {});
}

export function getPoemStats(poems: PoemPoint[] = POEMS) {
  const countries = new Set<string>();
  const authors = new Set<string>();
  poems.forEach((poem) => {
    countries.add(regionToCountry(poem.region));
    authors.add(poem.author_zh || poem.author);
  });
  return {
    poemCount: poems.length,
    countryCount: countries.size,
    authorCount: authors.size,
  };
}
