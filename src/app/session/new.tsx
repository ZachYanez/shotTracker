import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { palette, spacing, typography } from '@/lib/theme';

export default function NewSessionScreen() {
  const router = useRouter();

  return (
    <ScreenShell title="New Session" subtitle="Get set up in under a minute.">
      <SectionCard title="Before you start">
        <Text style={styles.copy}>
          Place your phone on a stable surface with the hoop in frame. You'll align the hoop once, then you're good to go.
        </Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Steady your phone</Text>
              <Text style={styles.stepBody}>A tripod or ledge works best for accurate tracking.</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Align the hoop</Text>
              <Text style={styles.stepBody}>You'll mark the hoop location so every shot counts.</Text>
            </View>
          </View>
        </View>
        <PrimaryButton onPress={() => router.push('/session/calibrate')}>Continue</PrimaryButton>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumberText: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  stepTitle: {
    color: palette.text,
    ...typography.headline,
  },
  stepBody: {
    color: palette.textMuted,
    ...typography.callout,
  },
});
