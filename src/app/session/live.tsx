import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Stack, useRouter } from 'expo-router';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCameraView } from '@/components/camera/SessionCameraView';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { palette, radius } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';
import { useSessionStore } from '@/stores/sessionStore';

const SCREEN_H = Dimensions.get('window').height;

type HudCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const HUD_CORNERS: Array<{ id: HudCorner; label: string }> = [
  { id: 'topLeft', label: '↖' },
  { id: 'topRight', label: '↗' },
  { id: 'bottomLeft', label: '↙' },
  { id: 'bottomRight', label: '↘' },
];

export default function LiveSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addSession = useHistoryStore((state) => state.addSession);
  const processorStatus = getBasketballProcessorStatus();

  const {
    beginSession,
    finishSession,
    hoopROI,
    ingestNativeFrameResult,
    latestFrameResult,
    liveStats,
    sessionConfig,
    shooterSeed,
  } = useSessionStore(
    useShallow((state) => ({
      beginSession: state.beginSession,
      finishSession: state.finishSession,
      hoopROI: state.hoopROI,
      ingestNativeFrameResult: state.ingestNativeFrameResult,
      latestFrameResult: state.latestFrameResult,
      liveStats: state.liveStats,
      sessionConfig: state.sessionConfig,
      shooterSeed: state.shooterSeed,
    })),
  );

  // Session timer
  const [seconds, setSeconds] = useState(0);
  const [hudCorner, setHudCorner] = useState<HudCorner>('topLeft');
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timerLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Shot history for tick bar
  const [shotHistory, setShotHistory] = useState<boolean[]>([]);
  const prevMakesRef = useRef(0);
  const prevAttemptsRef = useRef(0);

  useEffect(() => {
    if (liveStats.attempts > prevAttemptsRef.current) {
      const wasMake = liveStats.makes > prevMakesRef.current;
      setShotHistory((prev) => [...prev.slice(-19), wasMake]);
    }
    prevMakesRef.current = liveStats.makes;
    prevAttemptsRef.current = liveStats.attempts;
  }, [liveStats.attempts, liveStats.makes]);

  const handleFinish = async () => {
    const summary = await finishSession();
    addSession(summary);
    router.replace('/session/summary');
  };

  useEffect(() => {
    beginSession();
  }, [beginSession]);

  const hudPositionStyle = getHudPositionStyle(hudCorner, insets);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerTimerPill}>
              <View style={styles.headerRecDot} />
              <Text style={styles.headerTimerText}>{timerLabel}</Text>
            </View>
          ),
        }}
      />
      {/* Full-screen camera */}
      <SessionCameraView
        hoopROI={hoopROI}
        latestFrameResult={latestFrameResult}
        mode="live"
        onFrameResult={ingestNativeFrameResult}
        processorAvailable={processorStatus.available}
        sessionConfig={sessionConfig}
        shooterSeed={shooterSeed}
        style={styles.camera}
      />

      {/* Top bar */}
      <SafeAreaView style={styles.topBarSafe} pointerEvents="box-none">
        <View style={[styles.topBar, { marginTop: insets.top > 0 ? 0 : 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.hudPill, pressed && styles.hudPillPressed]}>
            <View style={styles.xIcon} />
            <Text style={styles.hudPillText}>End</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Movable stats dialog */}
      <View style={[styles.hudCard, hudPositionStyle]}>
        <View style={styles.hudMoveRow}>
          <Text style={styles.hudMoveLabel}>Stats</Text>
          <View style={styles.cornerPicker}>
            {HUD_CORNERS.map((corner) => (
              <Pressable
                key={corner.id}
                onPress={() => setHudCorner(corner.id)}
                style={[
                  styles.cornerButton,
                  hudCorner === corner.id ? styles.cornerButtonActive : null,
                ]}>
                <Text
                  style={[
                    styles.cornerButtonText,
                    hudCorner === corner.id ? styles.cornerButtonTextActive : null,
                  ]}>
                  {corner.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={styles.statsEyebrow}>Live · Field Goal</Text>
            <View style={styles.fgRow}>
              <Text style={styles.fgNumber}>{liveStats.fgPct.toFixed(0)}</Text>
              <Text style={styles.fgSymbol}>%</Text>
            </View>
            <Text style={styles.shotCount}>
              {liveStats.makes}
              <Text style={styles.shotCountMuted}> / {liveStats.attempts}</Text>
            </Text>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsRight}>
            <View style={styles.streakBlock}>
              <Text
                style={[
                  styles.streakNumber,
                  liveStats.currentStreak >= 3 && styles.streakNumberHot,
                ]}>
                {liveStats.currentStreak}
              </Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </View>
            <View style={styles.tickBar}>
              {shotHistory.slice(-12).map((made, i) => (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    made ? styles.tickMake : styles.tickMiss,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            onPress={() => void handleFinish()}
            accessibilityLabel="Finish session"
            style={({ pressed }) => [styles.stopBtn, pressed && styles.ctaBtnPressed]}>
            <View style={styles.stopIcon} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getHudPositionStyle(corner: HudCorner, insets: { top: number; bottom: number }) {
  const top = insets.top + 62;
  const bottom = Math.max(insets.bottom + 16, 20);

  switch (corner) {
    case 'topRight':
      return { right: 12, top };
    case 'bottomLeft':
      return { bottom, left: 12 };
    case 'bottomRight':
      return { bottom, right: 12 };
    case 'topLeft':
    default:
      return { left: 12, top };
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#07070e',
    flex: 1,
  },
  camera: {
    borderRadius: 0,
    borderWidth: 0,
    height: SCREEN_H,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topBarSafe: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTimerPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerRecDot: {
    backgroundColor: palette.accent,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  headerTimerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hudPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hudPillPressed: {
    opacity: 0.7,
  },
  hudPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  xIcon: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 1,
    height: 2,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  hudCard: {
    backgroundColor: 'rgba(10, 10, 18, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    position: 'absolute',
    width: 310,
    zIndex: 10,
  },
  hudMoveRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudMoveLabel: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cornerPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  cornerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  cornerButtonActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  cornerButtonText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  cornerButtonTextActive: {
    color: '#fff',
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  statsLeft: {
    flex: 1,
    gap: 2,
  },
  statsEyebrow: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fgRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  fgNumber: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 50,
  },
  fgSymbol: {
    color: palette.accent,
    fontSize: 17,
    fontWeight: '800',
    paddingBottom: 3,
  },
  shotCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  shotCountMuted: {
    color: palette.textSubtle,
  },
  statsDivider: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 1,
  },
  statsRight: {
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 4,
  },
  streakBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  streakNumber: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  streakNumberHot: {
    color: palette.accent,
  },
  streakLabel: {
    color: palette.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  tickBar: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
    height: 18,
  },
  tick: {
    borderRadius: 2,
    width: 4,
  },
  tickMake: {
    backgroundColor: palette.success,
    height: 18,
  },
  tickMiss: {
    backgroundColor: palette.textSubtle,
    height: 11,
    opacity: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
  },
  ctaBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  stopBtn: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    elevation: 8,
    flex: 1,
    height: 48,
    justifyContent: 'center',
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  stopIcon: {
    backgroundColor: '#fff',
    borderRadius: 3,
    height: 14,
    width: 14,
  },
});
