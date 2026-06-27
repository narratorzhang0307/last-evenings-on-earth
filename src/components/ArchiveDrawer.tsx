import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Images, Search, X } from 'lucide-react';
import { POEMS } from '../data/poems';
import { WRITERS } from '../data/writers';
import { ARCHIVE_QUERY_MAX_LENGTH, archiveTextMatchesQuery, normalizeArchiveSearchText } from '../lib/archiveSearch';
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

export function ArchiveDrawer({ isOpen, onClose, onSelectPhoto, onSelectPoem, onSelectWriter }: ArchiveDrawerProps) {
  const [viewMode, setViewMode] = useState<'poems' | 'photos' | 'writers'>('photos');
  const [query, setQuery] = useState('');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const allPhotos = useAllPhotos();
  const resultStatusId = 'archive-result-status';
  useEscapeKey(isOpen && !isSubmitOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const activeQuery = normalizeArchiveSearchText(query);
  const filteredPhotos = useMemo(
    () =>
      allPhotos.filter((photo) =>
        archiveTextMatchesQuery(activeQuery, [
          photo.city,
          photo.city_zh,
          photo.country,
          photo.description,
          photo.signature,
          photo.photographer,
          photo.photographer_username,
          photo.alt_text,
          photo.source,
          photo.query_used,
          photo.original_url,
          photo.unsplash_url,
        ]),
      ),
    [activeQuery, allPhotos],
  );
  const filteredPoems = useMemo(
    () =>
      POEMS.filter((poem) =>
        archiveTextMatchesQuery(activeQuery, [
          poem.author_zh,
          poem.author_en,
          poem.title_zh,
          poem.city,
          poem.region,
          poem.translator,
          poem.author,
          poem.poem,
          poem.body_zh,
          poem.source_note,
          getPoemFirstLine(poem),
        ]),
      ),
    [activeQuery],
  );
  const filteredWriters = useMemo(
    () =>
      WRITERS.filter((writer) =>
        archiveTextMatchesQuery(activeQuery, [
          writer.name_zh,
          writer.name_en,
          writer.city,
          writer.soul_intro.zh,
          writer.soul_intro.en,
          writer.knock_text.zh_title,
          writer.knock_text.en_title,
          writer.knock_text.zh_question,
          writer.knock_text.en_question,
          writer.opening_lines,
          writer.farewell_lines,
          writer.sleeping_text.zh,
          writer.sleeping_text.en,
          writer.closed_window_text.zh,
          writer.closed_window_text.en,
        ]),
      ),
    [activeQuery],
  );
  const groupedPhotos = useMemo(() => groupPhotosByCountry(filteredPhotos), [filteredPhotos]);
  const groupedPoems = useMemo(() => groupPoemsByCountry(filteredPoems), [filteredPoems]);
  const stats = useMemo(() => getPhotoStats(filteredPhotos), [filteredPhotos]);
  const poemStats = useMemo(() => getPoemStats(filteredPoems), [filteredPoems]);
  const writerStats = useMemo(() => getWriterStats(filteredWriters), [filteredWriters]);
  const activeQueryLabel = query.trim() ? `搜索“${query.trim()}”` : '全部档案';
  const resultCountLabel =
    viewMode === 'photos'
      ? `${filteredPhotos.length} 张照片`
      : viewMode === 'poems'
        ? `${filteredPoems.length} 首诗`
        : `${filteredWriters.length} 位作家`;
  const photoViewLabel = `查看照片档案，当前筛选下有 ${filteredPhotos.length} 张照片`;
  const poemViewLabel = `查看诗歌档案，当前筛选下有 ${filteredPoems.length} 首诗`;
  const writerViewLabel = `查看作家档案，当前筛选下有 ${filteredWriters.length} 位作家`;
  const emptyTitle =
    viewMode === 'photos'
      ? '没有找到对应照片'
      : viewMode === 'poems'
        ? '没有找到对应诗歌'
        : '没有找到对应作家';
  const emptyHint =
    viewMode === 'photos'
      ? '换一个城市、国家、摄影者或照片线索试试。'
      : viewMode === 'poems'
        ? '换一个作者、城市、诗句或译者试试。'
        : '换一个作家、城市、窗灯文字或回应试试。';
  const hasResults =
    viewMode === 'photos'
      ? filteredPhotos.length > 0
      : viewMode === 'poems'
        ? filteredPoems.length > 0
        : filteredWriters.length > 0;

  if (!isOpen) return null;

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
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索城市、作者、诗句"
            maxLength={ARCHIVE_QUERY_MAX_LENGTH}
            autoComplete="off"
            spellCheck={false}
            aria-label="搜索夜晚档案"
            aria-describedby={resultStatusId}
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
            aria-label={photoViewLabel}
            aria-pressed={viewMode === 'photos'}
            onClick={() => setViewMode('photos')}
            type="button"
          >
            <span>照片</span>
            <em>{filteredPhotos.length}</em>
          </button>
          <button
            className={viewMode === 'poems' ? 'is-active' : ''}
            aria-label={poemViewLabel}
            aria-pressed={viewMode === 'poems'}
            onClick={() => setViewMode('poems')}
            type="button"
          >
            <span>诗</span>
            <em>{filteredPoems.length}</em>
          </button>
          <button
            className={viewMode === 'writers' ? 'is-active' : ''}
            aria-label={writerViewLabel}
            aria-pressed={viewMode === 'writers'}
            onClick={() => setViewMode('writers')}
            type="button"
          >
            <span>作家</span>
            <em>{filteredWriters.length}</em>
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
        <p className="archive-result-status" id={resultStatusId} role="status" aria-live="polite" aria-atomic="true">
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
            <strong>{emptyTitle}</strong>
            <span>{emptyHint}</span>
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
