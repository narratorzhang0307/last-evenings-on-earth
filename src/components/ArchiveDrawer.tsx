import { Images, X } from 'lucide-react';
import { PHOTOS } from '../data/worldPhotos';
import { getPhotoStats, groupPhotosByCountry } from '../lib/photoArchive';
import type { PhotoData } from '../lib/types';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoData) => void;
}

export function ArchiveDrawer({ isOpen, onClose, onSelectPhoto }: ArchiveDrawerProps) {
  if (!isOpen) return null;

  const groupedPhotos = groupPhotosByCountry();
  const stats = getPhotoStats();

  return (
    <aside className="archive-drawer" aria-label="night archive">
      <header className="archive-drawer-header">
        <button className="archive-drawer-close" onClick={onClose} type="button" aria-label="Close archive">
          <X size={18} />
        </button>
        <p>Archive of the Night</p>
        <h2>夜晚档案馆</h2>
        <div>
          <span>{stats.countryCount} 个国家</span>
          <span>{stats.cityCount} 座城市</span>
          <span>{PHOTOS.length} 张照片</span>
        </div>
      </header>
      <div className="archive-drawer-body">
        {Object.entries(groupedPhotos).map(([country, photos]) => (
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
        ))}
      </div>
    </aside>
  );
}

