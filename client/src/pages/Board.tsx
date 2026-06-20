import { useState, FormEvent } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useAuth } from '../lib/AuthContext';
import { useCards } from '../hooks/useCards';
import Column from '../components/Column';
import type { Card } from '../types';

const COLUMNS: { key: Card['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board() {
  const { user, logout } = useAuth();
  const { cards, loading, error, createCard, moveCard } = useCards();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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
    return <div style={{ padding: '2rem' }}>Loading your board...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>TaskFlow</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <form onSubmit={handleCreate} style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new card to To Do..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Adding...' : 'Add Card'}
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {COLUMNS.map((column) => {
            const columnCards = cards
              .filter((card) => card.status === column.key)
              .sort((a, b) => a.position - b.position);

            return (
              <Column key={column.key} id={column.key} label={column.label} cards={columnCards} />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}