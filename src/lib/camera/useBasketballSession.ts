import { useSessionStore } from '@/stores/sessionStore';

export function useBasketballSession() {
  return useSessionStore((state) => ({
    liveStats: state.liveStats,
    hoopROI: state.hoopROI,
    shooterSeed: state.shooterSeed,
    isRunning: state.isRunning,
    sessionConfig: state.sessionConfig,
    beginSession: state.beginSession,
    finishSession: state.finishSession,
    recordMockShot: state.recordMockShot,
    setCalibration: state.setCalibration,
  }));
}
