import type { PhotoData } from '../lib/types';

interface PhotoStripProps {
  photos: PhotoData[];
  onSelectPhoto: (photo: PhotoData) => void;
}

export function PhotoStrip({ photos, onSelectPhoto }: PhotoStripProps) {
  if (!photos.length) return null;

  return (
    <div className="photo-strip" aria-label="城市照片档案">
      {photos.map((photo) => (
        <button
          className="photo-strip-item"
          key={photo.id}
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
            <strong>{photo.city_zh || photo.city}</strong>
            {photo.photographer && <em>{photo.photographer}</em>}
          </span>
        </button>
      ))}
    </div>
  );
}
