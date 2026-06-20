import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';

interface SortableCardProps {
  card: Card;
}

export default function SortableCard({ card }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        borderRadius: '6px',
        padding: '0.75rem',
        marginBottom: '0.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        cursor: 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      {card.title}
    </div>
  );
}