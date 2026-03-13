import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

import type { HoopROI, NativeFrameResult, SessionConfig, ShooterSeed } from '@/types/session';

export const BASKETBALL_PROCESSOR_PLUGIN = 'basketballSessionProcessor';

type ProcessorParams = {
  sessionConfig: SessionConfig;
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
};

const nativeProcessor = VisionCameraProxy.initFrameProcessorPlugin(
  BASKETBALL_PROCESSOR_PLUGIN,
  {},
);

export function isBasketballProcessorAvailable() {
  return nativeProcessor != null;
}

export function getBasketballProcessorStatus() {
  if (nativeProcessor) {
    return {
      available: true,
      modeLabel: 'Native detection',
      shortLabel: 'Active',
      description:
        'Real shot detection is backed by the registered native VisionCamera frame processor.',
    };
  }

  return {
    available: false,
    modeLabel: 'Demo mode',
    shortLabel: 'Plugin missing',
    description: `No native frame processor is registered for ${BASKETBALL_PROCESSOR_PLUGIN}. The app falls back to mock controls so the session flow can still be tested without live shot detection.`,
  };
}

export function processBasketballFrame(frame: Frame, params: ProcessorParams) {
  'worklet';

  if (!nativeProcessor) {
    return undefined;
  }

  return nativeProcessor.call(
    frame,
    params as unknown as Record<string, string | number | boolean | ArrayBuffer | undefined>,
  ) as NativeFrameResult | undefined;
}
