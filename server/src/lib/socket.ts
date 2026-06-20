import { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketInstance = (socketServer: Server) => {
  io = socketServer;
};

export const getSocketInstance = (): Server => {
  if (!io) {
    throw new Error('Socket.io instance not initialized');
  }
  return io;
};