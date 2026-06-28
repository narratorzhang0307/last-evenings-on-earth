import SunCalc from 'suncalc';
import { getApproxLocalTime } from './dusk';
import { getPhotosForCity } from './photoArchive';
import { getPoemFirstLine, getPoemsForCity } from './poemArchive';
import { getWritersForCity } from './writerArchive';
import type { CityData, PhotoData } from './types';

export interface RadioSegment {
  id: string;
  label: string;
  title: string;
  text: string;
  meta: string;
}

export interface RadioBriefing {
  cityId: string;
  stationName: string;
  frequency: string;
  location: string;
  localTime: string;
  sunsetStatus: string;
  summary: string;
  segments: RadioSegment[];
}

interface RadioBriefingOptions {
  now?: Date;
  photos?: PhotoData[];
}

function getStationFrequency(city: CityData) {
  const seed = Math.abs(Math.round(city.lat * 10) * 7 + Math.round(city.lng * 10) * 11);
  return `${(88 + (seed % 200) / 10).toFixed(1)} FM`;
}

function getSunsetStatus(city: CityData, now: Date) {
  const sunset = SunCalc.getTimes(now, city.lat, city.lng).sunset;
  if (!sunset) return '日落时间暂不可知';

  const diffMins = Math.round((now.getTime() - sunset.getTime()) / 60000);
  if (diffMins > 90) return `日落已过去 ${Math.round(diffMins / 60)} 小时`;
  if (diffMins > 0) return `日落已过去 ${diffMins} 分钟`;
  if (diffMins < -90) return `距日落约 ${Math.abs(Math.round(diffMins / 60))} 小时`;
  if (diffMins < 0) return `距日落约 ${Math.abs(diffMins)} 分钟`;
  return '此刻正贴近日落线';
}

function trimSentence(text: string, limit = 92) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}...` : cleaned;
}

export function buildRadioBriefing(city: CityData, options: RadioBriefingOptions = {}): RadioBriefing {
  const now = options.now || new Date();
  const photos = getPhotosForCity(city, 4, options.photos);
  const poems = getPoemsForCity(city, 2);
  const writers = getWritersForCity(city);
  const localTime = `${getApproxLocalTime(now, city.lng)} 当地时间`;
  const sunsetStatus = getSunsetStatus(city, now);
  const stationName = `${city.nameNative} 夜航电台`;
  const frequency = getStationFrequency(city);
  const poemLine = poems[0] ? getPoemFirstLine(poems[0]) : city.poems[0] || city.excerpt;
  const writerLine = writers[0]
    ? `${writers[0].name_zh}的窗前还亮着一小块光：${writers[0].soul_intro.zh}`
    : `${city.author}留下的句子仍在街角回声里停留。`;

  return {
    cityId: city.id,
    stationName,
    frequency,
    location: `${city.country} · ${city.name}`,
    localTime,
    sunsetStatus,
    summary: `${stationName}以${frequency}标记${city.nameNative}此刻的夜色，串联城市时间、照片、诗句和作家夜窗。`,
    segments: [
      {
        id: `${city.id}-call`,
        label: '台呼',
        title: `${stationName} · ${frequency}`,
        meta: localTime,
        text: `${city.nameNative}，${city.country}，${localTime}。${sunsetStatus}，今晚先从${city.author}留下的城市暗面开始。`,
      },
      {
        id: `${city.id}-city`,
        label: '城市',
        title: `${city.author}的街道`,
        meta: city.book,
        text: trimSentence(`${city.excerpt} 这句被放在${city.nameNative}的夜色里，成为本段播报的坐标。`),
      },
      {
        id: `${city.id}-photos`,
        label: '照片',
        title: photos.length ? `${photos.length} 张城市切片` : '等待第一张夜色切片',
        meta: photos[0]?.photographer || photos[0]?.city_zh || city.nameNative,
        text: photos.length
          ? `照片档案里有${photos.length}个可停靠的视角，最近的一张指向${photos[0].city_zh || photos[0].city || city.nameNative}。`
          : `${city.nameNative}暂时没有入列照片，面板会先保留城市和文字信号。`,
      },
      {
        id: `${city.id}-poems`,
        label: '诗句',
        title: poems[0] ? `《${poems[0].title_zh}》` : '城市诗句',
        meta: poems[0]?.author_zh || city.author,
        text: trimSentence(`${poemLine} 这一句被收进电台模式，作为${city.nameNative}的夜间短波。`),
      },
      {
        id: `${city.id}-writers`,
        label: '夜窗',
        title: writers[0] ? writers[0].name_zh : city.author,
        meta: writers.length ? `${writers.length} 扇附近夜窗` : '文学回声',
        text: trimSentence(writerLine, 110),
      },
    ],
  };
}
