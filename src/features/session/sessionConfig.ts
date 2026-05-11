import type { SessionConfig } from '@/types/session';

export const defaultSessionConfig: SessionConfig = {
  mode: 'solo',
  targetFps: 30,
  processEveryNthFrame: 2,
  ballConfidenceThreshold: 0.68,
  rimConfidenceThreshold: 0.82,
  makeConfidenceThreshold: 0.88,
  saveShotClips: false,
};

export const calibrationChecklist = [
  'Use a tripod, ledge, or stable surface before the scan starts.',
  'Keep the hoop visible while ShotTracker detects the rim.',
  'Step into frame so the player tracker can confirm you are visible.',
  'Live tracking starts automatically once the hoop and player locks complete.',
];
