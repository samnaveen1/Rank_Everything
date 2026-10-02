import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Label } from '@/components/ui/kit';
import { Layout, Radius, Spacing, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_META = {
  index: { label: 'My Top 10', icon: 'trophy-outline' as const, activeIcon: 'trophy' as const },
  discover: { label: 'Discover', icon: 'compass-outline' as const, activeIcon: 'compass' as const },
  profile: { label: 'Profile', icon: 'account-outline' as const, activeIcon: 'account' as const },
};

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: { navigate: (name: string) => void };
};

function GlassTabBar({ state, navigation }: TabBarProps) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const shadows = makeShadows(palette);

  return (
    <View pointerEvents="box-none" style={[styles.barLayer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <View style={[styles.bar, { backgroundColor: `${palette.tabBar}F2`, borderColor: palette.border }, shadows.raised]}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name as keyof typeof TAB_META];
          if (!meta) return null;
          const selected = state.index === index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected }}
              onPress={() => navigation.navigate(route.name)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
              <View style={[styles.activePill, selected && { backgroundColor: palette.primarySoft }]}>
                <MaterialCommunityIcons
                  name={selected ? meta.activeIcon : meta.icon}
                  size={20}
                  color={selected ? palette.primary : palette.textTertiary}
                />
                <Label
                  variant="captionStrong"
                  tone={selected ? 'primary' : 'tertiary'}
                  style={styles.tabLabel}>
                  {meta.label}
                </Label>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  barLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
  },
  bar: {
    minHeight: Layout.tabBarHeight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    padding: Spacing.xs,
  },
  tab: { flex: 1, minHeight: 52 },
  activePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 2,
  },
  tabLabel: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.72 },
});
