import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Single source of truth for the product's visual language. Screens and
 * components must never hardcode hex values — read them from the palette so
 * light and dark stay in sync.
 */

export type Palette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  star: string;
  starMuted: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  success: string;
  overlay: string;
  scrim: string;
  tabBar: string;
  shadow: string;
};

export const lightPalette: Palette = {
  background: '#F7F9FF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F4FF',
  surfaceSunken: '#EEF2FF',
  border: '#DDE4F0',
  borderStrong: '#C9D6EC',
  text: '#17213D',
  textSecondary: '#68748D',
  textTertiary: '#8F9CB3',
  primary: '#2F66E8',
  primaryPressed: '#275BCE',
  primarySoft: '#EAF0FF',
  onPrimary: '#FFFFFF',
  star: '#F5B82E',
  starMuted: '#F1F4FF',
  danger: '#C04444',
  dangerSoft: '#F7E4E3',
  onDanger: '#FFFFFF',
  success: '#2E7D5B',
  overlay: 'rgba(23, 33, 61, 0.45)',
  scrim: 'rgba(23, 33, 61, 0.06)',
  tabBar: '#FFFFFF',
  shadow: '#17213D',
};

export const darkPalette: Palette = {
  background: '#0B1736',
  surface: '#12234A',
  surfaceMuted: '#1A2E5A',
  surfaceSunken: '#0F1D3D',
  border: '#294477',
  borderStrong: '#3E5D94',
  text: '#F4F7FF',
  textSecondary: '#B9C7E5',
  textTertiary: '#8194BC',
  primary: '#6D9BFF',
  primaryPressed: '#8AAFFF',
  primarySoft: '#1D3A75',
  onPrimary: '#071735',
  star: '#FFB000',
  starMuted: '#6379A6',
  danger: '#FF8585',
  dangerSoft: '#542A40',
  onDanger: '#2A1020',
  success: '#63D39A',
  overlay: 'rgba(3, 12, 35, 0.72)',
  scrim: 'rgba(3, 12, 35, 0.35)',
  tabBar: '#101F43',
  shadow: '#020817',
};

export const Spacing = {
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Every screen uses this horizontal gutter. */
export const ScreenPadding = Spacing.lg;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  chip: 20,
  pill: 999,
} as const;

/** Card / input container radius, per the design spec. */
export const CardRadius = Radius.lg;
export const ChipRadius = Radius.chip;

const shadow = (color: string, opacity: number, radius: number, offset: number): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: 2 },
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offset },
    },
  }) ?? { elevation: 2 };

export const makeShadows = (palette: Palette) => ({
  card: shadow(palette.shadow, 0.1, 10, 3),
  raised: shadow(palette.shadow, 0.16, 18, 6),
  bar: shadow(palette.shadow, 0.08, 6, 2),
});

export const Typography: Record<
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'overline'
  | 'numeric',
  TextStyle
> = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '700' },
  subheading: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  overline: { fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 0.8 },
  numeric: { fontSize: 15, lineHeight: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
};

export const Layout = {
  tabBarHeight: Platform.select({ ios: 52, android: 62, default: 58 }),
  fabSize: 56,
  fabOffset: Spacing.lg,
  headerHeight: 56,
  minTouchTarget: 44,
} as const;

export function getPalette(scheme: 'light' | 'dark' | 'unspecified' | null | undefined): Palette {
  return scheme === 'dark' ? darkPalette : lightPalette;
}
