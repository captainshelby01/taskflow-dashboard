import { useState, FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useCards } from '../hooks/useCards';
import type { Card } from '../types';

const COLUMNS: { key: Card['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board() {
  const { user, logout } = useAuth();
  const { cards, loading, error, createCard } = useCards();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

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

      <div style={{ display: 'flex', gap: '1rem' }}>
        {COLUMNS.map((column) => {
          const columnCards = cards
            .filter((card) => card.status === column.key)
            .sort((a, b) => a.position - b.position);

          return (
            <div
              key={column.key}
              style={{
                flex: 1,
                background: '#ebecf0',
                borderRadius: '8px',
                padding: '1rem',
                minHeight: '400px',
              }}
            >
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                {column.label} ({columnCards.length})
              </h2>
              {columnCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: 'white',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {card.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}