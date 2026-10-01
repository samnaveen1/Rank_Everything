import { ReactNode, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Spacing, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { IconButton, Label } from './kit';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onPressSearch?: () => void;
  searchActive?: boolean;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  title,
  subtitle,
  onPressSearch,
  searchActive = false,
  right,
  style,
}: ScreenHeaderProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View style={[styles.header, style]}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: palette.primary }, shadows.bar]}>
          <MaterialCommunityIcons name="star-four-points" size={16} color={palette.onPrimary} />
        </View>
        <View style={styles.brandText}>
          <Label variant="title" numberOfLines={1}>
            {title}
          </Label>
          {subtitle ? (
            <Label variant="caption" tone="secondary" numberOfLines={1}>
              {subtitle}
            </Label>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {onPressSearch ? (
          <IconButton
            name="tune-variant"
            label="Search and filter"
            tone={searchActive ? 'primary' : 'default'}
            filled={searchActive}
            onPress={onPressSearch}
          />
        ) : null}
        {right}
      </View>
    </View>
  );
}

type SegmentedTabsProps = {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedTabs({ options, selected, onSelect, style }: SegmentedTabsProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.segmented,
        { backgroundColor: palette.surfaceMuted },
        style,
      ]}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option)}
            style={[
              styles.segment,
              active && { backgroundColor: palette.surface },
              active && shadows.card,
            ]}>
            <Label
              variant="caption"
              tone={active ? 'default' : 'secondary'}
              numberOfLines={1}>
              {option}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 1,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Spacing.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
});
