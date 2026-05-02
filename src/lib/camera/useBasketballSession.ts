import { useSessionStore } from '@/stores/sessionStore';

export function useBasketballSession() {
  return useSessionStore((state) => ({
    calibrationReadiness: state.calibrationReadiness,
    liveStats: state.liveStats,
    latestFrameResult: state.latestFrameResult,
    hoopROI: state.hoopROI,
    savedCalibrationReadiness: state.savedCalibrationReadiness,
    shooterSeed: state.shooterSeed,
    isRunning: state.isRunning,
    sessionConfig: state.sessionConfig,
    beginSession: state.beginSession,
    finishSession: state.finishSession,
    ingestNativeFrameResult: state.ingestNativeFrameResult,
    recordMockShot: state.recordMockShot,
    resetCalibrationPreview: state.resetCalibrationPreview,
    setCalibration: state.setCalibration,
  }));
}
