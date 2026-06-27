import { ExternalLink, X } from 'lucide-react';
import type { PhotoData } from '../lib/types';

interface PhotoViewerProps {
  photo: PhotoData;
  onClose: () => void;
}

export function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  const sourceLabel = photo.source === 'pexels' ? 'Pexels' : 'Unsplash';
  const sourceUrl = photo.unsplash_url || photo.photographer_url;

  return (
    <div className="photo-viewer" onClick={onClose} role="presentation">
      <article className="photo-viewer-card" onClick={(event) => event.stopPropagation()}>
        <button className="photo-viewer-close" onClick={onClose} type="button" aria-label="Close photo">
          <X size={18} />
        </button>
        <div className="photo-viewer-image" style={{ backgroundColor: photo.color || '#191713' }}>
          <img
            alt={photo.alt_text || photo.city_zh || photo.city || 'Night archive photo'}
            draggable="false"
            referrerPolicy="no-referrer"
            src={photo.original_url || photo.url}
          />
        </div>
        <footer className="photo-viewer-caption">
          <p>{photo.query_used || 'ARCHIVE FRAGMENT'}</p>
          <h2>{photo.city_zh || photo.city}</h2>
          <div>
            {photo.photographer && <span>Photo by {photo.photographer}</span>}
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {sourceLabel}
              </a>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}

