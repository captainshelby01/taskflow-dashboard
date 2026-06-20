import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import cardRoutes from './routes/cardRoutes';
import { initCardSocket } from './sockets/cardSocket';
import { setSocketInstance } from './lib/socket';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);

initCardSocket(io);
setSocketInstance(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});