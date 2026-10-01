import { getPalette, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeMode = 'light' | 'dark';

let themeOverride: ThemeMode | null = null;

export function setThemeOverride(mode: ThemeMode | null): void {
  themeOverride = mode;
}

/** Returns the active design tokens. Light and dark palettes are identical in shape. */
export function useTheme(): Palette {
  const systemScheme = useColorScheme();
  return getPalette(themeOverride ?? systemScheme ?? 'light');
}
