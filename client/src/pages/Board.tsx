import { useState, useCallback, useEffect } from 'react';
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
  const { theme, toggleTheme } = useTheme();

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
      {/* Top Navigation & Brand Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Logo size="md" showBadge />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              color: 'var(--moss)',
              background: 'var(--moss-soft)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--moss)',
                boxShadow: '0 0 0 2px rgba(45, 90, 63, 0.2)',
              }}
            />
            Live Sync
          </div>
        </div>

        {/* Right Header Controls: Command HUD trigger, View Switcher, Haptics Toggle, Live Peers, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Raycast-style Command Palette Button */}
          <button
            onClick={() => {
              setIsPaletteOpen(true);
              playHaptic('click');
            }}
            title="Open Command Palette (⌘K or /)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink)',
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontWeight: 700 }}>⌘K</span>
            <span style={{ color: 'var(--ink-soft)' }}>Commands</span>
          </button>

          {/* Dual View Segmented Switcher (Board ⟷ List) */}
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
                fontSize: '0.74rem',
                fontWeight: currentView === 'board' ? 600 : 500,
                color: currentView === 'board' ? 'var(--ink)' : 'var(--ink-soft)',
                background: currentView === 'board' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.65rem',
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
                fontSize: '0.74rem',
                fontWeight: currentView === 'list' ? 600 : 500,
                color: currentView === 'list' ? 'var(--ink)' : 'var(--ink-soft)',
                background: currentView === 'list' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.65rem',
                cursor: 'pointer',
                boxShadow: currentView === 'list' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.12s ease',
              }}
            >
              <span>☰</span>
              <span>List</span>
            </button>
          </div>

          {/* Audio Haptics Synthesizer Toggle */}
          <button
            onClick={() => {
              const next = toggleSound();
              setSoundActive(next);
            }}
            title={soundActive ? 'Audio Haptics ON (Click to mute)' : 'Audio Haptics MUTED (Click to enable)'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: soundActive ? 'var(--ink)' : 'var(--ink-soft)',
              background: soundActive ? 'var(--paper)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{soundActive ? '🔊' : '🔇'}</span>
            <span>Haptics {soundActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Obsidian Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Warm Light' : 'Linear Obsidian Dark'} mode`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink)',
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light' : 'Obsidian'}</span>
          </button>

          {/* Simulated Multiplayer Presence Ring */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '999px',
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              fontSize: '0.72rem',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-mono)',
            }}
            title="Distributed peer sync nodes active"
          >
            <div style={{ display: 'flex', marginLeft: '2px' }}>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: '0.62rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid var(--surface)',
                }}
              >
                SF
              </span>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ec4899',
                  color: '#fff',
                  fontSize: '0.62rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '-6px',
                  border: '1.5px solid var(--surface)',
                }}
              >
                LD
              </span>
            </div>
            <span style={{ fontWeight: 500 }}>2 Peers</span>
          </div>

          {/* User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--ink)',
                color: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{user?.email}</span>
          </div>

          <button
            onClick={logout}
            style={{
              fontSize: '0.82rem',
              color: 'var(--ink-soft)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Live Telemetry & Velocity Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1.15rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Left: Sprint Completion Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--moss)',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)' }}>
              Sprint Velocity
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--moss)',
                fontWeight: 600,
              }}
            >
              {completionRate}% Done
            </span>
          </div>

          {/* Linear Progress Gauge */}
          <div
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '999px',
              background: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${completionRate}%`,
                background: 'var(--moss)',
                borderRadius: '999px',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
        </div>

        {/* Right: Workload distribution counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
            <strong style={{ color: 'var(--clay)' }}>{inProgressTasks}</strong> in progress
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
            <strong style={{ color: 'var(--moss)' }}>{doneTasks}</strong> completed
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
            {totalTasks} total
          </span>
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
          gap: '0.65rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            id="quick-add-input"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Quick capture a new task... (press Enter to commit to To Do, or N to focus)"
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
          />
        </div>

        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          style={{
            padding: '0.75rem 1.4rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--moss)',
            color: 'var(--surface)',
            fontSize: '0.9rem',
            fontWeight: 600,
            opacity: creating || !newTitle.trim() ? 0.6 : 1,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>{creating ? 'Creating...' : '+ Add Task'}</span>
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
