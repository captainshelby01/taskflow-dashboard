import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';

interface SortableCardProps {
  card: Card;
  isPulsing?: boolean;
}

const STATUS_COLOR: Record<Card['status'], string> = {
  todo: 'var(--ochre)',
  in_progress: 'var(--clay)',
  done: 'var(--moss)',
};

export default function SortableCard({ card, isPulsing }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={isPulsing ? 'card-pulse' : undefined}
      style={{
        ...style,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${STATUS_COLOR[card.status]}`,
        padding: '0.85rem 1rem',
        marginBottom: '0.6rem',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.95 : 1,
        scale: isDragging ? '1.03' : '1',
        fontSize: '0.92rem',
        color: 'var(--ink)',
        position: 'relative' as const,
      }}
      {...attributes}
      {...listeners}
    >
      {card.title}
    </div>
  );
}