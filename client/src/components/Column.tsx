import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard, { STATUS_COLOR } from './SortableCard';
import { playHaptic } from '../lib/sound';
import type { Card } from '../types';

interface ColumnProps {
  id: Card['status'];
  label: string;
  cards: Card[];
  pulsingIds: Set<string>;
  onSelectCard?: (card: Card) => void;
  onAddCard?: (title: string, status: Card['status']) => Promise<void>;
}

const STATUS_GLYPH: Record<Card['status'], string> = {
  todo: '○',
  in_progress: '◐',
  done: '●',
};

export default function Column({ id, label, cards, pulsingIds, onSelectCard, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim() || !onAddCard) return;

    setSubmitting(true);
    try {
      await onAddCard(inlineTitle.trim(), id);
      setInlineTitle('');
      setIsAdding(false);
      playHaptic('pickup');
    } catch (err) {
      console.error('Failed to add card to column:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        background: isOver ? 'rgba(255,255,255,0.65)' : 'transparent',
        borderRadius: 'var(--radius-lg)',
        padding: '0.4rem',
        minHeight: '440px',
        transition: 'background 0.15s ease',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '0 0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              fontSize: '0.85rem',
              color: STATUS_COLOR[id],
              fontWeight: 700,
              display: 'inline-block',
            }}
          >
            {STATUS_GLYPH[id]}
          </span>
          <h2
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--ink-soft)',
            }}
          >
            {label}
          </h2>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--ink-soft)',
            background: 'var(--paper)',
            padding: '0.1rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards List */}
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <SortableCard
            key={card.id}
            card={card}
            isPulsing={pulsingIds.has(card.id)}
            onSelect={onSelectCard}
          />
        ))}
      </SortableContext>

      {/* Inline Direct Column Creation */}
      {isAdding ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.5rem', padding: '0 0.1rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAdding(false);
                setInlineTitle('');
              }
            }}
            placeholder={`Add task to ${label}...`}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--ink)',
              background: 'var(--surface)',
              fontSize: '0.88rem',
              color: 'var(--ink)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem' }}>
            <button
              type="submit"
              disabled={submitting || !inlineTitle.trim()}
              style={{
                padding: '0.38rem 0.85rem',
                background: 'var(--moss)',
                color: 'var(--surface)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: submitting || !inlineTitle.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? 'Adding...' : 'Add task'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setInlineTitle('');
              }}
              style={{
                padding: '0.38rem 0.65rem',
                background: 'transparent',
                color: 'var(--ink-soft)',
                border: 'none',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              Esc to cancel
            </span>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setIsAdding(true);
            playHaptic('click');
          }}
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)',
            background: 'transparent',
            color: 'var(--ink-soft)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginTop: '0.45rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--ink-soft)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--ink-soft)';
          }}
        >
          <span>+ Add task</span>
        </button>
      )}
    </div>
  );
}
