export interface RemitItem {
  id: number;
  name: string;
  type: number;
  displayName: string;
  suffix?: string;
  prefix?: string;
  helperText?: string;
}

export interface ChallengePlayer {
  id: number;
  f: string;
  g?: string;
  v: number[];
  p?: string;
}

export interface Challenge {
  gameNumber: number;
  remit: RemitItem[][];
  players: ChallengePlayer[];
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: string;
}

export interface PlayerCategoryLinks {
  [categoryCode: string]: number[];
}

export type PlayerDifficulty = "Beginner" | "Medium" | "Elite";

export interface Player {
  id: number;
  f: string;
  g: string;
  positions: string[];
  categoryLinks: PlayerCategoryLinks;
  challengeCount: number;
  difficulty?: PlayerDifficulty;
  image?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "league" | "national" | "club" | "trophy" | "achievement";
  media: string;
  numericIds: number[];
  description: string;
  sortOrder: number;
  updatedAt?: string;
}

export interface AdminUser {
  role: "admin" | "editor";
  email: string;
  name: string;
}

export interface GameConfig {
  general: {
    startDate: string;
    cardSize: number;
    cardSizeOptions: number[];
    totalAttempts: number;
    playerTimer: number;
    scoring: { correctPoints: number };
  };
  roomCategories: {
    [id: string]: {
      category: string;
      label: string;
      media: string;
    };
  };
  theme: {
    primaryColor: string;
    surfaceColor: string;
  };
  positions: string[];
  updatedAt?: string;
}

export interface Deployment {
  deployedAt: string;
  deployedBy: string;
  status: "success" | "failed";
  vercelUrl: string;
  summary: {
    challenges: number;
    players: number;
  };
}

export type DevLogType = "ميزة جديدة" | "تصحيح" | "تحسين" | "تحديث بيانات" | "إعدادات";

export type DevLogStatus = "new" | "in_progress" | "done";

export interface DevLogEntry {
  id: string;
  title: string;
  type: DevLogType;
  status: DevLogStatus;
  timestamp: number;
  notes?: string;
}

export type ActivityTable = "players" | "challenges" | "categories" | "config";

export interface ActivityEntry {
  table: ActivityTable;
  action: string;
  description: string;
  updatedAt: string;
}

export interface DashboardData {
  admins: Record<string, AdminUser>;
  challenges: Record<string, Challenge>;
  categories: Record<string, Category>;
  players: Record<string, Player>;
  config: GameConfig;
  deployments: Record<string, Deployment>;
}
