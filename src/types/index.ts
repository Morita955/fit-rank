export interface MonthlyGoals {
  pullUps: number;   // Barra Fixa (meta padrão 200)
  pushUps: number;   // Flexões (meta padrão 1000)
  sitUps: number;    // Abdominais (meta padrão 500)
  runningKm: number; // Corrida em KM (meta padrão 50)
}

export const DEFAULT_GOALS: MonthlyGoals = {
  pullUps: 200,
  pushUps: 1000,
  sitUps: 500,
  runningKm: 50,
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified?: boolean;
  goalPullUps?: number;
  goalPushUps?: number;
  goalSitUps?: number;
  goalRunningKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  pullUps: number;
  pushUps: number;
  sitUps: number;
  runningKm: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface FriendConnection {
  id?: string;
  userA: string;
  userB: string;
  requesterId: string;
  targetId: string;
  requesterName?: string;
  targetName?: string;
  participants: string[];
  status: ConnectionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyProgress {
  id?: string;
  userId: string;
  userName: string;
  year: number;
  month: number; // 1 to 12
  pullUps: number;
  pushUps: number;
  sitUps: number;
  runningKm: number;
  viewers: string[]; // List of userIds allowed to view in ranking
  updatedAt?: string;
}

export interface AthleteProgressSummary {
  userId: string;
  userName: string;
  color: string;
  avatar?: string;
  isCurrentUser: boolean;
  pullUps: number;
  pushUps: number;
  sitUps: number;
  runningKm: number;
  // Percentage of standard monthly goals achieved
  pctPullUps: number;
  pctPushUps: number;
  pctSitUps: number;
  pctRunningKm: number;
  averageScore: number;
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export const USER_COLORS: Record<string, string> = {
  Allan: '#2563eb',   // Azul vibrante
  Jairo: '#dc2626',   // Vermelho
  Samuel: '#eab308',  // Dourado / Amarelo
  Jose: '#16a34a',    // Verde esmeralda
  José: '#16a34a',    // Variante acentuada
  Thiago: '#ea580c',  // Laranja
};

export const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#eab308', // Amber/Yellow
  '#16a34a', // Green
  '#ea580c', // Orange
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];
