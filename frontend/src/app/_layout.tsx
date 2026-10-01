import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { BrandSplashOverlay } from '@/components/brand-splash';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const palette = useTheme();
  const { handle, ready } = useSession();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: palette.background === '#0D1518',
      colors: {
        ...DefaultTheme.colors,
        primary: palette.primary,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        notification: palette.danger,
      },
    }),
    [palette],
  );

  if (!ready) {
    return (
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        <BrandSplashOverlay />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}>
        {handle ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="login" />}
        <Stack.Screen name="entry" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <BrandSplashOverlay />
    </ThemeProvider>
  );
}
