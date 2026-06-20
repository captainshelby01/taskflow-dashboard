import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import type { Card } from '../types';

export function useCards() {
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
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
    fetchCards();
  }, [fetchCards]);

  const createCard = useCallback(
    async (title: string) => {
      if (!token) return;
      const newCard = await api.post<Card>('/api/cards', { title, status: 'todo', position: Date.now() }, token);
      setCards((prev) => [...prev, newCard]);
    },
    [token]
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

  return { cards, setCards, loading, error, refetch: fetchCards, createCard, moveCard };
}