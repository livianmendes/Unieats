export type ColorSchemeName = 'light' | 'dark';

export const Colors = {
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    300: '#fca5a5',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    400: '#9ca3af',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  },
  success: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
  warning: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  danger: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  info: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
  background: '#f9fafb',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff',
  black: '#000000',
  light: {
    background: '#FAD8D8',
    card: '#ffffff',
    text: '#111827',
    tint: '#050505',
    icon: '#6b7280',
    border: '#e5e7eb',
    placeholder: '#6b7280',
    muted: '#d1d5db',
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#ef4444',
  },
  dark: {
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    tint: '#ef4444',
    icon: '#9ca3af',
    border: '#374151',
    placeholder: '#9ca3af',
    muted: '#6b7280',
    success: '#34D399',
    warning: '#fbbf24',
    error: '#f87171',
  },
} as const;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  rounded: 'System',
  mono: 'Courier New',
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const Radii = {
  small: 8,
  medium: 14,
  large: 24,
} as const;

export const Typography = {
  label: 12,
  body: 16,
  subtitle: 18,
  title: 28,
  hero: 34,
} as const;
