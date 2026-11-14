import { useState } from 'react';
import type { Card, Priority } from '../types';
import { STATUS_COLOR, PRIORITY_BADGES } from './SortableCard';
import { playHaptic } from '../lib/sound';

interface ListViewProps {
  cards: Card[];
  onSelectCard: (card: Card) => void;
  onUpdateCard: (id: string, updates: Partial<Card>) => Promise<Card | undefined>;
  onAddCard: (title: string, status: Card['status']) => Promise<void>;
}

const STATUS_ORDER: Card['status'][] = ['todo', 'in_progress', 'done'];

const STATUS_METADATA: Record<Card['status'], { label: string; glyph: string }> = {
  todo: { label: 'To Do', glyph: '○' },
  in_progress: { label: 'In Progress', glyph: '◐' },
  done: { label: 'Done', glyph: '●' },
};

export default function ListView({ cards, onSelectCard, onUpdateCard, onAddCard }: ListViewProps) {
  const [addingStatus, setAddingStatus] = useState<Card['status'] | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cycleStatus = async (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    const currentIndex = STATUS_ORDER.indexOf(card.status);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];

    if (nextStatus === 'done') {
      playHaptic('complete');
    } else {
      playHaptic('pickup');
    }

    await onUpdateCard(card.id, { status: nextStatus });
  };

  const handleInlineSubmit = async (e: React.FormEvent, status: Card['status']) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddCard(inlineTitle.trim(), status);
      setInlineTitle('');
      setAddingStatus(null);
      playHaptic('pickup');
    } catch (err) {
      console.error('Failed to create card in list view:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Table Header Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px 140px 1fr 110px 110px 70px',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--paper)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span>ID</span>
        <span>Status</span>
        <span>Title</span>
        <span>Priority</span>
        <span>Due Date</span>
        <span style={{ textAlign: 'right' }}>Inspect</span>
      </div>

      {/* Grouped Status Sections */}
      {STATUS_ORDER.map((statusKey) => {
        const groupCards = cards
          .filter((c) => c.status === statusKey)
          .sort((a, b) => a.position - b.position);

        const statusMeta = STATUS_METADATA[statusKey];

        return (
          <div key={statusKey} style={{ borderBottom: '1px solid var(--border)' }}>
            {/* Group Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1.25rem',
                background: 'rgba(247, 245, 240, 0.5)',
                borderBottom: groupCards.length > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span
                  style={{
                    color: STATUS_COLOR[statusKey],
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {statusMeta.glyph}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {statusMeta.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--ink-soft)',
                    background: 'var(--paper)',
                    padding: '0.05rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {groupCards.length}
                </span>
              </div>

              <button
                onClick={() => {
                  setAddingStatus(addingStatus === statusKey ? null : statusKey);
                  playHaptic('click');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>+ Add task</span>
              </button>
            </div>

            {/* List Rows */}
            {groupCards.map((card) => {
              const priorityKey = (card.priority || 'medium') as Priority;
              const priorityInfo = PRIORITY_BADGES[priorityKey] || PRIORITY_BADGES.medium;
              const shortId = card.id.length > 8 ? card.id.slice(-4).toUpperCase() : card.id.toUpperCase();

              const formattedDueDate = card.dueDate
                ? new Date(card.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    playHaptic('click');
                    onSelectCard(card);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 140px 1fr 110px 110px 70px',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.65rem 1.25rem',
                    borderBottom: '1px solid rgba(227, 224, 216, 0.4)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Task ID */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      letterSpacing: '0.03em',
                      opacity: 0.8,
                    }}
                  >
                    #{shortId}
                  </span>

                  {/* Interactive Status Pill (Click to advance) */}
                  <button
                    onClick={(e) => cycleStatus(e, card)}
                    title="Click to advance status"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      color: STATUS_COLOR[card.status],
                      background: 'transparent',
                      border: '1px solid rgba(227, 224, 216, 0.8)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      width: 'fit-content',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{STATUS_METADATA[card.status].glyph}</span>
                    <span>{STATUS_METADATA[card.status].label}</span>
                  </button>

                  {/* Title & Notes Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {card.title}
                    </span>
                    {card.description && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--ink-soft)',
                          opacity: 0.7,
                          flexShrink: 0,
                        }}
                        title="Contains notes"
                      >
                        ≡
                      </span>
                    )}
                  </div>

                  {/* Priority Pill */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: priorityInfo.color,
                      background: priorityInfo.bg,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      width: 'fit-content',
                    }}
                  >
                    <span>{priorityInfo.glyph}</span> {priorityInfo.label}
                  </span>

                  {/* Target Due Date */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      color: card.dueDate ? 'var(--ink-soft)' : 'rgba(74, 77, 89, 0.4)',
                    }}
                  >
                    {formattedDueDate !== '—' && <span style={{ marginRight: '0.2rem' }}>🗓</span>}
                    {formattedDueDate}
                  </span>

                  {/* Drawer Open Trigger */}
                  <span
                    style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--ink-soft)',
                      opacity: 0.6,
                    }}
                  >
                    Inspect ↗
                  </span>
                </div>
              );
            })}

            {/* Inline Add Task Row */}
            {addingStatus === statusKey && (
              <form
                onSubmit={(e) => handleInlineSubmit(e, statusKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 1.25rem',
                  background: 'var(--paper)',
                }}
              >
                <input
                  type="text"
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setAddingStatus(null);
                      setInlineTitle('');
                    }
                  }}
                  placeholder={`Task title for ${statusMeta.label}... (Enter to add, Esc to cancel)`}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--ink)',
                    background: 'var(--surface)',
                    fontSize: '0.85rem',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inlineTitle.trim()}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: 'var(--moss)',
                    color: 'var(--surface)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: isSubmitting || !inlineTitle.trim() ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingStatus(null);
                    setInlineTitle('');
                  }}
                  style={{
                    padding: '0.45rem 0.65rem',
                    background: 'transparent',
                    color: 'var(--ink-soft)',
                    border: 'none',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </form>
            )}

            {groupCards.length === 0 && addingStatus !== statusKey && (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--ink-soft)',
                  opacity: 0.6,
                }}
              >
                No tasks in {statusMeta.label}.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
