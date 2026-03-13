import type {
  LocalSessionRow,
  LocalShotEventRow,
  SessionCalibrationRow,
  SessionRow,
  ShotEventRow,
} from '@/types/api';

export type SessionRecord = SessionRow | LocalSessionRow;
export type ShotEventRecord = ShotEventRow | LocalShotEventRow;
export type CalibrationRecord = SessionCalibrationRow;
