import { useState, useCallback, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
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
    })
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 4rem 2rem' }}>
      {/* ── Tier 1: Global Navigation Bar (Brand, Project Switcher, ⌘K Search, Collaborators, Settings) ── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        {/* Left: Brand + Project Switcher + Silent Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Logo size="sm" showBadge={false} />
          <span style={{ color: 'var(--border)', fontSize: '1rem', fontWeight: 300 }}>/</span>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
            title="Current Workspace and Project"
          >
            <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>Acme Corp /</span>
            <span>Checkout Redesign</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>▾</span>
          </div>

          {/* Subtle Silent Connected Dot */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              color: 'var(--ink-soft)',
              marginLeft: '0.25rem',
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
            <span style={{ fontSize: '0.74rem' }}>Saved</span>
          </div>
        </div>

        {/* Center: Spotlight Search Launcher */}
        <button
          onClick={() => {
            setIsPaletteOpen(true);
            playHaptic('click');
          }}
          title="Open Command Palette (⌘K or /)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '260px',
            padding: '0.42rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--ink-soft)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--moss)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>🔍</span>
            <span>Search or jump to...</span>
          </span>
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              background: 'var(--paper)',
              padding: '0.15rem 0.4rem',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Right: Collaborator Avatars (Human Terminology) + Profile Dropdown Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Collaborator Avatars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.75rem',
              color: 'var(--ink-soft)',
            }}
            title="Sarah K. and Alex M. are collaborating on this release"
          >
            <div style={{ display: 'flex', marginLeft: '2px' }}>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--surface)',
                }}
                title="Sarah K. (Lead Engineer)"
              >
                SK
              </span>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ec4899',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '-6px',
                  border: '2px solid var(--surface)',
                }}
                title="Alex M. (Payment Integrations)"
              >
                AM
              </span>
            </div>
            <span style={{ fontWeight: 500 }}>2 online</span>
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'var(--surface)',
                  fontSize: '0.68rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'D'}
              </span>
              <span>{user?.email || 'demo@taskflow.dev'}</span>
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                    {soundActive ? '🔊 ON' : '🔇 Muted'}
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
                  Sign out
                </button>
              </div>
            )}
          </div>
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
                fontSize: '1.75rem',
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
                  gap: '0.3rem',
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
                <span>☷</span>
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
                  gap: '0.3rem',
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
                <span>☰</span>
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
              <span>+</span>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Row 2: Honest Release Status & Blocker Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Left Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
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
              <span>📅</span>
              <span>Target: Friday, 20 Nov</span>
            </span>

            <span style={{ color: 'var(--border)' }}>·</span>

            {/* Blocker Pill */}
            <span
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Payment integration testing is blocked by Bank API approval"
            >
              <span>●</span>
              <span>1 Release Blocker</span>
            </span>

            <span style={{ color: 'var(--border)' }}>·</span>

            {/* Overdue Pill */}
            <span
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
              }}
            >
              1 Overdue (API Approval)
            </span>

            <span style={{ color: 'var(--border)' }}>·</span>

            {/* Decision Pill */}
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--ink-soft)',
              }}
            >
              ✦ 1 decision attached
            </span>
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
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            ✕
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
          }}
        >
          {creating ? 'Adding...' : '+ Add'}
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
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {COLUMNS.map((column) => {
              const columnCards = filteredCards
                .filter((card) => card.status === column.key)
                .sort((a, b) => a.position - b.position);

              return (
                <Column
                  key={column.key}
                  id={column.key}
                  label={column.label}
                  cards={columnCards}
                  pulsingIds={pulsingIds}
                  onSelectCard={(card) => {
                    setSelectedCardId(card.id);
                    playHaptic('click');
                  }}
                  onAddCard={handleInlineCreate}
                />
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
    </div>
  );
}
