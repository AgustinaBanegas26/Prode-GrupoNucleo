export type AppColorScheme = 'light' | 'dark';

export const palette = {
  primary: '#CC2627',
  gray: '#D9D9D9',
  white: '#FFFFFF',
  backgroundLight: '#F8F9FB',
  textLight: '#1F2937',
  backgroundDark: '#0B0F16',
  surfaceDark: '#111827',
  textDark: '#F8F9FB',
  borderDark: '#273244',
  mutedDark: '#9CA3AF',
} as const;

export type AppTheme = {
  scheme: AppColorScheme;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    primary: string;
    border: string;
    muted: string;
  };
};

export const createTheme = (scheme: AppColorScheme): AppTheme => {
  if (scheme === 'dark') {
    return {
      scheme,
      isDark: true,
      colors: {
        background: palette.backgroundDark,
        surface: palette.surfaceDark,
        text: palette.textDark,
        primary: palette.primary,
        border: palette.borderDark,
        muted: palette.mutedDark,
      },
    };
  }

  return {
    scheme: 'light',
    isDark: false,
    colors: {
      background: palette.backgroundLight,
      surface: palette.white,
      text: palette.textLight,
      primary: palette.primary,
      border: palette.gray,
      muted: '#6B7280',
    },
  };
};
