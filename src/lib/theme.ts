export const palette = {
  background: '#080808',
  backgroundElevated: '#0e0e10',
  surface: '#161618',
  surfaceMuted: '#1c1c1f',
  surfaceSoft: '#222226',
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  text: '#f5f5f5',
  textSecondary: '#c0c0c6',
  textMuted: '#9a9aa4',
  textSubtle: '#6e6e78',
  accent: '#ff385c',
  accentStrong: '#ff5a5f',
  accentSoft: 'rgba(255, 56, 92, 0.12)',
  success: '#34c759',
  successSoft: 'rgba(52, 199, 89, 0.12)',
  warning: '#ffbd52',
  danger: '#ff857d',
};

export const typography = {
  largeTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  title1: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  title2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
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
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
};

export const timing = {
  fast: 120,
  normal: 200,
  slow: 350,
};
