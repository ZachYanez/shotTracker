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
  'Stand inside the shooter zone for 2 to 3 seconds, then scan your outfit.',
  'For runs with more than one hooper, scan each person one at a time before starting.',
  'Confirm the hoop framing before you begin.',
];
