// ─── Palette ──────────────────────────────────────────────────────────────────
// Deep space navy-black base. Not pure black — has a blue DNA that makes glass
// cards feel like they're floating rather than just being darker rectangles.
export const palette = {
  background: '#07070e',
  backgroundElevated: '#0d0d1a',
  surface: '#10101e',
  surfaceMuted: '#161626',
  surfaceSoft: '#1c1c2e',

  // Frosted glass — used on cards, overlays, and panels
  glass: 'rgba(18, 18, 32, 0.82)',
  glassBorder: 'rgba(255, 255, 255, 0.09)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',

  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.13)',

  text: '#f0f0fa',
  textSecondary: '#b4b4cc',
  textMuted: '#8888a4',
  textSubtle: '#565672',

  // Primary accent — hot red
  accent: '#ff385c',
  accentStrong: '#ff5a5f',
  accentSoft: 'rgba(255, 56, 92, 0.14)',
  accentGlow: 'rgba(255, 56, 92, 0.42)',

  // Retro neon secondary — used sparingly on HUD highlights and peak values
  neon: '#00d4ff',
  neonSoft: 'rgba(0, 212, 255, 0.11)',

  success: '#00d084',
  successSoft: 'rgba(0, 208, 132, 0.12)',
  warning: '#ffbd52',
  danger: '#ff857d',
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const typography = {
  largeTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 38,
  },
  title1: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  title2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  // Uppercase HUD labels — slightly wider tracking for the retro scoreboard feel
  overline: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.1,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  // Big stat numbers — tight & punchy like a scoreboard
  stat: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 34,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Radius ───────────────────────────────────────────────────────────────────
export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 12,
  },
  // Omnidirectional neon glow on primary buttons
  button: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
};

// ─── Timing ───────────────────────────────────────────────────────────────────
export const timing = {
  fast: 120,
  normal: 200,
  slow: 350,
};
