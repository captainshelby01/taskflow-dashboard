import { useState, useEffect, useRef } from 'react';
import type { Card, Priority } from '../types';

interface CardDrawerProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<Card>) => Promise<unknown>;
  onDelete: (cardId: string) => Promise<unknown>;
}

const STATUS_OPTIONS: { key: Card['status']; label: string; glyph: string; color: string }[] = [
  { key: 'todo', label: 'To Do', glyph: '○', color: 'var(--ochre)' },
  { key: 'in_progress', label: 'In Progress', glyph: '◐', color: 'var(--clay)' },
  { key: 'done', label: 'Done', glyph: '●', color: 'var(--moss)' },
];

const PRIORITY_OPTIONS: { key: Priority; label: string; glyph: string; color: string; bg: string }[] = [
  { key: 'urgent', label: 'Urgent', glyph: '▲', color: '#e5484d', bg: 'var(--clay-soft)' },
  { key: 'high', label: 'High', glyph: '⎎', color: 'var(--clay)', bg: 'var(--clay-soft)' },
  { key: 'medium', label: 'Medium', glyph: '⎍', color: 'var(--ochre)', bg: 'var(--ochre-soft)' },
  { key: 'low', label: 'Low', glyph: '⎯', color: 'var(--moss)', bg: 'var(--moss-soft)' },
];

export default function CardDrawer({ card, isOpen, onClose, onUpdate, onDelete }: CardDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Card['status']>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setStatus(card.status);
      setPriority(card.priority || 'medium');
      setDueDate(card.dueDate || '');
      setConfirmDelete(false);
    }
  }, [card]);

  // Keyboard navigation: Escape to close, Ctrl/Cmd + Enter to save
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, status, priority, dueDate]);

  if (!isOpen || !card) return null;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onUpdate(card.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(card.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete card:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentPriority = PRIORITY_OPTIONS.find((p) => p.key === priority) || PRIORITY_OPTIONS[2];
  const shortId = card.id.length > 8 ? card.id.slice(-4).toUpperCase() : card.id.toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 29, 41, 0.35)',
          backdropFilter: 'blur(4px)',
          zIndex: 90,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Card Details Inspector"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '560px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                background: 'var(--paper)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                letterSpacing: '0.04em',
              }}
            >
              #TF-{shortId}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: currentPriority.color,
                background: currentPriority.bg,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span>{currentPriority.glyph}</span> {currentPriority.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem',
                color: 'var(--ink-soft)',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
              title="Close (Esc)"
            >
              <span>Close</span>
              <kbd
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  background: 'var(--paper)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  border: '1px solid var(--border)',
                }}
              >
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Inline Title Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--ink-soft)',
                marginBottom: '0.4rem',
              }}
            >
              Title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              style={{
                width: '100%',
                fontSize: '1.25rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--ink)',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.2rem',
                outline: 'none',
                transition: 'border 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border)')}
              onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            />
          </div>

          {/* Properties Panel (Tactile Instrument Grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              background: 'var(--paper)',
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Status Property */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-soft)',
                  marginBottom: '0.35rem',
                }}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Card['status'])}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.glyph} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Property */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-soft)',
                  marginBottom: '0.35rem',
                }}
              >
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.glyph} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Property */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-soft)',
                  marginBottom: '0.35rem',
                }}
              >
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Timestamps Property */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-soft)',
                  marginBottom: '0.35rem',
                }}
              >
                Last Modified
              </label>
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                  background: 'transparent',
                }}
              >
                {new Date(card.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.45rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-soft)',
                }}
              >
                Description &amp; Specifications
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', opacity: 0.6 }}>
                Markdown supported
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add technical context, criteria, or subtasks..."
              rows={8}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--ink)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-body)',
                minHeight: '160px',
              }}
            />
          </div>
        </div>

        {/* Pinned Footer Action Bar */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Delete Action */}
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--clay)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>✕</span> Delete Task
              </button>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clay)', fontWeight: 600 }}>
                  Confirm delete?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    background: '#e5484d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Save Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'var(--moss)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              <kbd
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                }}
              >
                ⌘⏎
              </kbd>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
