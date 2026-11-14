import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card, Priority } from '../types';

export const STATUS_COLOR: Record<Card['status'], string> = {
  todo: 'var(--ochre)',
  in_progress: 'var(--clay)',
  done: 'var(--moss)',
};

export const PRIORITY_BADGES: Record<Priority, { label: string; glyph: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', glyph: '▲', color: '#e5484d', bg: 'var(--clay-soft)' },
  high: { label: 'High', glyph: '⎎', color: 'var(--clay)', bg: 'var(--clay-soft)' },
  medium: { label: 'Med', glyph: '⎍', color: 'var(--ochre)', bg: 'var(--ochre-soft)' },
  low: { label: 'Low', glyph: '⎯', color: 'var(--moss)', bg: 'var(--moss-soft)' },
};

interface CardViewProps {
  card: Card;
  isPulsing?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
  innerRef?: (node: HTMLElement | null) => void;
}

export function CardView({
  card,
  isPulsing,
  isDragging,
  isOverlay,
  style,
  onClick,
  attributes,
  listeners,
  innerRef,
}: CardViewProps) {
  const priorityKey = (card.priority || 'medium') as Priority;
  const priorityInfo = PRIORITY_BADGES[priorityKey] || PRIORITY_BADGES.medium;
  const shortId = card.id.length > 8 ? card.id.slice(-4).toUpperCase() : card.id.toUpperCase();

  const formattedDueDate = card.dueDate
    ? new Date(card.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const baseStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    borderTop: isDragging ? '1.5px dashed var(--border)' : '1px solid var(--border)',
    borderRight: isDragging ? '1.5px dashed var(--border)' : '1px solid var(--border)',
    borderBottom: isDragging ? '1.5px dashed var(--border)' : '1px solid var(--border)',
    borderLeft: `3.5px solid ${STATUS_COLOR[card.status]}`,
    padding: '0.85rem 1rem',
    marginBottom: '0.65rem',
    boxShadow: isOverlay
      ? '0 24px 38px 3px rgba(0,0,0,0.16), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2)'
      : isDragging
      ? 'none'
      : 'var(--shadow-sm)',
    cursor: isOverlay ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.35 : 1,
    transform: isOverlay ? 'rotate(2.5deg) scale(1.03)' : undefined,
    position: 'relative',
    transition: isOverlay ? 'none' : 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
    ...style,
  };

  return (
    <div
      ref={innerRef}
      className={isPulsing ? 'card-pulse' : undefined}
      style={baseStyle}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Top Metadata Strip: Mono ID + Tactile Priority Flag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.45rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--ink-soft)',
            letterSpacing: '0.04em',
            opacity: 0.75,
          }}
        >
          #TF-{shortId}
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: priorityInfo.color,
            background: priorityInfo.bg,
            padding: '0.12rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '0.02em',
          }}
        >
          <span>{priorityInfo.glyph}</span> {priorityInfo.label}
        </span>
      </div>

      {/* Card Title */}
      <div
        style={{
          fontSize: '0.92rem',
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'var(--ink)',
          marginBottom: formattedDueDate || card.description ? '0.6rem' : '0',
        }}
      >
        {card.title}
      </div>

      {/* Bottom Metadata Indicators: Due Date & Notes Flag */}
      {(formattedDueDate || card.description) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.74rem',
            color: 'var(--ink-soft)',
            paddingTop: '0.35rem',
            borderTop: '1px solid rgba(227, 224, 216, 0.4)',
          }}
        >
          {formattedDueDate && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>🗓</span> {formattedDueDate}
            </span>
          )}

          {card.description && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: 0.8,
              }}
              title="Contains notes / specifications"
            >
              <span>≡</span> Notes
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface SortableCardProps {
  card: Card;
  isPulsing?: boolean;
  onSelect?: (card: Card) => void;
}

export default function SortableCard({ card, isPulsing, onSelect }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <CardView
      card={card}
      isPulsing={isPulsing}
      isDragging={isDragging}
      innerRef={setNodeRef}
      style={style}
      attributes={attributes as unknown as Record<string, unknown>}
      listeners={listeners as unknown as Record<string, unknown>}
      onClick={() => {
        if (!isDragging && onSelect) {
          onSelect(card);
        }
      }}
    />
  );
}
