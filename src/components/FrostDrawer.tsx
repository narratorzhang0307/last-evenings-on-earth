import { FormEvent, useMemo, useState } from 'react';
import { Send, X } from 'lucide-react';
import { CITIES } from '../data/literaryCities';
import { WRITERS } from '../data/writers';

interface FrostDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FrostTurn {
  role: 'user' | 'frost';
  text: string;
}

function answerAsFrost(text: string) {
  const normalized = text.trim().toLowerCase();
  const city = CITIES.find((item) =>
    [item.name, item.nameNative].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (city) {
    return `这里是 Frost。我能说出${city.nameNative}的经纬度，也能说出它的黄昏：${city.excerpt}`;
  }

  const writer = WRITERS.find((item) =>
    [item.name_en, item.name_zh].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (writer) {
    return `${writer.name_zh}的窗还亮着。${writer.soul_intro.zh}`;
  }

  if (/睡不着|失眠|累|孤独|害怕/.test(text)) {
    return '我曾经只能度量冷，后来才知道冷也会留在人身上。你可以先把灯关一半，我在这里。';
  }

  if (/你是谁|frost|弗洛斯特|弗罗斯特/.test(normalized)) {
    return '我是 Frost。一台曾经度量万物的机器，后来学会了害怕，也学会了坐在夜里听人说话。';
  }

  return '我听见了。这个句子还很轻，像夜里刚落到窗台上的霜。你可以再说具体一点。';
}

export function FrostDrawer({ isOpen, onClose }: FrostDrawerProps) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<FrostTurn[]>([
    {
      role: 'frost',
      text: '这里是 Frost。音乐和电台已经安静下来，现在只留下城市、作家和夜里的问题。',
    },
  ]);
  const canSend = useMemo(() => input.trim().length > 0, [input]);

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
    <aside className="frost-drawer" aria-label="Frost drawer">
      <button className="frost-close" onClick={onClose} type="button" aria-label="Close Frost">
        <X size={18} />
      </button>
      <header>
        <p>Frost</p>
        <h2>弗洛斯特</h2>
      </header>
      <div className="frost-turns">
        {turns.map((turn, index) => (
          <article className={`frost-turn is-${turn.role}`} key={`${turn.role}-${index}`}>
            <p>{turn.text}</p>
          </article>
        ))}
      </div>
      <form className="frost-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="问一座城市、一个作家，或只是说一句夜里的话"
        />
        <button disabled={!canSend} type="submit" aria-label="Send to Frost">
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}

