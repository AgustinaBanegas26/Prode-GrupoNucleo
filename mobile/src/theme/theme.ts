/**
 * Paleta completa de colores con sistema de variantes
 * Colores principales: #CC2627 (Rojo Grupo Núcleo)
 * Modos: Claro, Oscuro, Sistema
 */

type ColorVariant = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

/**
 * Función para generar variantes de color automáticamente
 * Basado en la teoría del color HSL
 */
function generateColorVariants(baseHex: string): ColorVariant {
  const base = baseHex.replace('#', '');
  const r = parseInt(base.substring(0, 2), 16) / 255;
  const g = parseInt(base.substring(2, 4), 16) / 255;
  const b = parseInt(base.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hslToRgb = (hh: number, ss: number, ll: number): string => {
    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh * 6) % 2) - 1));
    const m = ll - c / 2;
    let rr = 0,
      gg = 0,
      bb = 0;

    if (hh < 1 / 6) {
      rr = c;
      gg = x;
    } else if (hh < 2 / 6) {
      rr = x;
      gg = c;
    } else if (hh < 3 / 6) {
      gg = c;
      bb = x;
    } else if (hh < 4 / 6) {
      gg = x;
      bb = c;
    } else if (hh < 5 / 6) {
      rr = x;
      bb = c;
    } else {
      rr = c;
      bb = x;
    }

    const toHex = (val: number) => {
      const hex = Math.round((val + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
  };

  return {
    50: hslToRgb(h, s, 0.97),
    100: hslToRgb(h, s, 0.93),
    200: hslToRgb(h, s, 0.86),
    300: hslToRgb(h, s, 0.76),
    400: hslToRgb(h, s, 0.66),
    500: baseHex,
    600: hslToRgb(h, s, 0.46),
    700: hslToRgb(h, s, 0.36),
    800: hslToRgb(h, s, 0.26),
    900: hslToRgb(h, s, 0.16),
  };
}

/**
 * Paleta de colores base
 */
export const colors = {
  primary: generateColorVariants('#CC2627'),
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  semantic: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
};

/**
 * Tipografía Poppins
 */
export const typography = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Espaciamiento (escala 8px)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/**
 * Radio de bordes
 */
export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

/**
 * Sombras (iOS y Android)
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#CC2627',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

/**
 * Glassmorphism tokens
 */
export const glass = {
  light: 'rgba(255, 255, 255, 0.82)',
  dark: 'rgba(20, 20, 20, 0.88)',
  border: 'rgba(255, 255, 255, 0.18)',
  borderDark: 'rgba(255, 255, 255, 0.08)',
  blur: 20,
} as const;

/**
 * Gradientes para hero y fondos premium
 */
export const gradients = {
  heroOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)'] as const,
  primaryFade: ['#CC2627', 'rgba(204,38,39,0)'] as const,
  rankBadge: ['#CC2627', '#8B0000'] as const,
  darkHero: ['rgba(13,13,13,0)', 'rgba(13,13,13,0.92)'] as const,
  heroFallback: ['#1a0000', '#CC2627'] as const,
} as const;

/**
 * Colores nacionales para tarjetas de partido
 */
export interface NationalColor {
  primary: string;
  bg: string;
}

export const NATIONAL_COLORS: Record<string, NationalColor> = {
  ARG: { primary: '#74ACDF', bg: 'rgba(116,172,223,0.14)' },
  BRA: { primary: '#F4C430', bg: 'rgba(244,196,48,0.14)' },
  FRA: { primary: '#003189', bg: 'rgba(0,49,137,0.14)' },
  DEU: { primary: '#3B3B3B', bg: 'rgba(59,59,59,0.10)' },
  ESP: { primary: '#C60B1E', bg: 'rgba(198,11,30,0.12)' },
  ENG: { primary: '#CF142B', bg: 'rgba(207,20,43,0.12)' },
  POR: { primary: '#006600', bg: 'rgba(0,102,0,0.12)' },
  ITA: { primary: '#003399', bg: 'rgba(0,51,153,0.12)' },
  NED: { primary: '#FF6600', bg: 'rgba(255,102,0,0.12)' },
  URU: { primary: '#5AAEE2', bg: 'rgba(90,174,226,0.12)' },
  USA: { primary: '#3C3B6E', bg: 'rgba(60,59,110,0.12)' },
  QAT: { primary: '#8D1B3D', bg: 'rgba(141,27,61,0.12)' },
  ECU: { primary: '#FFD100', bg: 'rgba(255,209,0,0.12)' },
  SEN: { primary: '#00853F', bg: 'rgba(0,133,63,0.12)' },
  GAL: { primary: '#C8102E', bg: 'rgba(200,16,46,0.12)' },
  DEFAULT: { primary: '#5C5C5C', bg: 'rgba(92,92,92,0.10)' },
};

export const FLAG_EMOJIS: Record<string, string> = {
  ARG: '🇦🇷', BRA: '🇧🇷', FRA: '🇫🇷', DEU: '🇩🇪',
  ESP: '🇪🇸', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POR: '🇵🇹', ITA: '🇮🇹',
  NED: '🇳🇱', URU: '🇺🇾', USA: '🇺🇸', QAT: '🇶🇦',
  ECU: '🇪🇨', SEN: '🇸🇳', GAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', DEFAULT: '🏳️',
};

/**
 * Helper: resolver color nacional por código ISO
 */
export function getNationalColor(teamCode: string): NationalColor {
  return NATIONAL_COLORS[teamCode?.toUpperCase()] ?? NATIONAL_COLORS.DEFAULT;
}

/**
 * Helper: resolver emoji de bandera por código ISO
 */
export function getFlagEmoji(teamCode: string): string {
  return FLAG_EMOJIS[teamCode?.toUpperCase()] ?? FLAG_EMOJIS.DEFAULT;
}

/**
 * Helper: calcular saludo según hora del día
 */
export function getGreeting(hour?: number): string {
  const h = hour ?? new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Tema Claro
 */
export const lightTheme = {
  name: 'light' as const,
  isDark: false,
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    text: colors.neutral[900],
    textSecondary: colors.neutral[700],
    textTertiary: colors.neutral[600],
    muted: colors.neutral[500],
    primary: colors.primary[600],
    primaryLight: colors.primary[50],
    border: colors.neutral[200],
    divider: colors.neutral[100],
    placeholder: colors.neutral[400],
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    info: colors.semantic.info,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

/**
 * Tema Oscuro
 */
export const darkTheme = {
  name: 'dark' as const,
  isDark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceAlt: '#262626',
    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    muted: colors.neutral[500],
    primary: colors.primary[400],
    primaryLight: colors.primary[900],
    border: colors.neutral[800],
    divider: colors.neutral[900],
    placeholder: colors.neutral[600],
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    info: colors.semantic.info,
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

/**
 * Tipos de tema
 */
export type AppColorScheme = 'light' | 'dark';
export type AppTheme = typeof lightTheme | typeof darkTheme;

/**
 * Función para crear tema
 */
export const createTheme = (scheme: AppColorScheme): AppTheme => {
  return scheme === 'dark' ? darkTheme : lightTheme;
};

/**
 * Exportar tipos completos
 */
export type ThemeColors = AppTheme['colors'];
export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeShadows = typeof shadows;
export type ThemeTypography = typeof typography;
