import { useState, useEffect, useRef } from 'react';
import type { Card, Priority } from '../types';
import MarkdownView from './MarkdownView';

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

const PRIORITY_OPTIONS: { key: Priority; label: string; glyph: string; iconClass: string; color: string; bg: string }[] = [
  { key: 'urgent', label: 'Urgent', glyph: '▲', iconClass: 'bi-arrow-up-circle-fill', color: '#e5484d', bg: 'var(--clay-soft)' },
  { key: 'high', label: 'High', glyph: '⎎', iconClass: 'bi-chevron-double-up', color: 'var(--clay)', bg: 'var(--clay-soft)' },
  { key: 'medium', label: 'Medium', glyph: '⎍', iconClass: 'bi-dash-circle', color: 'var(--ochre)', bg: 'var(--ochre-soft)' },
  { key: 'low', label: 'Low', glyph: '⎯', iconClass: 'bi-arrow-down-circle', color: 'var(--moss)', bg: 'var(--moss-soft)' },
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
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setStatus(card.status);
      setPriority(card.priority || 'medium');
      setDueDate(card.dueDate || '');
      setConfirmDelete(false);
      setIsEditingDescription(false);
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
        className="responsive-drawer-panel"
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
          className="drawer-header-bar"
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
              <i className={`bi ${currentPriority.iconClass}`} style={{ fontSize: '0.74rem' }}></i> {currentPriority.label}
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
              <i className="bi bi-x-lg" style={{ fontSize: '0.72rem' }}></i>
              <span>Close</span>
              <kbd
                className="mobile-hide"
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
          {/* Inline Title Input (Multi-line auto-wrap) */}
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
            <textarea
              ref={titleInputRef}
              rows={2}
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
                padding: '0.4rem 0.2rem',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.35,
                transition: 'border 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border)')}
              onBlur={(e) => (e.target.style.borderColor = 'transparent')}
            />
          </div>

          {/* Properties Panel (Tactile Instrument Grid) */}
          <div
            className="drawer-meta-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
              background: 'var(--paper)',
              padding: '1rem',
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

            {/* Assignee Information */}
            {card.assignee && (
              <div
                style={{
                  gridColumn: 'span 2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Assigned to:
                </span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: card.assignee.avatarColor || 'var(--clay)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.assignee.initials}
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {card.assignee.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dependency & Blocker Trace Section */}
          {(card.isBlocker || card.blockedBy || card.blocks) && (
            <div
              style={{
                background: card.isBlocker ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                border: `1px solid ${card.isBlocker ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: card.isBlocker ? '#ef4444' : '#f59e0b',
                  marginBottom: '0.45rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {card.isBlocker ? (
                  <>
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <span>Release Blocker Chain</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-pause-circle-fill"></i>
                    <span>Blocked Dependency</span>
                  </>
                )}
              </div>

              {card.isBlocker && (
                <div style={{ fontSize: '0.84rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                  <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                    Actively blocking: <span style={{ color: '#ef4444' }}>{card.blocks || 'downstream delivery'}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                    Payment integration tests cannot execute until OAuth credentials and production sandbox webhooks are cleared.
                  </p>
                </div>
              )}

              {card.blockedBy && (
                <div style={{ fontSize: '0.84rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                  <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                    Blocked by: <span style={{ color: '#ef4444' }}>{card.blockedBy}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                    Execution is paused waiting for upstream bank credentials and sandbox webhook activation.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Decision Trail Section */}
          {card.decision && (
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                borderLeft: '3.5px solid var(--moss)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
              }}
            >
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
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--moss)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <i className="bi bi-check2-circle"></i> Decision Trail
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  {card.decision.date}
                </span>
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 0.35rem 0' }}>
                {card.decision.title}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 0.45rem 0' }}>
                {card.decision.rationale}
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                Decided by: <strong style={{ color: 'var(--ink)' }}>{card.decision.decidedBy}</strong>
              </div>
            </div>
          )}

          {/* Description Section with Markdown Read / Edit Mode */}
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
              <button
                type="button"
                onClick={() => setIsEditingDescription(!isEditingDescription)}
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--moss)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '0.1rem 0.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {isEditingDescription ? (
                  <>
                    <i className="bi bi-eye"></i>
                    <span>Preview Formatted</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-pencil-square"></i>
                    <span>Edit Notes</span>
                  </>
                )}
              </button>
            </div>

            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add technical context, criteria, or subtasks..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)',
                  minHeight: '140px',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1.15rem',
                  minHeight: '100px',
                  cursor: 'pointer',
                }}
                title="Click to edit notes"
              >
                {description ? (
                  <MarkdownView content={description} />
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                    No notes provided. Click to add context...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pinned Footer Action Bar */}
        <div
          className="drawer-footer-actions"
          style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxSizing: 'border-box',
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
                <i className="bi bi-trash3"></i> Delete Task
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
          <div className="drawer-save-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <i className="bi bi-check2"></i>
                  <span>Save Changes</span>
                </>
              )}
              <kbd
                className="mobile-hide"
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
