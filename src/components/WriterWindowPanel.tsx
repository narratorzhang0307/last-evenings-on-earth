import { useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { WriterData } from '../lib/types';

interface WriterWindowPanelProps {
  writer: WriterData;
  onClose: () => void;
}

export function WriterWindowPanel({ writer, onClose }: WriterWindowPanelProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  useEscapeKey(true, onClose);
  const lines = writer.opening_lines.length ? writer.opening_lines : [writer.knock_text.zh_title];
  const farewellLines = writer.farewell_lines.length ? writer.farewell_lines : [writer.closed_window_text.zh];
  const activeLine = isLeaving
    ? farewellLines[lineIndex % farewellLines.length]
    : lines[lineIndex % lines.length];

  return (
    <aside
      className="writer-window-panel"
      style={{ '--writer-light': writer.lantern_color } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={`${writer.name_zh} 的夜窗`}
    >
      <button className="writer-window-close" onClick={onClose} type="button" aria-label="关闭作家夜窗">
        <X size={18} />
      </button>
      <div className="writer-window-portrait">
        <img alt="" decoding="async" draggable="false" referrerPolicy="no-referrer" src={writer.portrait} />
      </div>
      <div className="writer-window-copy">
        <p>{writer.knock_text.zh_title}</p>
        <h2>{writer.name_zh}</h2>
        <span>
          {writer.name_en} · {writer.city}
        </span>
        <blockquote>{activeLine}</blockquote>
        <div className="writer-window-actions">
          {!isLeaving && (
            <button
              className="writer-window-knock"
              onClick={() => setLineIndex((current) => current + 1)}
              type="button"
            >
              再敲一次
            </button>
          )}
          <button
            className="writer-window-knock"
            onClick={() => {
              if (isLeaving) {
                onClose();
                return;
              }
              setIsLeaving(true);
              setLineIndex(0);
            }}
            type="button"
          >
            {isLeaving ? '关窗' : '离开'}
          </button>
        </div>
        <small>{writer.soul_intro.zh}</small>
      </div>
    </aside>
  );
}
