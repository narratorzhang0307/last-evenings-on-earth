import { useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { WriterData } from '../lib/types';

interface WriterWindowPanelProps {
  writer: WriterData;
  onClose: () => void;
}

export function WriterWindowPanel({ writer, onClose }: WriterWindowPanelProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const lines = writer.opening_lines.length ? writer.opening_lines : [writer.knock_text.zh_title];
  const activeLine = lines[lineIndex % lines.length];

  return (
    <aside
      className="writer-window-panel"
      style={{ '--writer-light': writer.lantern_color } as CSSProperties}
      aria-label={`${writer.name_zh} window`}
    >
      <button className="writer-window-close" onClick={onClose} type="button" aria-label="Close writer window">
        <X size={18} />
      </button>
      <div className="writer-window-portrait">
        <img alt="" draggable="false" referrerPolicy="no-referrer" src={writer.portrait} />
      </div>
      <div className="writer-window-copy">
        <p>{writer.knock_text.zh_title}</p>
        <h2>{writer.name_zh}</h2>
        <span>
          {writer.name_en} · {writer.city}
        </span>
        <blockquote>{activeLine}</blockquote>
        <button
          className="writer-window-knock"
          onClick={() => setLineIndex((current) => current + 1)}
          type="button"
        >
          再敲一次
        </button>
        <small>{writer.soul_intro.zh}</small>
      </div>
    </aside>
  );
}
