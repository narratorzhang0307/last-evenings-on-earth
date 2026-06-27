import { X } from 'lucide-react';
import { useEffect } from 'react';
import SunCalc from 'suncalc';
import { getApproxLocalTime } from '../lib/dusk';
import { getWritersForCity } from '../lib/writerArchive';
import type { CityData, WriterData } from '../lib/types';

interface CityDetailsPanelProps {
  city: CityData | null;
  onClose: () => void;
  onSelectWriter?: (writer: WriterData) => void;
}

function getSunsetDistance(city: CityData, now = new Date()) {
  const times = SunCalc.getTimes(now, city.lat, city.lng);
  if (!times.sunset) return '日落时间暂不可知';

  const diffMins = Math.round((now.getTime() - times.sunset.getTime()) / 60000);
  if (diffMins > 60) return `日落已过去 ${Math.round(diffMins / 60)} 小时`;
  if (diffMins > 0) return `日落已过去 ${diffMins} 分钟`;
  if (diffMins < -60) return `距日落约 ${Math.abs(Math.round(diffMins / 60))} 小时`;
  if (diffMins < 0) return `距日落约 ${Math.abs(diffMins)} 分钟`;
  return '此刻正接近日落';
}

export function CityDetailsPanel({ city, onClose, onSelectWriter }: CityDetailsPanelProps) {
  useEffect(() => {
    if (!city) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [city, onClose]);

  if (!city) return null;

  const now = new Date();
  const localTime = `${getApproxLocalTime(now, city.lng)} LOCAL`;
  const sunsetDistance = getSunsetDistance(city, now);
  const writers = getWritersForCity(city);

  return (
    <aside className="city-details" aria-label={`${city.nameNative} details`}>
      <button className="city-details-close" type="button" onClick={onClose} aria-label="关闭城市详情">
        <X size={18} strokeWidth={1.8} />
      </button>

      <header className="city-details-header">
        <div>
          <p className="city-details-kicker">{city.country}</p>
          <h2>{city.nameNative}</h2>
          <span>{city.name}</span>
        </div>
        <div className="city-details-time">
          <strong>{localTime}</strong>
          <span>{sunsetDistance}</span>
        </div>
      </header>

      <section className="city-details-book" aria-label="literary source">
        <p>{city.excerpt}</p>
        <span>
          {city.author} · {city.book}
        </span>
      </section>

      <section className="city-details-poems" aria-label="night lines">
        {city.poems.map((poem) => (
          <blockquote key={poem}>
            <p>{poem}</p>
          </blockquote>
        ))}
      </section>

      {!!writers.length && (
        <section className="city-details-writers" aria-label="nearby writers">
          <h3>附近夜窗</h3>
          {writers.map((writer) => (
            <button key={writer.id} onClick={() => onSelectWriter?.(writer)} type="button">
              <span>{writer.name_zh}</span>
              <em>{writer.soul_intro.zh}</em>
            </button>
          ))}
        </section>
      )}
    </aside>
  );
}
