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
  assignee?: {
    name: string;
    initials: string;
    avatarColor?: string;
  };
  isBlocker?: boolean;
  blockedBy?: string;
  blocks?: string;
  decision?: {
    title: string;
    rationale: string;
    decidedBy: string;
    date: string;
  };
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
      id: 'card-api-approval',
      title: 'Bank API Gateway Approval & Production Sandbox Keys',
      description: 'Awaiting production OAuth credentials and sandbox webhook activation from partner bank. Required before end-to-end payment testing can proceed.\n\n### Blocker Impact:\n- **Blocks**: End-to-End Payment Testing with 3D Secure\n- **Owner**: Sarah K. (Backend Lead)\n- **Status**: Escalated with bank account rep on Nov 12. Follow-up meeting scheduled 3:00 PM.',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-11-13',
      position: 1,
      createdAt: new Date('2026-11-08T10:00:00Z'),
      updatedAt: new Date('2026-11-13T16:00:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Sarah K.', initials: 'SK', avatarColor: '#6366f1' },
      isBlocker: true,
      blocks: 'End-to-End Payment Testing with 3D Secure',
    },
    {
      id: 'card-payment-testing',
      title: 'End-to-End Payment Testing with 3D Secure Matrix',
      description: 'Run full validation matrix of Visa Secure, Mastercard Identity Check, and AmEx SafeKey flows across mobile Safari, Android Chrome, and desktop browsers.\n\n### Dependency:\n- **Blocked by**: Bank API Gateway Approval & Production Sandbox Keys\n- **Target completion**: 24h after credentials cleared.',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-11-18',
      position: 1,
      createdAt: new Date('2026-11-09T11:00:00Z'),
      updatedAt: new Date('2026-11-12T14:30:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Alex M.', initials: 'AM', avatarColor: '#0ea5e9' },
      blockedBy: 'Bank API Gateway Approval',
    },
    {
      id: 'card-guest-checkout',
      title: 'Guest Checkout Flow & Address Autocomplete',
      description: 'Allow first-time buyers to complete purchase without mandatory registration. Integrates Google Places autocomplete to minimize mobile address typos.\n\n### Key Metrics:\n- Reduces checkout friction from 4 screens to 2\n- Expected conversion lift: +12%',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-11-19',
      position: 2,
      createdAt: new Date('2026-11-09T14:00:00Z'),
      updatedAt: new Date('2026-11-13T11:20:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Elena R.', initials: 'ER', avatarColor: '#10b981' },
      decision: {
        title: 'Keep Guest Checkout in v2.4 Release Scope',
        rationale: 'Telemetry revealed an 18% cart abandonment rate at the mandatory registration wall. Postponing guest checkout would severely risk initial launch GMV.',
        decidedBy: 'Elena R. & Product Review',
        date: 'Nov 11, 2026',
      },
    },
    {
      id: 'card-mobile-dropoff',
      title: 'Mobile Checkout Funnel Telemetry & Viewport Polish',
      description: 'Audit sticky payment CTA button behavior on compact 375px viewports (iPhone SE / mini). Ensure virtual keyboard appearance does not obscure total summary.',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-11-20',
      position: 2,
      createdAt: new Date('2026-11-10T09:00:00Z'),
      updatedAt: new Date('2026-11-10T09:00:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'David L.', initials: 'DL', avatarColor: '#f59e0b' },
    },
    {
      id: 'card-deployment-runbook',
      title: 'Production Zero-Downtime Deployment Runbook',
      description: 'Finalize step-by-step rollout protocol, database migration safety scripts, and instant feature flag rollback criteria for Friday release.',
      status: 'todo',
      priority: 'low',
      dueDate: '2026-11-20',
      position: 3,
      createdAt: new Date('2026-11-10T12:00:00Z'),
      updatedAt: new Date('2026-11-10T12:00:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'David L.', initials: 'DL', avatarColor: '#f59e0b' },
    },
    {
      id: 'card-stripe-elements',
      title: 'Stripe Elements Migration & Apple Pay Integration',
      description: 'Migrated legacy form inputs to unified payment element with native Apple Pay and Google Pay one-click tokenization.',
      status: 'done',
      priority: 'high',
      dueDate: '2026-11-12',
      position: 1,
      createdAt: new Date('2026-11-06T08:00:00Z'),
      updatedAt: new Date('2026-11-12T16:30:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Alex M.', initials: 'AM', avatarColor: '#0ea5e9' },
    },
    {
      id: 'card-cart-drawer',
      title: 'Responsive Cart Drawer & Tax Estimation Layout',
      description: 'Designed sliding slide-over cart drawer with instant promo code validation, shipping rate calculation, and cart item quantity steppers.',
      status: 'done',
      priority: 'medium',
      dueDate: '2026-11-11',
      position: 2,
      createdAt: new Date('2026-11-06T10:00:00Z'),
      updatedAt: new Date('2026-11-11T14:15:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Elena R.', initials: 'ER', avatarColor: '#10b981' },
    },
    {
      id: 'card-refund-webhook',
      title: 'Idempotent Refund & Dispute Webhook Handlers',
      description: 'Engineered cryptographic signature verification and idempotent processing for charge.refunded and dispute.created webhooks.',
      status: 'done',
      priority: 'low',
      dueDate: '2026-11-10',
      position: 3,
      createdAt: new Date('2026-11-05T11:00:00Z'),
      updatedAt: new Date('2026-11-10T17:45:00Z'),
      userId: DEMO_USER_ID,
      assignee: { name: 'Sarah K.', initials: 'SK', avatarColor: '#6366f1' },
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
      data: Partial<CardRecord>;
    }): Promise<CardRecord> => {
      const index = db.cards.findIndex((c) => c.id === args.where.id);
      if (index === -1) {
        throw new Error(`Card with id ${args.where.id} not found`);
      }
      const existing = db.cards[index];
      const updated: CardRecord = {
        ...existing,
        ...args.data,
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
