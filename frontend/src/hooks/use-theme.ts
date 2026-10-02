import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyncExternalStore } from 'react';

import { getPalette, Palette } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark';

let themeOverride: ThemeMode | null = null;
const THEME_KEY = 'rankio:theme';
const listeners = new Set<() => void>();

void AsyncStorage.getItem(THEME_KEY).then((value) => {
  if (value === 'light' || value === 'dark') {
    themeOverride = value;
    listeners.forEach((listener) => listener());
  }
});

export function setThemeOverride(mode: ThemeMode | null): void {
  themeOverride = mode;
  if (mode) {
    void AsyncStorage.setItem(THEME_KEY, mode);
  } else {
    void AsyncStorage.removeItem(THEME_KEY);
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getOverride = (): ThemeMode | null => themeOverride;

export function useTheme(): Palette {
  const systemScheme = useColorScheme();
  const override = useSyncExternalStore(subscribe, getOverride, () => null);
  return getPalette(override ?? systemScheme ?? 'light');
}
