import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { WriterData } from '../lib/types';

interface WriterWindowPanelProps {
  writer: WriterData;
  onClose: () => void;
}

export function WriterWindowPanel({ writer, onClose }: WriterWindowPanelProps) {
  const firstLine = writer.opening_lines[0] || writer.knock_text.zh_title;

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
        <blockquote>{firstLine}</blockquote>
        <small>{writer.soul_intro.zh}</small>
      </div>
    </aside>
  );
}
