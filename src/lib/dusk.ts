import SunCalc from 'suncalc';
import type { CityData } from './types';

export function getApproxLocalTime(date: Date, lng: number): string {
  const localApproxHours = (date.getUTCHours() + Math.round(lng / 15) + 24) % 24;
  return `${localApproxHours.toString().padStart(2, '0')}:${date
    .getUTCMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export function getDuskString(city: CityData, now = new Date()): string {
  const times = SunCalc.getTimes(now, city.lat, city.lng);
  const localTimeString = getApproxLocalTime(now, city.lng);
  const sunsetString = times.sunset ? getApproxLocalTime(times.sunset, city.lng) : '18:00';
  return `【${city.nameNative}】${localTimeString} —— ${city.author} 在这里种下了一句夜晚。日落约 ${sunsetString}。`;
}
