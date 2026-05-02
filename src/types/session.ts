export type SessionMode = 'solo';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';
export type ShotEventType = 'attempt' | 'make' | 'miss' | 'release';
export type NativeWarning = 'hoop_lost' | 'shooter_lost' | 'low_confidence';
export type CalibrationReadinessStatus =
  | 'warming'
  | 'aligning_hoop'
  | 'staging_shooter'
  | 'ready'
  | 'manual_override';
export type CalibrationReadinessSource = 'native' | 'manual';
export type CalibrationReadinessStepId = 'hoop' | 'shooter' | 'ready';
export type CalibrationReadinessStepStatus = 'pending' | 'active' | 'complete';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HoopROI = BoundingBox;

export type ShooterSeed = {
  primaryHooperId?: string;
  torsoColor?: string;
  shirtEmbedding?: number[];
  initialBox?: BoundingBox;
  trackedHoopers?: HooperProfile[];
};

export type HooperProfile = {
  id: string;
  label: string;
  scannedAt: string;
  initialBox?: BoundingBox;
  torsoColor?: string;
  confidence?: number;
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
    appearance?: {
      torsoColor?: string;
    };
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

export type NativeFrameTelemetrySample = {
  id: string;
  sessionId: string;
  timestampMs: number;
  trigger: 'event' | 'warning';
  eventTypes: ShotEventType[];
  warnings: NativeWarning[];
  shooter?: {
    tracked: boolean;
    box?: BoundingBox;
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

export type CalibrationReadinessStep = {
  id: CalibrationReadinessStepId;
  label: string;
  status: CalibrationReadinessStepStatus;
  detail: string;
};

export type CalibrationReadiness = {
  status: CalibrationReadinessStatus;
  source: CalibrationReadinessSource;
  readyToStart: boolean;
  readinessScore: number;
  stableTargetMs: number;
  rimStableMs: number;
  shooterStableMs: number;
  warnings: NativeWarning[];
  recommendation: string;
  steps: CalibrationReadinessStep[];
  snapshotAt?: string;
};

export type SessionDeviceInfo = {
  platform?: string;
  targetFps?: number;
  processEveryNthFrame?: number;
  calibrationReadiness?: CalibrationReadiness;
  [key: string]: unknown;
};

export type SessionCalibrationPacket = {
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
  deviceInfo?: SessionDeviceInfo;
};

export type StoredSessionCalibration = SessionCalibrationPacket & {
  createdAt: string;
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

export type SessionDetails = {
  session: SessionSummary;
  shotEvents: ShotEvent[];
  calibration?: StoredSessionCalibration;
  nativeFrameSamples: NativeFrameTelemetrySample[];
};

export type LiveSessionStats = {
  attempts: number;
  makes: number;
  fgPct: number;
  currentStreak: number;
  bestStreak: number;
  warnings: NativeWarning[];
};
