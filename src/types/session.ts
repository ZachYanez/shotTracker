export type SessionMode = 'solo';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';
export type ShotEventType = 'attempt' | 'make' | 'miss' | 'release';
export type NativeWarning = 'hoop_lost' | 'shooter_lost' | 'low_confidence';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HoopROI = BoundingBox;

export type ShooterSeed = {
  torsoColor?: string;
  shirtEmbedding?: number[];
  initialBox?: BoundingBox;
};

export type SessionConfig = {
  mode: SessionMode;
  targetFps: 30 | 60;
  processEveryNthFrame: number;
  ballConfidenceThreshold: number;
  rimConfidenceThreshold: number;
  makeConfidenceThreshold: number;
  saveShotClips: boolean;
};

export type NativeFrameResult = {
  timestampMs: number;
  shooter?: {
    tracked: boolean;
    box?: BoundingBox;
    landmarks?: number[];
    confidence: number;
  };
  ball?: {
    detected: boolean;
    box?: BoundingBox;
    velocity?: { x: number; y: number };
    confidence: number;
  };
  rim?: {
    detected: boolean;
    box?: BoundingBox;
    confidence: number;
  };
  events: Array<{
    type: ShotEventType;
    confidence: number;
  }>;
  warnings: NativeWarning[];
};

export type ShotEvent = {
  id: string;
  sessionId: string;
  timestampMs: number;
  eventType: ShotEventType;
  confidence: number;
  clipPathLocal?: string | null;
  clipPathRemote?: string | null;
};

export type SessionSummary = {
  id: string;
  userId?: string;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  drillType: string;
  totalAttempts: number;
  totalMakes: number;
  fgPct: number;
  currentStreak: number;
  bestStreak: number;
  status: SessionStatus;
  syncState: SyncState;
};

export type LiveSessionStats = {
  attempts: number;
  makes: number;
  fgPct: number;
  currentStreak: number;
  warnings: NativeWarning[];
};
