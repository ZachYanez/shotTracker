import type {
  CalibrationReadiness,
  CalibrationReadinessStep,
  NativeFrameResult,
  NativeWarning,
} from '@/types/session';

export const CALIBRATION_STABLE_TARGET_MS = 1800;

const FIRST_FRAME_WINDOW_MS = 150;
const MAX_FRAME_WINDOW_MS = 250;

type CalibrationTracker = {
  lastTimestampMs?: number;
  rimStableMs: number;
  shooterStableMs: number;
  readiness: CalibrationReadiness;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildSteps(
  rimStableMs: number,
  shooterStableMs: number,
  warnings: NativeWarning[],
): CalibrationReadinessStep[] {
  const hoopComplete = rimStableMs >= CALIBRATION_STABLE_TARGET_MS;
  const shooterComplete = shooterStableMs >= CALIBRATION_STABLE_TARGET_MS;
  const hardWarning =
    warnings.includes('hoop_lost') || warnings.includes('shooter_lost') || warnings.includes('low_confidence');

  return [
    {
      id: 'hoop',
      label: 'Hoop lock',
      status: hoopComplete ? 'complete' : rimStableMs > 0 ? 'active' : 'pending',
      detail: hoopComplete
        ? 'Rim framing held steady long enough to use as the scene anchor.'
        : rimStableMs > 0
          ? `Hold steady for ${Math.max(
              0.1,
              (CALIBRATION_STABLE_TARGET_MS - rimStableMs) / 1000,
            ).toFixed(1)}s more.`
          : 'Keep the hoop inside the guide until the lock starts building.',
    },
    {
      id: 'shooter',
      label: 'Shooter seed',
      status: shooterComplete ? 'complete' : shooterStableMs > 0 ? 'active' : 'pending',
      detail: shooterComplete
        ? 'The shooter zone is stable enough to seed the live tracker.'
        : shooterStableMs > 0
          ? `Stay inside the zone for ${Math.max(
              0.1,
              (CALIBRATION_STABLE_TARGET_MS - shooterStableMs) / 1000,
            ).toFixed(1)}s more.`
          : 'Stage one shooter in the box so live tracking has a clean starting point.',
    },
    {
      id: 'ready',
      label: 'Start live',
      status: hoopComplete && shooterComplete && !hardWarning ? 'complete' : 'pending',
      detail:
        hoopComplete && shooterComplete && !hardWarning
          ? 'Calibration is locked. You can start the live shot tracker.'
          : hardWarning
            ? 'Tracking dropped. Re-center the hoop and restage the shooter.'
            : 'Both locks need to settle before live scoring starts.',
    },
  ];
}

function buildRecommendation(
  rimStableMs: number,
  shooterStableMs: number,
  warnings: NativeWarning[],
  readyToStart: boolean,
) {
  if (readyToStart) {
    return 'Calibration is stable enough to start live shot tracking.';
  }

  if (warnings.includes('hoop_lost')) {
    return 'The hoop lock dropped. Re-center the rim and hold the phone steady.';
  }

  if (warnings.includes('shooter_lost')) {
    return 'The shooter seed dropped. Move back into the capture zone and hold still.';
  }

  if (warnings.includes('low_confidence')) {
    return 'Pose confidence is weak. Use a steadier angle and keep the shooter fully inside the frame.';
  }

  if (rimStableMs <= 0) {
    return 'Align the hoop inside the guide first. The live tracker needs a stable rim reference.';
  }

  if (shooterStableMs <= 0) {
    return 'Step into the shooter zone so the session starts with one clean subject.';
  }

  return 'Locks are forming. Hold the phone steady for another moment before you begin.';
}

function buildReadiness(
  rimStableMs: number,
  shooterStableMs: number,
  warnings: NativeWarning[],
): CalibrationReadiness {
  const readinessScore = Number(
    (
      (clamp(rimStableMs, 0, CALIBRATION_STABLE_TARGET_MS) +
        clamp(shooterStableMs, 0, CALIBRATION_STABLE_TARGET_MS)) /
      (CALIBRATION_STABLE_TARGET_MS * 2)
    ).toFixed(2),
  );
  const readyToStart =
    rimStableMs >= CALIBRATION_STABLE_TARGET_MS &&
    shooterStableMs >= CALIBRATION_STABLE_TARGET_MS &&
    !warnings.includes('hoop_lost') &&
    !warnings.includes('shooter_lost') &&
    !warnings.includes('low_confidence');

  let status: CalibrationReadiness['status'] = 'warming';

  if (readyToStart) {
    status = 'ready';
  } else if (rimStableMs <= 0) {
    status = 'aligning_hoop';
  } else if (shooterStableMs <= 0) {
    status = 'staging_shooter';
  }

  return {
    status,
    source: 'native',
    readyToStart,
    readinessScore,
    stableTargetMs: CALIBRATION_STABLE_TARGET_MS,
    rimStableMs,
    shooterStableMs,
    warnings,
    recommendation: buildRecommendation(rimStableMs, shooterStableMs, warnings, readyToStart),
    steps: buildSteps(rimStableMs, shooterStableMs, warnings),
  };
}

export function createInitialCalibrationReadiness(): CalibrationReadiness {
  return buildReadiness(0, 0, []);
}

export function createInitialCalibrationTracker(): CalibrationTracker {
  return {
    lastTimestampMs: undefined,
    rimStableMs: 0,
    shooterStableMs: 0,
    readiness: createInitialCalibrationReadiness(),
  };
}

export function advanceCalibrationTracker(
  tracker: CalibrationTracker,
  result: NativeFrameResult,
): CalibrationTracker {
  const frameDelta =
    tracker.lastTimestampMs == null
      ? FIRST_FRAME_WINDOW_MS
      : clamp(result.timestampMs - tracker.lastTimestampMs, 0, MAX_FRAME_WINDOW_MS);
  const rimLocked = Boolean(result.rim?.detected && result.rim.box);
  const shooterLocked = Boolean(result.shooter?.tracked && result.shooter.box);
  const rimStableMs = rimLocked ? tracker.rimStableMs + frameDelta : 0;
  const shooterStableMs = shooterLocked ? tracker.shooterStableMs + frameDelta : 0;

  return {
    lastTimestampMs: result.timestampMs,
    rimStableMs,
    shooterStableMs,
    readiness: buildReadiness(rimStableMs, shooterStableMs, result.warnings),
  };
}

export function createManualCalibrationReadiness(
  readiness: CalibrationReadiness = createInitialCalibrationReadiness(),
): CalibrationReadiness {
  return {
    ...readiness,
    source: 'manual',
    status: 'manual_override',
    readyToStart: true,
    recommendation: 'Saved with rough framing. Recalibrate if the live tracker feels loose.',
    snapshotAt: new Date().toISOString(),
  };
}

export function snapshotCalibrationReadiness(
  readiness: CalibrationReadiness,
  source: CalibrationReadiness['source'] = readiness.source,
): CalibrationReadiness {
  return {
    ...readiness,
    source,
    snapshotAt: new Date().toISOString(),
  };
}

export function formatCalibrationStatusLabel(readiness?: CalibrationReadiness) {
  if (!readiness) {
    return 'Not saved';
  }

  switch (readiness.status) {
    case 'ready':
      return readiness.source === 'manual' ? 'Manual lock' : 'Locked';
    case 'manual_override':
      return 'Manual save';
    case 'aligning_hoop':
      return 'Align hoop';
    case 'staging_shooter':
      return 'Stage shooter';
    case 'warming':
    default:
      return 'Warming';
  }
}

export type { CalibrationTracker };
