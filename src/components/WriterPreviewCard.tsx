import type { CSSProperties } from 'react';
import type { WriterData } from '../lib/types';

interface WriterPreviewCardProps {
  writer: WriterData;
  onEnter: (writer: WriterData) => void;
}

export function WriterPreviewCard({ writer, onEnter }: WriterPreviewCardProps) {
  return (
    <button
      className="writer-preview-card"
      onClick={() => onEnter(writer)}
      style={{ '--writer-light': writer.lantern_color } as CSSProperties}
      type="button"
    >
      <img alt="" draggable="false" referrerPolicy="no-referrer" src={writer.portrait} />
      <span>
        <strong>{writer.name_zh}</strong>
        <em>
          {writer.name_en} · {writer.city}
        </em>
      </span>
      <p>{writer.soul_intro.zh}</p>
      <small>敲门 / Knock</small>
    </button>
  );
}
