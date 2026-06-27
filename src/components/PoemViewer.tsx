import { X } from 'lucide-react';
import { getPoemFirstLine, regionToCountry } from '../lib/poemArchive';
import type { PoemPoint } from '../lib/types';

interface PoemViewerProps {
  poem: PoemPoint;
  onClose: () => void;
}

export function PoemViewer({ poem, onClose }: PoemViewerProps) {
  return (
    <div className="poem-viewer" onClick={onClose} role="presentation">
      <article className="poem-viewer-card" onClick={(event) => event.stopPropagation()}>
        <button className="poem-viewer-close" onClick={onClose} type="button" aria-label="Close poem">
          <X size={18} />
        </button>
        <p className="poem-viewer-kicker">
          {regionToCountry(poem.region)} · {poem.city}
        </p>
        <h2>《{poem.title_zh}》</h2>
        <p className="poem-viewer-author">{poem.author_zh}</p>
        <div className="poem-viewer-body">
          {(poem.body_zh.length ? poem.body_zh : [getPoemFirstLine(poem)]).map((line, index) => (
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

