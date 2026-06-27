import { useState, type CSSProperties } from 'react';
import { Images, X } from 'lucide-react';
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

export function ArchiveDrawer({ isOpen, onClose, onSelectPhoto, onSelectPoem, onSelectWriter }: ArchiveDrawerProps) {
  const [viewMode, setViewMode] = useState<'poems' | 'photos' | 'writers'>('photos');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const allPhotos = useAllPhotos();
  useEscapeKey(isOpen && !isSubmitOpen, onClose);

  if (!isOpen) return null;

  const groupedPhotos = groupPhotosByCountry(allPhotos);
  const groupedPoems = groupPoemsByCountry();
  const stats = getPhotoStats(allPhotos);
  const poemStats = getPoemStats();
  const writerStats = getWriterStats();

  return (
    <aside className="archive-drawer" aria-label="夜晚档案馆">
      <header className="archive-drawer-header">
        <button className="archive-drawer-close" onClick={onClose} type="button" aria-label="关闭夜晚档案馆">
          <X size={18} />
        </button>
        <p>夜晚档案</p>
        <h2>夜晚档案馆</h2>
        <nav className="archive-view-toggle" aria-label="档案视图">
          <button
            className={viewMode === 'photos' ? 'is-active' : ''}
            onClick={() => setViewMode('photos')}
            type="button"
          >
            照片
          </button>
          <button
            className={viewMode === 'poems' ? 'is-active' : ''}
            onClick={() => setViewMode('poems')}
            type="button"
          >
            诗
          </button>
          <button
            className={viewMode === 'writers' ? 'is-active' : ''}
            onClick={() => setViewMode('writers')}
            type="button"
          >
            作家
          </button>
        </nav>
        <div>
          <span>
            {viewMode === 'writers' ? `${writerStats.cityCount} 座城市` : `${viewMode === 'photos' ? stats.countryCount : poemStats.countryCount} 个国家`}
          </span>
          <span>
            {viewMode === 'photos'
              ? `${stats.cityCount} 座城市`
              : viewMode === 'poems'
                ? `${poemStats.authorCount} 位作者`
                : `${writerStats.cityCount} 扇窗`}
          </span>
          <span>
            {viewMode === 'photos'
              ? `${stats.photoCount} 张照片`
              : viewMode === 'poems'
                ? `${poemStats.poemCount} 首诗`
                : `${writerStats.writerCount} 位作家`}
          </span>
        </div>
      </header>
      <div className="archive-drawer-body">
        {viewMode === 'photos' && (
          <div className="archive-submit-entry">
            <SubmitPhotoCard onClick={() => setIsSubmitOpen(true)} />
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
                      onClick={() => onSelectPhoto(photo)}
                      style={{ backgroundColor: photo.color || '#191713' }}
                      type="button"
                    >
                      <img
                        alt={photo.alt_text || photo.city_zh || photo.city || '夜晚档案照片'}
                        draggable="false"
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
              <em>{WRITERS.length}</em>
            </h3>
            <div className="archive-writer-list">
              {WRITERS.map((writer) => (
                <button
                  className="archive-writer"
                  key={writer.id}
                  onClick={() => onSelectWriter?.(writer)}
                  style={{ '--writer-light': writer.lantern_color } as CSSProperties}
                  type="button"
                >
                  <img alt="" draggable="false" referrerPolicy="no-referrer" src={writer.portrait} />
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
