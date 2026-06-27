import { WRITERS } from '../data/writers';
import type { CityData, WriterData } from './types';

function normalizeCityName(city: string) {
  return city.trim().toLowerCase();
}

export function getWritersForCity(city: CityData) {
  const names = new Set([
    normalizeCityName(city.id),
    normalizeCityName(city.name),
    normalizeCityName(city.nameNative),
  ]);
  return WRITERS.filter((writer) => names.has(normalizeCityName(writer.city)));
}

export function getWriterById(writerId: string) {
  return WRITERS.find((writer) => writer.id === writerId) || null;
}

export function getWriterStats(writers: WriterData[] = WRITERS) {
  const cities = new Set(writers.map((writer) => normalizeCityName(writer.city)));
  return {
    writerCount: writers.length,
    cityCount: cities.size,
  };
}

