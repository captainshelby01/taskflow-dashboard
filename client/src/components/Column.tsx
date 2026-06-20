import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';
import type { Card } from '../types';

interface ColumnProps {
  id: Card['status'];
  label: string;
  cards: Card[];
}

export default function Column({ id, label, cards }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        background: '#ebecf0',
        borderRadius: '8px',
        padding: '1rem',
        minHeight: '400px',
      }}
    >
      <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
        {label} ({cards.length})
      </h2>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} />
        ))}
      </SortableContext>
    </div>
  );
}