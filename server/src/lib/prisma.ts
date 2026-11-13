import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface CardRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  cards: CardRecord[];
}

const DB_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DEMO_USER_ID = 'demo-user-taskflow-uuid';
const DEMO_USER_HASH = '$2b$10$vd6C95e/kJRcfENLseH6HOeiyuu3RPbeVHOkeFq.Qvbi5UWsMmWI.'; // password123

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: DEMO_USER_ID,
      email: 'demo@taskflow.dev',
      password: DEMO_USER_HASH,
      createdAt: new Date('2026-11-01T09:00:00Z'),
    },
  ],
  cards: [
    {
      id: 'card-1',
      title: 'Audit WebSocket latency (<50ms for US & EU clients)',
      description: 'Benchmark round-trip ping times under concurrent drag-and-drop operations across distributed regions.\n\n### Objectives:\n- Measure latency under high concurrency\n- Optimize socket payload serialization\n- Test failover reconnects',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2026-11-16',
      position: 1,
      createdAt: new Date('2026-11-10T10:00:00Z'),
      updatedAt: new Date('2026-11-10T10:00:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-2',
      title: 'Design fluid gesture physics for iOS & mobile web',
      description: 'Implement rubber-banding and micro-haptic feedback visual cues when cards cross column drop boundaries.',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-11-18',
      position: 2,
      createdAt: new Date('2026-11-10T11:00:00Z'),
      updatedAt: new Date('2026-11-10T11:00:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-3',
      title: 'Implement keyboard navigation shortcuts (N: new, /: search)',
      description: 'Empower power users to rapidly create and filter cards without leaving the keyboard.',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-11-20',
      position: 3,
      createdAt: new Date('2026-11-10T12:00:00Z'),
      updatedAt: new Date('2026-11-10T12:00:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-4',
      title: 'Refactor @dnd-kit sensors with distance activation constraint',
      description: 'Prevent accidental drag triggers on mobile taps by requiring a 5px minimum movement delta before engaging.',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-15',
      position: 1,
      createdAt: new Date('2026-11-09T14:00:00Z'),
      updatedAt: new Date('2026-11-12T09:30:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-5',
      title: 'Add fractional positioning algorithm for smooth re-ordering',
      description: 'Compute (before + after) / 2 position values to allow O(1) card moves without batch re-indexing.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-11-17',
      position: 2,
      createdAt: new Date('2026-11-09T15:00:00Z'),
      updatedAt: new Date('2026-11-12T10:15:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-6',
      title: 'Ship Fraunces & Inter warm editorial typography system',
      description: 'Replace generic sans-serif fonts with modern editorial styling and earth-toned status indicator badges.',
      status: 'done',
      priority: 'low',
      dueDate: '2026-11-12',
      position: 1,
      createdAt: new Date('2026-11-08T08:00:00Z'),
      updatedAt: new Date('2026-11-11T16:20:00Z'),
      userId: DEMO_USER_ID,
    },
    {
      id: 'card-7',
      title: 'Configure JWT authentication handshake on Socket.io connection',
      description: 'Secure real-time WebSocket communication channels with user-scoped socket rooms.',
      status: 'done',
      priority: 'medium',
      dueDate: '2026-11-13',
      position: 2,
      createdAt: new Date('2026-11-08T09:00:00Z'),
      updatedAt: new Date('2026-11-11T17:00:00Z'),
      userId: DEMO_USER_ID,
    },
  ],
};

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Restore Date objects
      data.users = data.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) }));
      data.cards = data.cards.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));
      return data;
    }
  } catch (err) {
    console.warn('Could not read existing db.json, initializing fresh store:', err);
  }

  // Initialize with initial data
  saveDatabase(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

// In-memory cache synced with disk
let db = loadDatabase();

export const localPrisma = {
  user: {
    findUnique: async (args: { where: { email?: string; id?: string } }): Promise<UserRecord | null> => {
      if (args.where.email) {
        return db.users.find((u) => u.email.toLowerCase() === args.where.email!.toLowerCase()) || null;
      }
      if (args.where.id) {
        return db.users.find((u) => u.id === args.where.id) || null;
      }
      return null;
    },
    create: async (args: { data: { email: string; password: string } }): Promise<UserRecord> => {
      const newUser: UserRecord = {
        id: crypto.randomUUID(),
        email: args.data.email,
        password: args.data.password,
        createdAt: new Date(),
      };
      db.users.push(newUser);
      saveDatabase(db);
      return newUser;
    },
  },
  card: {
    findMany: async (args?: {
      where?: { userId?: string };
      orderBy?: { position?: 'asc' | 'desc' };
    }): Promise<CardRecord[]> => {
      let filtered = args?.where?.userId
        ? db.cards.filter((c) => c.userId === args.where!.userId)
        : [...db.cards];

      if (args?.orderBy?.position) {
        filtered.sort((a, b) =>
          args.orderBy!.position === 'asc' ? a.position - b.position : b.position - a.position
        );
      }
      return filtered;
    },
    findUnique: async (args: { where: { id: string } }): Promise<CardRecord | null> => {
      return db.cards.find((c) => c.id === args.where.id) || null;
    },
    create: async (args: {
      data: {
        title: string;
        description?: string | null;
        status?: string;
        priority?: 'urgent' | 'high' | 'medium' | 'low';
        dueDate?: string | null;
        position?: number;
        userId: string;
      };
    }): Promise<CardRecord> => {
      const now = new Date();
      const newCard: CardRecord = {
        id: crypto.randomUUID(),
        title: args.data.title,
        description: args.data.description || null,
        status: args.data.status || 'todo',
        priority: args.data.priority || 'medium',
        dueDate: args.data.dueDate || null,
        position: args.data.position ?? 0,
        createdAt: now,
        updatedAt: now,
        userId: args.data.userId,
      };
      db.cards.push(newCard);
      saveDatabase(db);
      return newCard;
    },
    update: async (args: {
      where: { id: string };
      data: Partial<{
        title?: string;
        description?: string | null;
        status?: string;
        priority?: 'urgent' | 'high' | 'medium' | 'low';
        dueDate?: string | null;
        position?: number;
      }>;
    }): Promise<CardRecord> => {
      const index = db.cards.findIndex((c) => c.id === args.where.id);
      if (index === -1) {
        throw new Error(`Card with id ${args.where.id} not found`);
      }
      const existing = db.cards[index];
      const updated: CardRecord = {
        ...existing,
        ...(args.data.title !== undefined && { title: args.data.title }),
        ...(args.data.description !== undefined && { description: args.data.description }),
        ...(args.data.status !== undefined && { status: args.data.status }),
        ...(args.data.priority !== undefined && { priority: args.data.priority }),
        ...(args.data.dueDate !== undefined && { dueDate: args.data.dueDate }),
        ...(args.data.position !== undefined && { position: args.data.position }),
        updatedAt: new Date(),
      };
      db.cards[index] = updated;
      saveDatabase(db);
      return updated;
    },
    delete: async (args: { where: { id: string } }): Promise<CardRecord> => {
      const index = db.cards.findIndex((c) => c.id === args.where.id);
      if (index === -1) {
        throw new Error(`Card with id ${args.where.id} not found`);
      }
      const removed = db.cards.splice(index, 1)[0];
      saveDatabase(db);
      return removed;
    },
  },
};

export default localPrisma;
