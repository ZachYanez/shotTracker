import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HoopOverlay } from '@/components/camera/HoopOverlay';
import { ShooterGuide } from '@/components/camera/ShooterGuide';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { calibrationChecklist } from '@/features/session/sessionConfig';
import { palette, radius, spacing } from '@/lib/theme';
import { useSessionStore } from '@/stores/sessionStore';

export default function CalibrateScreen() {
  const router = useRouter();
  const hoopROI = useSessionStore((state) => state.hoopROI);
  const shooterSeed = useSessionStore((state) => state.shooterSeed);
  const setCalibration = useSessionStore((state) => state.setCalibration);

  return (
    <ScreenShell
      title="Calibrate"
      subtitle="Lock the shooter, confirm the hoop box, and store the first calibration packet.">
      <SectionCard eyebrow="Setup" title="Shooter guidance">
        <ShooterGuide steps={calibrationChecklist} />
      </SectionCard>

      <SectionCard eyebrow="Preview" title="Reference framing">
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewChip}>Tripod setup</Text>
            <Text style={styles.previewChip}>Hoop locked</Text>
          </View>
          <View style={styles.shooterBox}>
            <Text style={styles.shooterLabel}>Shooter zone</Text>
          </View>
          <HoopOverlay hoopROI={hoopROI} />
          <View style={styles.previewFooter}>
            <Text style={styles.footerTitle}>Calibration target</Text>
            <Text style={styles.footerBody}>Stand centered in the shooter zone and keep the rim fully visible.</Text>
          </View>
        </View>
        <PrimaryButton
          onPress={() => {
            setCalibration({ hoopROI, shooterSeed });
            router.push('/session/live');
          }}>
          Use This Calibration
        </PrimaryButton>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: palette.backgroundElevated,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  previewHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    position: 'absolute',
    top: spacing.md,
    zIndex: 2,
  },
  previewChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.pill,
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  shooterBox: {
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    bottom: 56,
    left: '18%',
    position: 'absolute',
    top: '32%',
    width: '34%',
  },
  shooterLabel: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
    left: 8,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 4,
    position: 'absolute',
    top: -12,
  },
  previewFooter: {
    backgroundColor: 'rgba(5,5,5,0.78)',
    bottom: 0,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
  },
  footerTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  footerBody: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
