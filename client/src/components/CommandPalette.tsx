import { useState, useEffect, useRef, useMemo } from 'react';
import type { Card, Priority } from '../types';
import { PRIORITY_BADGES } from './SortableCard';
import { playHaptic } from '../lib/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  currentView: 'board' | 'list';
  onSwitchView: (view: 'board' | 'list') => void;
  onSelectCard: (card: Card) => void;
  onOpenCreateModal: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  activeFilter: Priority | null;
  onSetFilter: (filter: Priority | null) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Filters' | 'Tasks';
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: { label: string; color: string; bg: string };
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  cards,
  currentView,
  onSwitchView,
  onSelectCard,
  onOpenCreateModal,
  onToggleSound,
  soundEnabled,
  activeFilter,
  onSetFilter,
  theme = 'dark',
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result: CommandItem[] = [];

    // 1. Actions Category
    const actions: CommandItem[] = [
      {
        id: 'action-create',
        category: 'Actions',
        title: 'Create new task...',
        subtitle: 'Add a new card to your sprint backlog',
        icon: '+',
        action: () => {
          onClose();
          onOpenCreateModal();
        },
      },
      {
        id: 'action-view-toggle',
        category: 'Actions',
        title: currentView === 'board' ? 'Switch to Dense List View' : 'Switch to Spatial Kanban Board',
        subtitle: currentView === 'board' ? 'Linear-style table layout (Key: V)' : 'Column drag-and-drop board (Key: V)',
        icon: currentView === 'board' ? '☰' : '☷',
        action: () => {
          onSwitchView(currentView === 'board' ? 'list' : 'board');
          onClose();
        },
      },
      {
        id: 'action-sound-toggle',
        category: 'Actions',
        title: soundEnabled ? 'Mute Web Audio Haptics' : 'Enable Web Audio Haptics',
        subtitle: 'Synthesized mechanical tactile click feedback',
        icon: soundEnabled ? '🔇' : '🔊',
        action: () => {
          onToggleSound();
          onClose();
        },
      },
      ...(onToggleTheme
        ? [
            {
              id: 'action-theme-toggle',
              category: 'Actions' as const,
              title: theme === 'dark' ? 'Switch to Warm Light Theme' : 'Switch to Linear Obsidian Dark Theme',
              subtitle: theme === 'dark' ? 'Classic editorial paper palette' : 'High-density obsidian & hairline borders',
              icon: theme === 'dark' ? '☀️' : '🌙',
              action: () => {
                onToggleTheme();
                onClose();
              },
            },
          ]
        : []),
    ];

    // 2. Filters Category
    const filters: CommandItem[] = [
      {
        id: 'filter-urgent',
        category: 'Filters',
        title: 'Filter: Urgent Priority',
        subtitle: 'Show only critical path tasks',
        badge: PRIORITY_BADGES.urgent,
        action: () => {
          onSetFilter(activeFilter === 'urgent' ? null : 'urgent');
          onClose();
        },
      },
      {
        id: 'filter-high',
        category: 'Filters',
        title: 'Filter: High Priority',
        subtitle: 'Show high-impact sprint tasks',
        badge: PRIORITY_BADGES.high,
        action: () => {
          onSetFilter(activeFilter === 'high' ? null : 'high');
          onClose();
        },
      },
      {
        id: 'filter-medium',
        category: 'Filters',
        title: 'Filter: Medium Priority',
        subtitle: 'Standard cadence tasks',
        badge: PRIORITY_BADGES.medium,
        action: () => {
          onSetFilter(activeFilter === 'medium' ? null : 'medium');
          onClose();
        },
      },
      {
        id: 'filter-low',
        category: 'Filters',
        title: 'Filter: Low Priority',
        subtitle: 'Refinement & polish tasks',
        badge: PRIORITY_BADGES.low,
        action: () => {
          onSetFilter(activeFilter === 'low' ? null : 'low');
          onClose();
        },
      },
    ];

    if (activeFilter) {
      filters.unshift({
        id: 'filter-clear',
        category: 'Filters',
        title: 'Clear Active Filter',
        subtitle: `Currently filtering by ${activeFilter}`,
        icon: '✕',
        action: () => {
          onSetFilter(null);
          onClose();
        },
      });
    }

    // 3. Filter Actions & Filters by query
    actions.forEach((a) => {
      if (!q || a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q)) {
        result.push(a);
      }
    });

    filters.forEach((f) => {
      if (!q || f.title.toLowerCase().includes(q) || f.subtitle?.toLowerCase().includes(q)) {
        result.push(f);
      }
    });

    // 4. Tasks Search
    cards.forEach((card) => {
      const shortId = card.id.length > 8 ? card.id.slice(-4).toUpperCase() : card.id.toUpperCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchDesc = card.description?.toLowerCase().includes(q) ?? false;
      const matchId = `tf-${shortId.toLowerCase()}`.includes(q) || card.id.toLowerCase().includes(q);
      const matchPriority = card.priority?.toLowerCase().includes(q) ?? false;
      const matchStatus = card.status.replace('_', ' ').toLowerCase().includes(q);

      if (!q || matchTitle || matchDesc || matchId || matchPriority || matchStatus) {
        const priorityKey = (card.priority || 'medium') as Priority;
        const priorityInfo = PRIORITY_BADGES[priorityKey] || PRIORITY_BADGES.medium;
        const statusGlyph = card.status === 'done' ? '● Done' : card.status === 'in_progress' ? '◐ In Progress' : '○ To Do';

        result.push({
          id: `task-${card.id}`,
          category: 'Tasks',
          title: card.title,
          subtitle: `#TF-${shortId} · ${statusGlyph}`,
          badge: priorityInfo,
          action: () => {
            onClose();
            onSelectCard(card);
          },
        });
      }
    });

    return result;
  }, [query, cards, currentView, soundEnabled, activeFilter, onClose, onOpenCreateModal, onSwitchView, onToggleSound, onSetFilter, onSelectCard]);

  // Adjust selected index on items change
  useEffect(() => {
    setSelectedIndex((prev) => (items.length === 0 ? 0 : Math.min(prev, items.length - 1)));
  }, [items.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
      playHaptic('click');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length === 0 ? 0 : (prev - 1 + items.length) % items.length));
      playHaptic('click');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        playHaptic('pickup');
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 17, 23, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: '620px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(15, 17, 23, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '72vh',
          animation: 'paletteIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Omnibar Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <span style={{ fontSize: '1.1rem', color: 'var(--ink-soft)', opacity: 0.8 }}>⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search tasks, or filter..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--ink-soft)',
                fontSize: '0.8rem',
                padding: '0.2rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
          <span
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-soft)',
              background: 'var(--paper)',
              padding: '0.2rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--ink-soft)',
                fontSize: '0.9rem',
              }}
            >
              <p>No matching commands or tasks found for &ldquo;{query}&rdquo;</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.4rem', opacity: 0.7 }}>
                Try searching for title keywords, &ldquo;urgent&rdquo;, or &ldquo;board&rdquo;
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isFirstOfCategory = index === 0 || items[index - 1].category !== item.category;

              return (
                <div key={item.id}>
                  {isFirstOfCategory && (
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ink-soft)',
                        padding: '0.6rem 0.85rem 0.3rem 0.85rem',
                        opacity: 0.75,
                      }}
                    >
                      {item.category}
                    </div>
                  )}

                  <div
                    data-index={index}
                    onClick={() => {
                      playHaptic('pickup');
                      item.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--paper)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      {item.icon && (
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'var(--surface)' : 'var(--paper)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                      )}

                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--ink-soft)',
                              marginTop: '0.1rem',
                              fontFamily: item.category === 'Tasks' ? 'var(--font-mono)' : 'inherit',
                              opacity: 0.85,
                            }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            color: item.badge.color,
                            background: item.badge.bg,
                            padding: '0.12rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {item.badge.label}
                        </span>
                      )}

                      {isSelected && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--ink-soft)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          ↵
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--paper)',
            fontSize: '0.72rem',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>

          <div>
            <span>TaskFlow Command HUD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
