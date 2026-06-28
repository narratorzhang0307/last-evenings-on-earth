import { useEffect, useMemo, useRef } from 'react';
import { Radio, X } from 'lucide-react';
import { buildRadioBriefing } from '../lib/radioMode';
import { useEscapeKey } from '../lib/useEscapeKey';
import type { CityData, PhotoData } from '../lib/types';

interface RadioModePanelProps {
  city: CityData;
  photos?: PhotoData[];
  onClose: () => void;
}

export function RadioModePanel({ city, photos = [], onClose }: RadioModePanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const briefing = useMemo(() => buildRadioBriefing(city, { photos }), [city, photos]);
  const titleId = `radio-mode-title-${city.id}`;
  const summaryId = `radio-mode-summary-${city.id}`;

  useEscapeKey(true, onClose);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [city.id]);

  return (
    <aside className="radio-mode-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={summaryId}>
      <button ref={closeButtonRef} className="radio-mode-close" type="button" onClick={onClose} aria-label="关闭电台模式">
        <X size={18} strokeWidth={1.8} />
      </button>

      <header className="radio-mode-header">
        <p>
          <Radio size={15} strokeWidth={1.8} />
          电台模式
        </p>
        <h2 id={titleId}>{briefing.stationName}</h2>
        <span>
          {briefing.frequency} · {briefing.location}
        </span>
      </header>

      <p className="radio-mode-summary" id={summaryId}>
        {briefing.summary}
      </p>

      <div className="radio-mode-meter" aria-label="当前城市电台状态">
        <span>{briefing.localTime}</span>
        <strong>{briefing.sunsetStatus}</strong>
      </div>

      <section className="radio-mode-segments" aria-label="电台模式片段">
        {briefing.segments.map((segment, index) => (
          <article key={segment.id} className="radio-mode-segment">
            <div>
              <span>{segment.label}</span>
              <em>{String(index + 1).padStart(2, '0')}</em>
            </div>
            <h3>{segment.title}</h3>
            <p>{segment.text}</p>
            <small>{segment.meta}</small>
          </article>
        ))}
      </section>
    </aside>
  );
}
