# ShotTracker

ShotTracker is a mobile basketball training app for tracking solo shooting sessions with camera-assisted analysis, calibration, and performance history.

The product is designed to help players turn a phone into a lightweight session tracker for makes, attempts, field-goal percentage, and progress over time.

## Highlights

- Calibration flow for hoop and shooter positioning
- Live session tracking with camera-based processing
- Session summaries, history, and trend views
- Local data storage with sync-oriented architecture
- Custom native processing module for basketball session workflows

## Tech Stack

- Expo
- React Native
- TypeScript
- vision-camera
- Zustand
- expo-sqlite
- Supabase

## Local Development

```bash
npm install
npx expo start
```

Additional scripts:

```bash
npm run ios
npm run android
npm run web
npm run typecheck
```

## Development Note

Because the app uses camera and native processing workflows, development builds are the expected path for full functionality rather than a minimal Expo Go-only setup.

## Product Focus

ShotTracker is built around repeatable practice sessions: calibrate once, shoot, review the numbers, and come back with better historical context the next time.
