import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { answerAsFrost } from '../lib/frostBrain';
import { useEscapeKey } from '../lib/useEscapeKey';

interface FrostDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FrostTurn {
  role: 'user' | 'frost';
  text: string;
}

export function FrostDrawer({ isOpen, onClose }: FrostDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<FrostTurn[]>([
    {
      role: 'frost',
      text: '这里是弗洛斯特。音乐和电台已经安静下来，现在只留下城市、作家和夜里的问题。',
    },
  ]);
  const canSend = useMemo(() => input.trim().length > 0, [input]);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    setTurns((current) => [
      ...current,
      { role: 'user', text: message },
      { role: 'frost', text: answerAsFrost(message) },
    ]);
    setInput('');
  };

  return (
    <aside className="frost-drawer" role="dialog" aria-modal="true" aria-label="弗洛斯特夜谈">
      <button className="frost-close" onClick={onClose} type="button" aria-label="关闭弗洛斯特夜谈">
        <X size={18} />
      </button>
      <header>
        <p>弗洛斯特</p>
        <h2>弗洛斯特</h2>
      </header>
      <div className="frost-turns" aria-live="polite">
        {turns.map((turn, index) => (
          <article className={`frost-turn is-${turn.role}`} key={`${turn.role}-${index}`}>
            <p>{turn.text}</p>
          </article>
        ))}
      </div>
      <form className="frost-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="问一座城市、一个作家，或只是说一句夜里的话"
        />
        <button disabled={!canSend} type="submit" aria-label="发送给弗洛斯特">
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
