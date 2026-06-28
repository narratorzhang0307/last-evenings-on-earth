import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getPoemFirstLine, regionToCountry } from '../lib/poemArchive';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { PoemPoint } from '../lib/types';

interface PoemViewerProps {
  poem: PoemPoint;
  onClose: () => void;
}

export function PoemViewer({ poem, onClose }: PoemViewerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEscapeKey(true, onClose);
  const titleId = `poem-title-${poem.id}`;
  const metaId = `poem-meta-${poem.id}`;
  const bodyLines = poem.body_zh.length ? poem.body_zh : [getPoemFirstLine(poem)];
  const lineCountId = `poem-line-count-${poem.id}`;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="poem-viewer" onClick={onClose} role="presentation">
      <article
        className="poem-viewer-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${metaId} ${lineCountId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="poem-viewer-close" onClick={onClose} type="button" aria-label="关闭诗歌">
          <X size={18} />
        </button>
        <p className="poem-viewer-kicker" id={metaId}>
          {regionToCountry(poem.region)} · {poem.city}
        </p>
        <h2 id={titleId}>《{poem.title_zh}》</h2>
        <p className="poem-viewer-author">{poem.author_zh}</p>
        <p className="sr-only" id={lineCountId}>
          当前显示 {bodyLines.length} 行诗。
        </p>
        <div className="poem-viewer-body">
          {bodyLines.map((line, index) => (
            <p key={`${poem.id}-${index}`}>{line}</p>
          ))}
        </div>
        <footer>
          {poem.translator && <span>译者：{poem.translator}</span>}
          {poem.source_note && <span>{poem.source_note}</span>}
        </footer>
      </article>
    </div>
  );
}
