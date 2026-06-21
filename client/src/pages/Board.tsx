import { useState, useCallback, FormEvent } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useAuth } from '../lib/AuthContext';
import { useCards } from '../hooks/useCards';
import { useSocket } from '../hooks/useSocket';
import Column from '../components/Column';
import type { Card } from '../types';

const COLUMNS: { key: Card['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board() {
  const { user, logout } = useAuth();
  const { cards, setCards, loading, error, createCard, moveCard } = useCards();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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
    },
    [setCards]
  );

  useSocket({
    onCardCreated: handleCardCreated,
    onCardUpdated: handleCardUpdated,
    onCardMoved: handleCardMoved,
    onCardDeleted: handleCardDeleted,
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      await createCard(newTitle.trim());
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create card:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    const overId = over.id as string;
    const overIsColumn = COLUMNS.some((col) => col.key === overId);
    const newStatus: Card['status'] = overIsColumn
      ? (overId as Card['status'])
      : (cards.find((c) => c.id === overId)?.status ?? activeCard.status);

    const cardsInTargetColumn = cards
      .filter((c) => c.status === newStatus && c.id !== activeCard.id)
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

    if (newStatus === activeCard.status && newPosition === activeCard.position) return;

    moveCard(activeCard.id, newStatus, newPosition);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          Loading your board...
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 600,
            color: 'var(--ink)',
          }}
        >
          TaskFlow
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{user?.email}</span>
          <button
            onClick={logout}
            style={{
              fontSize: '0.85rem',
              color: 'var(--ink-soft)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.9rem',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <form
        onSubmit={handleCreate}
        style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.6rem',
        }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new card to To Do..."
          style={{
            flex: 1,
            padding: '0.7rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={creating}
          style={{
            padding: '0.7rem 1.3rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--moss)',
            color: 'var(--surface)',
            fontSize: '0.9rem',
            fontWeight: 500,
            opacity: creating ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {creating ? 'Adding...' : 'Add Card'}
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {COLUMNS.map((column) => {
            const columnCards = cards
              .filter((card) => card.status === column.key)
              .sort((a, b) => a.position - b.position);

            return (
              <Column
                key={column.key}
                id={column.key}
                label={column.label}
                cards={columnCards}
                pulsingIds={pulsingIds}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}