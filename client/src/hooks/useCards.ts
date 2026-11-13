import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import type { Card, Priority } from '../types';

export function useCards() {
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Card[]>('/api/cards', token);
      setCards(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch-on-mount pattern; known false positive, see https://github.com/facebook/react/issues/34743
    fetchCards();
  }, [fetchCards]);

  const createCard = useCallback(
    async (title: string, status: Card['status'] = 'todo', priority: Priority = 'medium', dueDate?: string | null) => {
      if (!token) return;
      const newCard = await api.post<Card>(
        '/api/cards',
        { title, status, priority, dueDate: dueDate || null, position: Date.now() },
        token
      );
      setCards((prev) => {
        if (prev.some((c) => c.id === newCard.id)) return prev;
        return [...prev, newCard];
      });
      return newCard;
    },
    [token]
  );

  const updateCard = useCallback(
    async (cardId: string, updates: Partial<Card>) => {
      if (!token) return;

      // Optimistic update
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
      );

      try {
        const updated = await api.put<Card>(`/api/cards/${cardId}`, updates, token);
        setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
        return updated;
      } catch (err) {
        console.error('Failed to update card, reverting:', err);
        fetchCards();
        throw err;
      }
    },
    [token, fetchCards]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!token) return;

      // Optimistic delete
      setCards((prev) => prev.filter((c) => c.id !== cardId));

      try {
        await api.delete(`/api/cards/${cardId}`, token);
      } catch (err) {
        console.error('Failed to delete card, reverting:', err);
        fetchCards();
        throw err;
      }
    },
    [token, fetchCards]
  );

  const moveCard = useCallback(
    async (cardId: string, newStatus: Card['status'], newPosition: number) => {
      if (!token) return;

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: newStatus, position: newPosition } : c))
      );

      try {
        await api.put<Card>(`/api/cards/${cardId}`, { status: newStatus, position: newPosition }, token);
      } catch (err) {
        console.error('Failed to move card, reverting:', err);
        fetchCards();
      }
    },
    [token, fetchCards]
  );

  return {
    cards,
    setCards,
    loading,
    error,
    refetch: fetchCards,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
