import type { SessionSummary } from './session';

export type TrendPoint = {
  date: string;
  label: string;
  fgPct: number;
  makes: number;
  attempts: number;
};

export type HistorySnapshot = {
  lifetimeFgPct: number;
  totalAttempts: number;
  totalMakes: number;
  sessionCount: number;
  bestSession?: SessionSummary;
  trend: TrendPoint[];
  recentSessions: SessionSummary[];
};
