import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_jwt_secret_dev_key_2026';

export const initCardSocket = (io: Server) => {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
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