import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const palette = useTheme();

  return (
    <NativeTabs
      backgroundColor={palette.tabBar}
      tintColor={palette.primary}
      iconColor={{ default: palette.textTertiary, selected: palette.primary }}
      indicatorColor={palette.primarySoft}
      labelStyle={{
        default: { fontSize: 11, fontWeight: '600' },
        selected: { fontSize: 11, fontWeight: '700' },
      }}
      shadowColor={palette.shadow}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>My Top 10</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'trophy', selected: 'trophy.fill' }}
          md={{ default: 'emoji_events', selected: 'emoji_events' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md={{ default: 'leaderboard', selected: 'leaderboard' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md={{ default: 'person', selected: 'person' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
