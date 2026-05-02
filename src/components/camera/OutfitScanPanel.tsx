import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '@/lib/theme';
import type { NativeFrameResult, ShooterSeed } from '@/types/session';

import { PrimaryButton } from '../common/PrimaryButton';

type OutfitScanPanelProps = {
  latestFrameResult?: NativeFrameResult;
  shooterSeed?: ShooterSeed;
  onScan: () => void;
  onClear: () => void;
};

function formatConfidence(confidence?: number) {
  if (typeof confidence !== 'number') {
    return 'No lock';
  }

  return `${Math.round(confidence * 100)}% lock`;
}

export function OutfitScanPanel({
  latestFrameResult,
  shooterSeed,
  onScan,
  onClear,
}: OutfitScanPanelProps) {
  const scannedHoopers = shooterSeed?.trackedHoopers ?? [];
  const canScan = Boolean(latestFrameResult?.shooter?.tracked && latestFrameResult.shooter.box);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Outfit scan</Text>
          <Text style={styles.copy}>
            Step into the shooter zone, scan the fit, then repeat for another hooper if you want them tagged in this setup.
          </Text>
        </View>
        <View style={[styles.lockChip, canScan ? styles.lockChipActive : null]}>
          <Text style={[styles.lockChipText, canScan ? styles.lockChipTextActive : null]}>
            {formatConfidence(latestFrameResult?.shooter?.confidence)}
          </Text>
        </View>
      </View>

      {scannedHoopers.length > 0 ? (
        <View style={styles.hooperList}>
          {scannedHoopers.map((hooper, index) => (
            <View key={hooper.id} style={styles.hooperRow}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: hooper.torsoColor ?? palette.surfaceSoft,
                  },
                ]}
              />
              <View style={styles.hooperCopy}>
                <Text style={styles.hooperLabel}>{hooper.label}</Text>
                <Text style={styles.hooperMeta}>
                  {index === 0 ? 'Primary tracker seed' : 'Stored setup seed'} - {formatConfidence(hooper.confidence)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No hoopers scanned yet. The default shooter zone is still available.</Text>
      )}

      <View style={styles.actions}>
        <PrimaryButton disabled={!canScan} onPress={onScan}>
          {scannedHoopers.length === 0 ? 'Scan My Outfit' : 'Add Another Hooper'}
        </PrimaryButton>
        {scannedHoopers.length > 0 ? (
          <PrimaryButton onPress={onClear} variant="secondary">
            Clear Scans
          </PrimaryButton>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: palette.text,
    ...typography.headline,
  },
  copy: {
    color: palette.textMuted,
    ...typography.callout,
  },
  lockChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lockChipActive: {
    backgroundColor: palette.successSoft,
  },
  lockChipText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  lockChipTextActive: {
    color: palette.success,
  },
  hooperList: {
    gap: spacing.sm,
  },
  hooperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  swatch: {
    borderColor: palette.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 36,
    width: 36,
  },
  hooperCopy: {
    flex: 1,
  },
  hooperLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  hooperMeta: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: palette.textMuted,
    ...typography.callout,
  },
  actions: {
    gap: spacing.sm,
  },
});
