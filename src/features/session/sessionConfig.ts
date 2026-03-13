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
  'Keep one shooter and one hoop in frame.',
  'Use a tripod or stable surface.',
  'Stand still for 2 to 3 seconds so pose lock can stabilize.',
  'Confirm the hoop box before you begin.',
];
