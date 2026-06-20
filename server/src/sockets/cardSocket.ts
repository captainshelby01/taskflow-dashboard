import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initCardSocket = (io: Server) => {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('A client connected:', socket.id, 'userId:', socket.userId);

    if (socket.userId) {
      socket.join(socket.userId);
    }

    socket.on('disconnect', () => {
      console.log('A client disconnected:', socket.id);
    });
  });
};