import { X } from 'lucide-react';
import SunCalc from 'suncalc';
import { getApproxLocalTime } from '../lib/dusk';
import { getPhotosForCity } from '../lib/photoArchive';
import { getWritersForCity } from '../lib/writerArchive';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { CityData, PhotoData, WriterData } from '../lib/types';

interface CityDetailsPanelProps {
  city: CityData | null;
  onClose: () => void;
  photos?: PhotoData[];
  onSelectPhoto?: (photo: PhotoData) => void;
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

export function CityDetailsPanel({ city, onClose, photos = [], onSelectPhoto, onSelectWriter }: CityDetailsPanelProps) {
  useEscapeKey(!!city, onClose);

  if (!city) return null;

  const now = new Date();
  const localTime = `${getApproxLocalTime(now, city.lng)} 当地时间`;
  const sunsetDistance = getSunsetDistance(city, now);
  const writers = getWritersForCity(city);
  const cityPhotos = getPhotosForCity(city, 3, photos);

  return (
    <aside className="city-details" role="dialog" aria-modal="true" aria-label={`${city.nameNative} 城市详情`}>
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

      <section className="city-details-book" aria-label="文学出处">
        <p>{city.excerpt}</p>
        <span>
          {city.author} · {city.book}
        </span>
      </section>

      {!!cityPhotos.length && (
        <section className="city-details-photos" aria-label="城市照片">
          <h3>这座城市的照片</h3>
          <div>
            {cityPhotos.map((photo) => (
              <button key={photo.id} onClick={() => onSelectPhoto?.(photo)} type="button">
                <img
                  alt={photo.alt_text || photo.city_zh || photo.city || '城市照片'}
                  draggable="false"
                  referrerPolicy="no-referrer"
                  src={photo.url}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="city-details-poems" aria-label="夜晚诗句">
        {city.poems.map((poem) => (
          <blockquote key={poem}>
            <p>{poem}</p>
          </blockquote>
        ))}
      </section>

      {!!writers.length && (
        <section className="city-details-writers" aria-label="附近作家">
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
