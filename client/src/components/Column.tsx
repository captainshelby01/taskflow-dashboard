import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';
import type { Card } from '../types';

interface ColumnProps {
  id: Card['status'];
  label: string;
  cards: Card[];
  pulsingIds: Set<string>;
}

const STATUS_COLOR: Record<Card['status'], string> = {
  todo: 'var(--ochre)',
  in_progress: 'var(--clay)',
  done: 'var(--moss)',
};

export default function Column({ id, label, cards, pulsingIds }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        background: isOver ? 'rgba(255,255,255,0.5)' : 'transparent',
        borderRadius: 'var(--radius-lg)',
        padding: '0.25rem',
        minHeight: '420px',
        transition: 'background 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0 0.4rem',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: STATUS_COLOR[id],
            display: 'inline-block',
          }}
        />
        <h2
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink-soft)',
          }}
        >
          {label}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', opacity: 0.6 }}>
          {cards.length}
        </span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} isPulsing={pulsingIds.has(card.id)} />
        ))}
      </SortableContext>
    </div>
  );
}