import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { PhotoData } from '../lib/types';

interface PhotoViewerProps {
  photo: PhotoData;
  onClose: () => void;
}

function formatSubmittedAt(value?: number) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sourceLabel = photo.source === 'pexels' ? 'Pexels' : 'Unsplash';
  const sourceUrl = photo.unsplash_url || photo.photographer_url;
  const title = photo.city_zh || photo.city || '未命名地点';
  const locationLine = [photo.city_zh || photo.city, photo.country].filter(Boolean).join(' · ');
  const submittedAtLabel = formatSubmittedAt(photo.submittedAt);
  const collectionLabel = photo.query_used || (photo.isUserSubmitted ? '黄昏投稿' : '夜晚档案');
  const titleId = `photo-title-${photo.id}`;
  const metaId = `photo-meta-${photo.id}`;
  useEscapeKey(true, onClose);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="photo-viewer" onClick={onClose} role="presentation">
      <article
        className="photo-viewer-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={metaId}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="photo-viewer-close" onClick={onClose} type="button" aria-label="关闭照片">
          <X size={18} />
        </button>
        <div className="photo-viewer-image" style={{ backgroundColor: photo.color || '#191713' }}>
          <img
            alt={photo.alt_text || photo.city_zh || photo.city || '夜晚档案照片'}
            decoding="async"
            draggable="false"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            src={photo.original_url || photo.url}
          />
        </div>
        <footer className="photo-viewer-caption">
          <p className="photo-viewer-kicker">{collectionLabel}</p>
          <h2 id={titleId}>{title}</h2>
          {photo.description && <p className="photo-viewer-description">{photo.description}</p>}
          <div className="photo-viewer-meta" id={metaId}>
            {locationLine && <span>{locationLine}</span>}
            {photo.signature && <span>署名：{photo.signature}</span>}
            {submittedAtLabel && <span>记录于{submittedAtLabel}</span>}
            {photo.photographer && <span>摄影：{photo.photographer}</span>}
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
