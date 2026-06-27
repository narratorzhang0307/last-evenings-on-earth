import { Plus } from 'lucide-react';

interface SubmitPhotoCardProps {
  onClick: () => void;
}

export function SubmitPhotoCard({ onClick }: SubmitPhotoCardProps) {
  return (
    <button className="submit-photo-card" onClick={onClick} type="button">
      <span>
        <Plus size={22} />
      </span>
      <strong>留下你的黄昏</strong>
      <em>免登录 · 服务端优先</em>
    </button>
  );
}
