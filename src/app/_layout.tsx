import 'react-native-gesture-handler';

import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeDatabase } from '@/lib/db/sqlite';
import { palette, typography } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';
import { useSyncStore } from '@/stores/syncStore';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        await initializeDatabase();
        await useHistoryStore.getState().hydrate();
        await useSyncStore.getState().hydrate();
      } catch (error) {
        console.warn('App bootstrap failed', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <View style={styles.loadingScreen}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <Text style={styles.loadingTitle}>SHOTTRACKER</Text>
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accent} size="small" />
              <Text style={styles.loadingBody}>Loading session data…</Text>
            </View>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: palette.background },
            headerStyle: { backgroundColor: 'rgba(7, 7, 14, 0.97)' },
            headerShadowVisible: false,
            headerTintColor: palette.text,
            headerTitleStyle: {
              fontSize: 17,
              fontWeight: '700',
            },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="session/new" options={{ title: 'New Session' }} />
          <Stack.Screen name="session/calibrate" options={{ title: 'Calibrate' }} />
          <Stack.Screen name="session/live" options={{ title: 'Live Session' }} />
          <Stack.Screen name="session/summary" options={{ title: 'Summary' }} />
          <Stack.Screen name="session-details/[id]" options={{ title: 'Session Detail' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderColor: 'rgba(255, 56, 92, 0.28)',
    borderRadius: 20,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    width: 64,
  },
  brandLetter: {
    color: palette.accent,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  loadingTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingBody: {
    color: palette.textMuted,
    ...typography.callout,
  },
});
