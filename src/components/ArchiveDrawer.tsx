import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Images, Search, X } from 'lucide-react';
import { POEMS } from '../data/poems';
import { WRITERS } from '../data/writers';
import { useAllPhotos } from '../lib/localUserPhotos';
import { getPhotoStats, groupPhotosByCountry } from '../lib/photoArchive';
import { getPoemFirstLine, getPoemStats, groupPoemsByCountry } from '../lib/poemArchive';
import { getWriterStats } from '../lib/writerArchive';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { PhotoData, PoemPoint, WriterData } from '../lib/types';
import { PhotoSubmitModal } from './PhotoSubmitModal';
import { SubmitPhotoCard } from './SubmitPhotoCard';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoData) => void;
  onSelectPoem?: (poem: PoemPoint) => void;
  onSelectWriter?: (writer: WriterData) => void;
}

function textIncludesQuery(query: string, values: Array<string | number | undefined>) {
  if (!query) return true;
  return values.some((value) => String(value || '').toLowerCase().includes(query));
}

export function ArchiveDrawer({ isOpen, onClose, onSelectPhoto, onSelectPoem, onSelectWriter }: ArchiveDrawerProps) {
  const [viewMode, setViewMode] = useState<'poems' | 'photos' | 'writers'>('photos');
  const [query, setQuery] = useState('');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const allPhotos = useAllPhotos();
  useEscapeKey(isOpen && !isSubmitOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeQuery = query.trim().toLowerCase();
  const filteredPhotos = allPhotos.filter((photo) =>
    textIncludesQuery(activeQuery, [
      photo.city,
      photo.city_zh,
      photo.country,
      photo.description,
      photo.signature,
      photo.photographer,
      photo.query_used,
    ]),
  );
  const filteredPoems = POEMS.filter((poem) =>
    textIncludesQuery(activeQuery, [
      poem.author_zh,
      poem.author_en,
      poem.title_zh,
      poem.city,
      poem.region,
      poem.translator,
      getPoemFirstLine(poem),
    ]),
  );
  const filteredWriters = WRITERS.filter((writer) =>
    textIncludesQuery(activeQuery, [
      writer.name_zh,
      writer.name_en,
      writer.city,
      writer.soul_intro.zh,
      writer.knock_text.zh_title,
    ]),
  );
  const groupedPhotos = groupPhotosByCountry(filteredPhotos);
  const groupedPoems = groupPoemsByCountry(filteredPoems);
  const stats = getPhotoStats(filteredPhotos);
  const poemStats = getPoemStats(filteredPoems);
  const writerStats = getWriterStats(filteredWriters);
  const activeQueryLabel = query.trim() ? `搜索“${query.trim()}”` : '全部档案';
  const resultCountLabel =
    viewMode === 'photos'
      ? `${filteredPhotos.length} 张照片`
      : viewMode === 'poems'
        ? `${filteredPoems.length} 首诗`
        : `${filteredWriters.length} 位作家`;
  const hasResults =
    viewMode === 'photos'
      ? filteredPhotos.length > 0
      : viewMode === 'poems'
        ? filteredPoems.length > 0
        : filteredWriters.length > 0;

  return (
    <aside className="archive-drawer" role="dialog" aria-modal="true" aria-label="夜晚档案馆">
      <header className="archive-drawer-header">
        <button className="archive-drawer-close" onClick={onClose} type="button" aria-label="关闭夜晚档案馆">
          <X size={18} />
        </button>
        <p>夜晚档案</p>
        <h2>夜晚档案馆</h2>
        <div className="archive-search" role="search">
          <Search size={14} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索城市、作者、诗句"
            aria-label="搜索夜晚档案"
          />
          {query && (
            <button onClick={() => setQuery('')} type="button" aria-label="清空搜索">
              <X size={13} />
            </button>
          )}
        </div>
        <nav className="archive-view-toggle" aria-label="档案视图">
          <button
            className={viewMode === 'photos' ? 'is-active' : ''}
            aria-pressed={viewMode === 'photos'}
            onClick={() => setViewMode('photos')}
            type="button"
          >
            照片
          </button>
          <button
            className={viewMode === 'poems' ? 'is-active' : ''}
            aria-pressed={viewMode === 'poems'}
            onClick={() => setViewMode('poems')}
            type="button"
          >
            诗
          </button>
          <button
            className={viewMode === 'writers' ? 'is-active' : ''}
            aria-pressed={viewMode === 'writers'}
            onClick={() => setViewMode('writers')}
            type="button"
          >
            作家
          </button>
        </nav>
        <div className="archive-drawer-stats">
          <span>
            {viewMode === 'writers' ? `${writerStats.cityCount} 座城市` : `${viewMode === 'photos' ? stats.countryCount : poemStats.countryCount} 个国家`}
          </span>
          <span>
            {viewMode === 'photos'
              ? `${stats.cityCount} 座城市`
              : viewMode === 'poems'
                ? `${poemStats.authorCount} 位作者`
                : `${writerStats.writerCount} 扇窗`}
          </span>
          <span>
            {viewMode === 'photos'
              ? `${stats.photoCount} 张照片`
              : viewMode === 'poems'
                ? `${poemStats.poemCount} 首诗`
                : `${writerStats.writerCount} 位作家`}
          </span>
        </div>
        <p className="archive-result-status" aria-live="polite">
          {activeQueryLabel}，当前显示 {resultCountLabel}
        </p>
      </header>
      <div className="archive-drawer-body">
        {viewMode === 'photos' && (
          <div className="archive-submit-entry">
            <SubmitPhotoCard onClick={() => setIsSubmitOpen(true)} />
          </div>
        )}
        {!hasResults && (
          <div className="archive-empty">
            <strong>没有找到对应档案</strong>
            <span>换一个城市、作者或关键词试试。</span>
            {activeQuery && (
              <button className="archive-empty-clear" onClick={() => setQuery('')} type="button">
                清空搜索
              </button>
            )}
          </div>
        )}
        {viewMode === 'photos' &&
          Object.entries(groupedPhotos).map(([country, photos]) => (
              <section className="archive-country" key={country}>
                <h3>
                  <span>{country}</span>
                  <em>{photos.length}</em>
                </h3>
                <div className="archive-photo-grid">
                  {photos.map((photo) => (
                    <button
                      className="archive-photo"
                      key={photo.id}
                      aria-label={`${photo.city_zh || photo.city || '未命名照片'}，${country}，照片档案`}
                      onClick={() => onSelectPhoto(photo)}
                      style={{ backgroundColor: photo.color || '#191713' }}
                      type="button"
                    >
                      <img
                        alt={photo.alt_text || photo.city_zh || photo.city || '夜晚档案照片'}
                        decoding="async"
                        draggable="false"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        src={photo.url}
                      />
                      <span>
                        <Images size={13} />
                        {photo.city_zh || photo.city}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
        {viewMode === 'poems' &&
          Object.entries(groupedPoems).map(([country, poems]) => (
              <section className="archive-country" key={country}>
                <h3>
                  <span>{country}</span>
                  <em>{poems.length}</em>
                </h3>
                <div className="archive-poem-list">
                  {poems.map((poem) => (
                    <button
                      className="archive-poem"
                      key={poem.id}
                      aria-label={`${poem.author_zh}，《${poem.title_zh}》，${poem.city}，诗歌档案`}
                      onClick={() => onSelectPoem?.(poem)}
                      type="button"
                    >
                      <strong>{poem.author_zh}</strong>
                      <span>《{poem.title_zh}》</span>
                      <em>{getPoemFirstLine(poem)}</em>
                    </button>
                  ))}
                </div>
              </section>
            ))}
        {viewMode === 'writers' && (
          <section className="archive-country">
            <h3>
              <span>夜晚的人</span>
              <em>{filteredWriters.length}</em>
            </h3>
            <div className="archive-writer-list">
              {filteredWriters.map((writer) => (
                <button
                  className="archive-writer"
                  key={writer.id}
                  aria-label={`${writer.name_zh}，${writer.name_en}，${writer.city}，作家窗灯`}
                  onClick={() => onSelectWriter?.(writer)}
                  style={{ '--writer-light': writer.lantern_color } as CSSProperties}
                  type="button"
                >
                  <img
                    alt=""
                    decoding="async"
                    draggable="false"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={writer.portrait}
                  />
                  <span>
                    <strong>{writer.name_zh}</strong>
                    <em>
                      {writer.name_en} · {writer.city}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      <PhotoSubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitted={(photo) => {
          setViewMode('photos');
          onSelectPhoto(photo);
        }}
      />
    </aside>
  );
}
