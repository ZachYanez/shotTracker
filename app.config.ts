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
  },
});
