import { useEffect, useState } from 'react';

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const DEFAULT_STILLNESS_THRESHOLD = 0.045;
const DEFAULT_STABLE_TARGET_MS = 1600;
const SAMPLE_INTERVAL_MS = 100;

type PhoneStillnessOptions = {
  active: boolean;
  stableTargetMs?: number;
  threshold?: number;
};

type PhoneStillnessState = {
  available: boolean;
  holdMs: number;
  isStill: boolean;
  motionScore: number;
};

type GyroscopeMeasurement = {
  x: number;
  y: number;
  z: number;
};

type GyroscopeModule = {
  addListener: (listener: (measurement: GyroscopeMeasurement) => void) => { remove: () => void };
  isAvailableAsync: () => Promise<boolean>;
  setUpdateInterval: (intervalMs: number) => void;
};

const initialState: PhoneStillnessState = {
  available: Platform.OS === 'ios' || Platform.OS === 'android',
  holdMs: 0,
  isStill: false,
  motionScore: 0,
};

export function usePhoneStillness({
  active,
  stableTargetMs = DEFAULT_STABLE_TARGET_MS,
  threshold = DEFAULT_STILLNESS_THRESHOLD,
}: PhoneStillnessOptions): PhoneStillnessState {
  const [state, setState] = useState<PhoneStillnessState>(initialState);

  useEffect(() => {
    if (!active || !initialState.available) {
      setState((previous) => ({
        ...previous,
        holdMs: 0,
        isStill: false,
        motionScore: 0,
      }));
      return undefined;
    }

    let isCancelled = false;
    let lastSampleAtMs = Date.now();
    let subscription: { remove: () => void } | undefined;

    const startGyroscope = async () => {
      try {
        if (!requireOptionalNativeModule('ExponentGyroscope')) {
          setState((previous) => ({
            ...previous,
            available: false,
            holdMs: stableTargetMs,
            isStill: true,
            motionScore: 0,
          }));
          return;
        }

        const { default: Gyroscope } = (await import('expo-sensors/build/Gyroscope')) as {
          default: GyroscopeModule;
        };
        const isAvailable = await Gyroscope.isAvailableAsync();

        if (isCancelled) {
          return;
        }

        if (!isAvailable) {
          setState((previous) => ({
            ...previous,
            available: false,
            holdMs: stableTargetMs,
            isStill: true,
            motionScore: 0,
          }));
          return;
        }

        Gyroscope.setUpdateInterval(SAMPLE_INTERVAL_MS);

        subscription = Gyroscope.addListener(({ x, y, z }) => {
          const now = Date.now();
          const elapsedMs = Math.min(now - lastSampleAtMs, SAMPLE_INTERVAL_MS * 2);
          lastSampleAtMs = now;

          const motionScore = Math.sqrt((x * x) + (y * y) + (z * z));
          const sampleIsStill = motionScore <= threshold;

          setState((previous) => {
            const holdMs = sampleIsStill ? Math.min(previous.holdMs + elapsedMs, stableTargetMs) : 0;

            return {
              available: true,
              holdMs,
              isStill: holdMs >= stableTargetMs,
              motionScore,
            };
          });
        });
      } catch {
        if (!isCancelled) {
          setState((previous) => ({
            ...previous,
            available: false,
            holdMs: stableTargetMs,
            isStill: true,
            motionScore: 0,
          }));
        }
      }
    };

    void startGyroscope();

    return () => {
      isCancelled = true;
      subscription?.remove();
    };
  }, [active, stableTargetMs, threshold]);

  return state;
}
