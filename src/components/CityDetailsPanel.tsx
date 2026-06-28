import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import SunCalc from 'suncalc';
import { getApproxLocalTime } from '../lib/dusk';
import { getPhotosForCity } from '../lib/photoArchive';
import { getPoemFirstLine, getPoemsForCity } from '../lib/poemArchive';
import { getWritersForCity } from '../lib/writerArchive';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { CityData, PhotoData, PoemPoint, WriterData } from '../lib/types';

interface CityDetailsPanelProps {
  city: CityData | null;
  onClose: () => void;
  photos?: PhotoData[];
  onSelectPhoto?: (photo: PhotoData) => void;
  onSelectPoem?: (poem: PoemPoint) => void;
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

export function CityDetailsPanel({ city, onClose, photos = [], onSelectPhoto, onSelectPoem, onSelectWriter }: CityDetailsPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEscapeKey(!!city, onClose);

  useEffect(() => {
    if (city) closeButtonRef.current?.focus();
  }, [city]);

  if (!city) return null;

  const now = new Date();
  const localTime = `${getApproxLocalTime(now, city.lng)} 当地时间`;
  const sunsetDistance = getSunsetDistance(city, now);
  const writers = getWritersForCity(city);
  const cityPhotos = getPhotosForCity(city, 3, photos);
  const archivePoems = getPoemsForCity(city, 3);
  const titleId = `city-details-title-${city.id}`;
  const summaryId = `city-details-summary-${city.id}`;
  const summaryText = `${city.nameNative}，${city.country}。${localTime}，${sunsetDistance}。关联 ${cityPhotos.length} 张照片、${archivePoems.length} 首档案诗歌、${writers.length} 扇附近夜窗。`;

  return (
    <aside className="city-details" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={summaryId}>
      <button ref={closeButtonRef} className="city-details-close" type="button" onClick={onClose} aria-label="关闭城市详情">
        <X size={18} strokeWidth={1.8} />
      </button>

      <header className="city-details-header">
        <div>
          <p className="city-details-kicker">{city.country}</p>
          <h2 id={titleId}>{city.nameNative}</h2>
          <span>{city.name}</span>
        </div>
        <div className="city-details-time">
          <strong>{localTime}</strong>
          <span>{sunsetDistance}</span>
        </div>
      </header>
      <p className="sr-only" id={summaryId}>
        {summaryText}
      </p>

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
              <button
                key={photo.id}
                aria-label={`查看${photo.city_zh || photo.city || city.nameNative}照片`}
                onClick={() => onSelectPhoto?.(photo)}
                type="button"
              >
                <img
                  alt={photo.alt_text || photo.city_zh || photo.city || '城市照片'}
                  decoding="async"
                  draggable="false"
                  loading="lazy"
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

      {!!archivePoems.length && (
        <section className="city-details-archive-poems" aria-label="档案诗歌">
          <h3>档案里的诗</h3>
          {archivePoems.map((poem) => (
            <button
              key={poem.id}
              aria-label={`打开${poem.author_zh}《${poem.title_zh}》`}
              onClick={() => onSelectPoem?.(poem)}
              type="button"
            >
              <strong>{poem.author_zh}</strong>
              <span>《{poem.title_zh}》</span>
              <em>{getPoemFirstLine(poem)}</em>
            </button>
          ))}
        </section>
      )}

      {!!writers.length && (
        <section className="city-details-writers" aria-label="附近作家">
          <h3>附近夜窗</h3>
          {writers.map((writer) => (
            <button
              key={writer.id}
              aria-label={`进入${writer.name_zh}的夜窗`}
              onClick={() => onSelectWriter?.(writer)}
              type="button"
            >
              <span>{writer.name_zh}</span>
              <em>{writer.soul_intro.zh}</em>
            </button>
          ))}
        </section>
      )}
    </aside>
  );
}
