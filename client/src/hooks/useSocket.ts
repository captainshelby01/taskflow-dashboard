import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from '../lib/AuthContext';
import type { Card } from '../types';

interface UseSocketProps {
  onCardCreated: (card: Card) => void;
  onCardUpdated: (card: Card) => void;
  onCardMoved: (card: Card) => void;
  onCardDeleted: (data: { id: string }) => void;
}

export function useSocket({ onCardCreated, onCardUpdated, onCardMoved, onCardDeleted }: UseSocketProps) {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = connectSocket(token);

    socket.on('CARD_CREATED', onCardCreated);
    socket.on('CARD_UPDATED', onCardUpdated);
    socket.on('CARD_MOVED', onCardMoved);
    socket.on('CARD_DELETED', onCardDeleted);

    return () => {
      socket.off('CARD_CREATED', onCardCreated);
      socket.off('CARD_UPDATED', onCardUpdated);
      socket.off('CARD_MOVED', onCardMoved);
      socket.off('CARD_DELETED', onCardDeleted);
      disconnectSocket();
    };
  }, [isAuthenticated, token, onCardCreated, onCardUpdated, onCardMoved, onCardDeleted]);
}