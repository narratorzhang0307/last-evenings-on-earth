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
      aria-label={`进入${writer.name_zh}的夜窗，${writer.city}`}
      onClick={() => onEnter(writer)}
      style={{ '--writer-light': writer.lantern_color } as CSSProperties}
      type="button"
    >
      <img alt="" decoding="async" draggable="false" loading="lazy" referrerPolicy="no-referrer" src={writer.portrait} />
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
