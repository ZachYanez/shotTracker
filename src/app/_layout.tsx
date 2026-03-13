import 'react-native-gesture-handler';

import { useEffect } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeDatabase } from '@/lib/db/sqlite';
import { palette } from '@/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    void initializeDatabase().catch((error) => {
      console.warn('SQLite bootstrap failed', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: palette.background },
            headerStyle: { backgroundColor: palette.background },
            headerShadowVisible: false,
            headerTintColor: palette.text,
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
            },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="session/new" options={{ title: 'Start Session' }} />
          <Stack.Screen name="session/calibrate" options={{ title: 'Calibrate' }} />
          <Stack.Screen name="session/live" options={{ title: 'Live Session' }} />
          <Stack.Screen name="session/summary" options={{ title: 'Summary' }} />
          <Stack.Screen name="session-details/[id]" options={{ title: 'Session Detail' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
