export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  position: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}