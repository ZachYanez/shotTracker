import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ShotTracker',
  slug: 'shot-tracker',
  scheme: 'shottracker',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: 'com.zymgmtco.shottracker',
    supportsTablet: true,
  },
  android: {
    package: 'com.shottracker.app',
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-sqlite',
    [
      'react-native-vision-camera',
      {
        cameraPermissionText:
          'ShotTracker uses the camera to calibrate the hoop and track solo shooting sessions.',
        microphonePermissionText:
          'ShotTracker can optionally capture short clips with audio for shot review.',
        enableFrameProcessors: true,
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    eas: {
      projectId: 'ef9425a3-e240-4dd2-8795-37043d293b1d',
    },
  },
});
