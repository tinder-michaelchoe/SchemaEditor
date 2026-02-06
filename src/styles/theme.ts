export const lightTheme = {
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f7',
    bgTertiary: '#e5e5ea',
    textPrimary: '#1d1d1f',
    textSecondary: '#86868b',
    textTertiary: '#aeaeb2',
    border: '#d2d2d7',
    accent: '#007aff',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
  },
  json: {
    key: '#c41a16',
    string: '#c41a16',
    number: '#1c00cf',
    boolean: '#aa0d91',
    null: '#aa0d91',
  },
  fonts: {
    system:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  },
  radii: { sm: '4px', md: '6px', lg: '8px', full: '9999px' },
  fontSizes: {
    '10px': '10px',
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
} as const;

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    bgPrimary: '#1c1c1e',
    bgSecondary: '#2c2c2e',
    bgTertiary: '#3a3a3c',
    textPrimary: '#f5f5f7',
    textSecondary: '#98989d',
    textTertiary: '#636366',
    border: '#38383a',
    accent: '#0a84ff',
    error: '#ff453a',
    success: '#30d158',
    warning: '#ff9f0a',
  },
  json: {
    key: '#fc5fa3',
    string: '#fc6a5d',
    number: '#d0bf69',
    boolean: '#fc5fa3',
    null: '#fc5fa3',
  },
};

export type AppTheme = typeof lightTheme;
