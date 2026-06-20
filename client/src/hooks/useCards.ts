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

  return { cards, setCards, loading, error, refetch: fetchCards, createCard };
}