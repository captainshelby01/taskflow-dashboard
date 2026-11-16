import { useState, useCallback, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useCards } from '../hooks/useCards';
import { useSocket } from '../hooks/useSocket';
import Column from '../components/Column';
import ListView from '../components/ListView';
import CardDrawer from '../components/CardDrawer';
import CommandPalette from '../components/CommandPalette';
import RiskPath from '../components/RiskPath';
import CaseStudyDrawer from '../components/CaseStudyDrawer';
import Logo from '../components/Logo';
import { CardView } from '../components/SortableCard';
import { playHaptic, isSoundEnabled, toggleSound } from '../lib/sound';
import { triggerConfetti } from '../lib/confetti';
import type { Card, Priority } from '../types';

const COLUMNS: { key: Card['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function DroppableMobileTab({
  columnKey,
  label,
  count,
  isActive,
  onSelect,
}: {
  columnKey: Card['status'];
  label: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      className={`mobile-column-tab-btn ${isActive ? 'active' : ''} ${isOver ? 'tab-drop-target' : ''}`}
    >
      <span>{label}</span>
      <span className="tab-count">{count}</span>
    </button>
  );
}

export default function Board() {
  const { user, logout } = useAuth();
  const { cards, setCards, loading, error, createCard, updateCard, deleteCard, moveCard } = useCards();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());
  const [currentView, setCurrentView] = useState<'board' | 'list'>('board');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Priority | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(false);
  const [isResolvingBlocker, setIsResolvingBlocker] = useState(false);
  const [activeMobileColumn, setActiveMobileColumn] = useState<Card['status']>('todo');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  const handleMoveCardStatus = useCallback(
    (cardId: string, newStatus: Card['status']) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.status === newStatus) return;

      const cardsInTarget = cards
        .filter((c) => c.status === newStatus && c.id !== cardId)
        .sort((a, b) => a.position - b.position);
      const newPos =
        cardsInTarget.length > 0
          ? cardsInTarget[cardsInTarget.length - 1].position + 1
          : 0;

      if (newStatus === 'done' && card.status !== 'done') {
        playHaptic('complete');
        triggerConfetti();
      } else {
        playHaptic('drop');
      }

      moveCard(cardId, newStatus, newPos);
    },
    [cards, moveCard]
  );

  const triggerPulse = useCallback((id: string) => {
    setPulsingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setPulsingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1800);
  }, []);

  const handleCardCreated = useCallback(
    (newCard: Card) => {
      setCards((prev) => {
        if (prev.some((c) => c.id === newCard.id)) return prev;
        return [...prev, newCard];
      });
      triggerPulse(newCard.id);
    },
    [setCards, triggerPulse]
  );

  const handleCardUpdated = useCallback(
    (updatedCard: Card) => {
      setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
      triggerPulse(updatedCard.id);
    },
    [setCards, triggerPulse]
  );

  const handleCardMoved = useCallback(
    (movedCard: Card) => {
      setCards((prev) => prev.map((c) => (c.id === movedCard.id ? movedCard : c)));
      triggerPulse(movedCard.id);
    },
    [setCards, triggerPulse]
  );

  const handleCardDeleted = useCallback(
    (data: { id: string }) => {
      setCards((prev) => prev.filter((c) => c.id !== data.id));
      if (selectedCardId === data.id) {
        setSelectedCardId(null);
      }
    },
    [setCards, selectedCardId]
  );

  useSocket({
    onCardCreated: handleCardCreated,
    onCardUpdated: handleCardUpdated,
    onCardMoved: handleCardMoved,
    onCardDeleted: handleCardDeleted,
  });

  // Global Keyboard Shortcuts (⌘K, /, V, N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        playHaptic('click');
        return;
      }

      if (isInput) return;

      // '/' opens Command Palette
      if (e.key === '/') {
        e.preventDefault();
        setIsPaletteOpen(true);
        playHaptic('click');
      }
      // 'v' or 'V' toggles between board and list view
      else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setCurrentView((prev) => {
          const next = prev === 'board' ? 'list' : 'board';
          playHaptic('pickup');
          return next;
        });
      }
      // 'n' focuses quick add input
      else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const input = document.getElementById('quick-add-input') as HTMLInputElement;
        input?.focus();
        playHaptic('click');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const card = await createCard(newTitle.trim());
      setNewTitle('');
      playHaptic('pickup');
      if (card) triggerPulse(card.id);
    } catch (err) {
      console.error('Failed to create card:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleInlineCreate = useCallback(
    async (title: string, status: Card['status']) => {
      const card = await createCard(title, status);
      if (card) {
        triggerPulse(card.id);
      }
    },
    [createCard, triggerPulse]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) {
      setActiveCard(card);
      playHaptic('pickup');
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) {
      playHaptic('drop');
      return;
    }

    const activeCardItem = cards.find((c) => c.id === active.id);
    if (!activeCardItem) return;

    const overId = over.id as string;
    const overIsColumn = COLUMNS.some((col) => col.key === overId);
    const newStatus: Card['status'] = overIsColumn
      ? (overId as Card['status'])
      : (cards.find((c) => c.id === overId)?.status ?? activeCardItem.status);

    // Micro-Celebration & Haptic feedback on drop into Done
    if (newStatus === 'done' && activeCardItem.status !== 'done') {
      playHaptic('complete');
      const mouseEv = event.activatorEvent as MouseEvent;
      triggerConfetti(mouseEv?.clientX, mouseEv?.clientY);
    } else {
      playHaptic('drop');
    }

    const cardsInTargetColumn = cards
      .filter((c) => c.status === newStatus && c.id !== activeCardItem.id)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;

    if (cardsInTargetColumn.length === 0) {
      newPosition = 0;
    } else if (overIsColumn) {
      newPosition = cardsInTargetColumn[cardsInTargetColumn.length - 1].position + 1;
    } else {
      const overIndex = cardsInTargetColumn.findIndex((c) => c.id === overId);
      if (overIndex === 0) {
        newPosition = cardsInTargetColumn[0].position - 1;
      } else if (overIndex === -1) {
        newPosition = cardsInTargetColumn[cardsInTargetColumn.length - 1].position + 1;
      } else {
        const before = cardsInTargetColumn[overIndex - 1].position;
        const after = cardsInTargetColumn[overIndex].position;
        newPosition = (before + after) / 2;
      }
    }

    if (newStatus === activeCardItem.status && newPosition === activeCardItem.position) return;

    if (newStatus !== activeMobileColumn) {
      setActiveMobileColumn(newStatus);
    }

    moveCard(activeCardItem.id, newStatus, newPosition);
  };

  const handleUpdateFromDrawer = async (id: string, updates: Partial<Card>) => {
    if (updates.status === 'done' && selectedCard?.status !== 'done') {
      playHaptic('complete');
      triggerConfetti();
    } else {
      playHaptic('click');
    }
    return updateCard(id, updates);
  };

  const handleDeleteFromDrawer = async (id: string) => {
    playHaptic('delete');
    return deleteCard(id);
  };

  const handleResolveBlocker = async () => {
    setIsResolvingBlocker(true);
    try {
      const blocker = cards.find((c) => c.id === 'card-api-approval' || c.isBlocker);
      const dependent = cards.find((c) => c.id === 'card-payment-testing' || c.blockedBy);

      if (blocker) {
        await updateCard(blocker.id, {
          status: 'done',
          isBlocker: false,
          blocks: undefined,
        });
      }
      if (dependent) {
        await updateCard(dependent.id, {
          blockedBy: undefined,
          status: 'in_progress',
        });
      }
      playHaptic('complete');
      triggerConfetti();
    } catch (err) {
      console.error('Failed to resolve blocker:', err);
    } finally {
      setIsResolvingBlocker(false);
    }
  };

  const handleResetScenario = async () => {
    setIsResolvingBlocker(true);
    try {
      const blocker = cards.find((c) => c.id === 'card-api-approval');
      const dependent = cards.find((c) => c.id === 'card-payment-testing');

      if (blocker) {
        await updateCard(blocker.id, {
          status: 'in_progress',
          isBlocker: true,
          blocks: 'Test checkout payments & 3D Secure',
        });
      }
      if (dependent) {
        await updateCard(dependent.id, {
          status: 'todo',
          blockedBy: 'Get bank approval & sandbox keys',
        });
      }
      playHaptic('pickup');
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    } finally {
      setIsResolvingBlocker(false);
    }
  };

  const hasActiveBlocker = cards.some(
    (c) => (c.isBlocker || c.id === 'card-api-approval') && c.status !== 'done'
  );

  // Filtered Cards (activeFilter applied to both views)
  const filteredCards = activeFilter
    ? cards.filter((c) => (c.priority || 'medium') === activeFilter)
    : cards;

  // Live Telemetry Calculations
  const totalTasks = cards.length;
  const doneTasks = cards.filter((c) => c.status === 'done').length;
  const inProgressTasks = cards.filter((c) => c.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--clay)' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="board-main-container">
      {/* ── Tier 1: Global Navigation Bar (Brand, Project Switcher, ⌘K Search, Collaborators, Settings) ── */}
      <header className="global-nav-header">
        {/* Left: Brand + Project Switcher + Silent Sync Status */}
        <div className="global-nav-left">
          <Logo size="sm" showBadge={false} />
          <span className="workspace-slash-separator" style={{ color: 'var(--border)', fontSize: '0.9rem', fontWeight: 300, userSelect: 'none' }}>/</span>

          <div
            className="workspace-selector-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              height: '34px',
              padding: '0 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
            title="Current Workspace and Project"
          >
            <span className="workspace-org-label" style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>Acme Corp /</span>
            <span>Checkout Redesign</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)', marginLeft: '0.15rem' }}>▾</span>
          </div>

          {/* Subtle Silent Connected Dot */}
          <div
            className="nav-saved-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              height: '34px',
              padding: '0 0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              color: 'var(--ink-soft)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Connected to real-time engine · Changes save instantly"
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
              }}
            />
            <span style={{ fontWeight: 500 }}>Saved</span>
          </div>
        </div>

        {/* Center: Spotlight Search Launcher */}
        <div className="global-nav-center">
          <button
            onClick={() => {
              setIsPaletteOpen(true);
              playHaptic('click');
            }}
            title="Open Command Palette (⌘K or /)"
            className="spotlight-search-btn"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--moss)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <i className="bi bi-search" style={{ fontSize: '0.8rem' }}></i>
              <span>Search or jump to...</span>
            </span>
            <kbd
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                background: 'var(--paper)',
                padding: '0.15rem 0.35rem',
                borderRadius: '3px',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Collaborator Avatars (Human Terminology) + Profile Dropdown Menu */}
        <div className="global-nav-right">
          {/* Collaborator Avatars */}
          <div
            className="collaborators-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '34px',
              padding: '0 0.55rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--ink-soft)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Sarah K. and Alex M. are collaborating on this release"
          >
            <div style={{ display: 'flex', marginLeft: '1px' }}>
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--surface)',
                }}
                title="Sarah K. (Lead Engineer)"
              >
                SK
              </span>
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ec4899',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '-6px',
                  border: '1.5px solid var(--surface)',
                }}
                title="Alex M. (Payment Integrations)"
              >
                AM
              </span>
            </div>
            <span className="online-count-label" style={{ fontWeight: 500 }}>2 online</span>
          </div>

          {/* Profile & Settings Menu Dropdown */}
          <div ref={profileMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                playHaptic('click');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                height: '34px',
                padding: '0 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'var(--surface)',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'D'}
              </span>
              <span className="user-email-label" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'demo@taskflow.dev'}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>▾</span>
            </button>

            {/* Dropdown Menu (Theme, Haptics, Logout) */}
            {isProfileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '210px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  padding: '0.4rem',
                  animation: 'paletteIn 0.12s ease-out',
                }}
              >
                {/* Theme Switcher Item */}
                <button
                  onClick={() => {
                    toggleTheme();
                    playHaptic('click');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ink)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>Appearance</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {theme === 'dark' ? (
                      <>
                        <i className="bi bi-moon-stars-fill"></i> Dark
                      </>
                    ) : (
                      <>
                        <i className="bi bi-sun-fill"></i> Light
                      </>
                    )}
                  </span>
                </button>

                {/* Sound Haptics Item */}
                <button
                  onClick={() => {
                    const next = toggleSound();
                    setSoundActive(next);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ink)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>Audio feedback</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {soundActive ? (
                      <>
                        <i className="bi bi-volume-up-fill"></i> ON
                      </>
                    ) : (
                      <>
                        <i className="bi bi-volume-mute-fill"></i> Muted
                      </>
                    )}
                  </span>
                </button>

                <div style={{ height: '1px', background: 'var(--border)', margin: '0.35rem 0' }} />

                {/* Logout Item */}
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--clay)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          {/* About / Case Study Trigger */}
          <button
            className="case-study-nav-btn"
            onClick={() => {
              setIsCaseStudyOpen(true);
              playHaptic('click');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              height: '34px',
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            title="Read Design Engineering Case Study & Trade-offs"
          >
            <i className="bi bi-journal-text" style={{ color: 'var(--moss)' }}></i>
            <span>Case Study</span>
          </button>
        </div>
      </header>

      {/* ── Tier 2: Project Header & Release Context (Dominant Subject) ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Row 1: Dominant Title + View Switcher + New Task Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                marginBottom: '0.35rem',
              }}
            >
              Checkout Redesign v2.4
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
              Make checkout flow and 3D Secure payment testing reliable for our first 500 customers.
            </p>
          </div>

          {/* Right Controls: View Switcher (Board/List) + Primary Add Task Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Segmented View Switcher */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem',
                gap: '0.15rem',
              }}
              title="Toggle View (Key: V)"
            >
              <button
                onClick={() => {
                  setCurrentView('board');
                  playHaptic('click');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.76rem',
                  fontWeight: currentView === 'board' ? 600 : 500,
                  color: currentView === 'board' ? 'var(--ink)' : 'var(--ink-soft)',
                  background: currentView === 'board' ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  boxShadow: currentView === 'board' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                <i className="bi bi-kanban"></i>
                <span>Board</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('list');
                  playHaptic('click');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.76rem',
                  fontWeight: currentView === 'list' ? 600 : 500,
                  color: currentView === 'list' ? 'var(--ink)' : 'var(--ink-soft)',
                  background: currentView === 'list' ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  boxShadow: currentView === 'list' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                <i className="bi bi-list-task"></i>
                <span>List</span>
              </button>
            </div>

            {/* Primary Action Button: Focus quick add */}
            <button
              onClick={() => {
                inputRef.current?.focus();
                playHaptic('click');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--moss)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Row 2: Honest Release Status & Blocker Ribbon */}
        <div className="status-ribbon-container">
          {/* Left Status Badges */}
          <div className="status-badges-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Target Date */}
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--ink)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="bi bi-calendar3" style={{ fontSize: '0.75rem' }}></i>
              <span>Target: Friday, 20 Nov</span>
            </span>

            <span className="mobile-hide" style={{ color: 'var(--border)' }}>·</span>

            {/* Blocker Pill */}
            {hasActiveBlocker ? (
              <button
                onClick={() => {
                  setSelectedCardId('card-api-approval');
                  playHaptic('click');
                }}
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  maxWidth: '100%',
                  textAlign: 'left',
                  lineHeight: 1.35,
                }}
                title="Click to inspect blocker details"
              >
                <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: '0.7rem', flexShrink: 0 }}></i>
                <span style={{ wordBreak: 'break-word' }}>Release at Risk · Bank approval overdue (blocks testing)</span>
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--moss)',
                  background: 'rgba(45, 90, 63, 0.12)',
                  border: '1px solid rgba(45, 90, 63, 0.25)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  maxWidth: '100%',
                  textAlign: 'left',
                  lineHeight: 1.35,
                }}
              >
                <i className="bi bi-check-circle-fill" style={{ fontSize: '0.7rem', flexShrink: 0 }}></i>
                <span style={{ wordBreak: 'break-word' }}>Release on Track · All Gateways Verified</span>
              </span>
            )}

            <span className="mobile-hide" style={{ color: 'var(--border)' }}>·</span>

            {/* Decision Pill */}
            <button
              onClick={() => {
                setSelectedCardId('card-guest-checkout');
                playHaptic('click');
              }}
              style={{
                fontSize: '0.74rem',
                color: 'var(--ink)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0,
                maxWidth: '100%',
                textAlign: 'left',
                lineHeight: 1.35,
                flexWrap: 'wrap',
              }}
              title="Click to view Decision Trail in task drawer"
            >
              <i className="bi bi-check2-circle" style={{ color: 'var(--moss)', flexShrink: 0 }}></i>
              <span>
                Decision:{' '}
                <strong style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                  Allow checkout without account
                </strong>
              </span>
            </button>
          </div>

          {/* Right: Honest Sprint Progress (Not fake velocity!) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
              Sprint progress:{' '}
              <strong style={{ color: 'var(--ink)' }}>
                {doneTasks} of {totalTasks} complete
              </strong>
              {inProgressTasks > 0 && (
                <span style={{ marginLeft: '0.35rem', color: 'var(--ink-soft)' }}>
                  ({inProgressTasks} in progress)
                </span>
              )}
            </span>
            <div
              style={{
                width: '90px',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  background: 'var(--moss)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Signature Visual: Interactive Release Risk Path ── */}
      <RiskPath
        cards={cards}
        onSelectCard={(card) => setSelectedCardId(card.id)}
        onResolveBlocker={handleResolveBlocker}
        onResetScenario={handleResetScenario}
        isResolving={isResolvingBlocker}
      />

      {/* Active Priority Filter Indicator */}
      {activeFilter && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.25rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            width: 'fit-content',
            animation: 'paletteIn 0.15s ease-out',
          }}
        >
          <span style={{ color: 'var(--ink-soft)' }}>Active Filter:</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Priority: {activeFilter}
          </span>
          <button
            onClick={() => {
              setActiveFilter(null);
              playHaptic('click');
            }}
            title="Clear filter"
            style={{
              border: 'none',
              background: 'var(--paper)',
              color: 'var(--ink-soft)',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Global Quick Add Bar */}
      <form
        onSubmit={handleCreate}
        style={{
          marginBottom: '1.85rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            id="quick-add-input"
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task to Checkout Redesign..."
            style={{
              width: '100%',
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: '0.9rem',
              color: 'var(--ink)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.15s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--moss)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
            }}
          />
        </div>

        <div
          className="mobile-hide"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <kbd style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '3px', padding: '0.2rem 0.45rem' }}>
            ↵ Enter
          </kbd>
          <kbd style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '3px', padding: '0.2rem 0.45rem' }}>
            N focus
          </kbd>
        </div>

        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          style={{
            padding: '0.72rem 1.35rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--moss)',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 600,
            opacity: creating || !newTitle.trim() ? 0.6 : 1,
            cursor: creating || !newTitle.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {creating ? 'Adding...' : (
            <>
              <i className="bi bi-plus-lg"></i>
              <span>Add</span>
            </>
          )}
        </button>
      </form>

      {/* Dual Views: Spatial Kanban Grid OR Dense Linear List */}
      {currentView === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          {/* Mobile Column Switcher Tabs (Droppable Drop Targets for touch & drag) */}
          <div className="mobile-column-tabs">
            {COLUMNS.map((col) => {
              const count = filteredCards.filter((card) => card.status === col.key).length;
              const isActive = activeMobileColumn === col.key;
              return (
                <DroppableMobileTab
                  key={col.key}
                  columnKey={col.key}
                  label={col.label}
                  count={count}
                  isActive={isActive}
                  onSelect={() => {
                    setActiveMobileColumn(col.key);
                    playHaptic('click');
                  }}
                />
              );
            })}
          </div>

          <div className="kanban-columns-container">
            {COLUMNS.map((column) => {
              const columnCards = filteredCards
                .filter((card) => card.status === column.key)
                .sort((a, b) => a.position - b.position);

              return (
                <div
                  key={column.key}
                  className={`kanban-column-wrapper ${activeMobileColumn === column.key ? 'active-mobile-column' : ''}`}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Column
                    id={column.key}
                    label={column.label}
                    cards={columnCards}
                    pulsingIds={pulsingIds}
                    onSelectCard={(card) => {
                      setSelectedCardId(card.id);
                      playHaptic('click');
                    }}
                    onAddCard={handleInlineCreate}
                    onMoveCardStatus={handleMoveCardStatus}
                  />
                </div>
              );
            })}
          </div>

          {/* Smooth Dynamic Drag Overlay */}
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeCard ? <CardView card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView
          cards={filteredCards}
          onSelectCard={(card) => {
            setSelectedCardId(card.id);
            playHaptic('click');
          }}
          onUpdateCard={handleUpdateFromDrawer}
          onAddCard={handleInlineCreate}
        />
      )}

      {/* Linear-Style Slide-Over Detail Drawer */}
      <CardDrawer
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => {
          setSelectedCardId(null);
          playHaptic('click');
        }}
        onUpdate={handleUpdateFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      {/* Raycast-Style Spotlight Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        cards={cards}
        currentView={currentView}
        onSwitchView={(v) => {
          setCurrentView(v);
          playHaptic('click');
        }}
        onSelectCard={(card) => {
          setSelectedCardId(card.id);
          playHaptic('click');
        }}
        onOpenCreateModal={() => {
          const input = document.getElementById('quick-add-input') as HTMLInputElement;
          input?.focus();
        }}
        onToggleSound={() => {
          const next = toggleSound();
          setSoundActive(next);
        }}
        soundEnabled={soundActive}
        activeFilter={activeFilter}
        onSetFilter={setActiveFilter}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Design Engineering Case Study & Trade-offs Drawer */}
      <CaseStudyDrawer
        isOpen={isCaseStudyOpen}
        onClose={() => {
          setIsCaseStudyOpen(false);
          playHaptic('click');
        }}
      />
    </div>
  );
}
