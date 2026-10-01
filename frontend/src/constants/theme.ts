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
  background: '#F3F6F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EAEFEE',
  surfaceSunken: '#E2E9E7',
  border: '#DDE4E2',
  borderStrong: '#C3CFCB',
  text: '#12212A',
  textSecondary: '#566865',
  textTertiary: '#8A9A97',
  primary: '#1E6B70',
  primaryPressed: '#17565A',
  primarySoft: '#DCEBE9',
  onPrimary: '#FFFFFF',
  star: '#E0A22B',
  starMuted: '#D3DEDB',
  danger: '#C04444',
  dangerSoft: '#F7E4E3',
  onDanger: '#FFFFFF',
  success: '#2E7D5B',
  overlay: 'rgba(10, 22, 24, 0.45)',
  scrim: 'rgba(10, 22, 24, 0.06)',
  tabBar: '#FFFFFF',
  shadow: '#0A2024',
};

export const darkPalette: Palette = {
  background: '#0D1518',
  surface: '#162024',
  surfaceMuted: '#1D282C',
  surfaceSunken: '#111A1D',
  border: '#27343A',
  borderStrong: '#3A4A51',
  text: '#EFF4F3',
  textSecondary: '#A5B4B2',
  textTertiary: '#75858A',
  primary: '#48A6AB',
  primaryPressed: '#5FB9BE',
  primarySoft: '#1B3A3D',
  onPrimary: '#04211F',
  star: '#F0BC50',
  starMuted: '#37474B',
  danger: '#E2736E',
  dangerSoft: '#3A1F1F',
  onDanger: '#2A0E0D',
  success: '#5CC08F',
  overlay: 'rgba(2, 8, 10, 0.6)',
  scrim: 'rgba(2, 8, 10, 0.25)',
  tabBar: '#131C20',
  shadow: '#000000',
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
  lg: 16,
  chip: 20,
  pill: 999,
} as const;

/** Card / input container radius, per the design spec. */
export const CardRadius = Radius.md;
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
