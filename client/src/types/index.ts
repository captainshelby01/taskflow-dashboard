export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface DecisionRecord {
  title: string;
  rationale: string;
  decidedBy: string;
  date: string;
}

export interface AssigneeRecord {
  name: string;
  initials: string;
  avatarColor?: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority?: Priority;
  dueDate?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  assignee?: AssigneeRecord;
  isBlocker?: boolean;
  blockedBy?: string;
  blocks?: string;
  decision?: DecisionRecord;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

