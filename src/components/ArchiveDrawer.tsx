import { useState } from 'react';
import { Images, X } from 'lucide-react';
import { PHOTOS } from '../data/worldPhotos';
import { getPhotoStats, groupPhotosByCountry } from '../lib/photoArchive';
import { getPoemFirstLine, getPoemStats, groupPoemsByCountry } from '../lib/poemArchive';
import type { PhotoData, PoemPoint } from '../lib/types';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoData) => void;
  onSelectPoem?: (poem: PoemPoint) => void;
}

export function ArchiveDrawer({ isOpen, onClose, onSelectPhoto, onSelectPoem }: ArchiveDrawerProps) {
  const [viewMode, setViewMode] = useState<'poems' | 'photos'>('photos');

  if (!isOpen) return null;

  const groupedPhotos = groupPhotosByCountry();
  const groupedPoems = groupPoemsByCountry();
  const stats = getPhotoStats();
  const poemStats = getPoemStats();
  const activeStats = viewMode === 'photos' ? stats : poemStats;

  return (
    <aside className="archive-drawer" aria-label="night archive">
      <header className="archive-drawer-header">
        <button className="archive-drawer-close" onClick={onClose} type="button" aria-label="Close archive">
          <X size={18} />
        </button>
        <p>Archive of the Night</p>
        <h2>夜晚档案馆</h2>
        <nav className="archive-view-toggle" aria-label="archive view">
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
        </nav>
        <div>
          <span>{activeStats.countryCount} 个国家</span>
          <span>
            {viewMode === 'photos' ? `${stats.cityCount} 座城市` : `${poemStats.authorCount} 位作者`}
          </span>
          <span>{viewMode === 'photos' ? `${PHOTOS.length} 张照片` : `${poemStats.poemCount} 首诗`}</span>
        </div>
      </header>
      <div className="archive-drawer-body">
        {viewMode === 'photos'
          ? Object.entries(groupedPhotos).map(([country, photos]) => (
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
                        alt={photo.alt_text || photo.city_zh || photo.city || 'Night archive photo'}
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
            ))
          : Object.entries(groupedPoems).map(([country, poems]) => (
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
      </div>
    </aside>
  );
}
