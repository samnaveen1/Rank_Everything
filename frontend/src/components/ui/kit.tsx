import { ComponentProps, ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated } from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  type ImageStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

import { CardRadius, Layout, Palette, Radius, Spacing, Typography, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Spreads into a StyleSheet entry to pin an element to its parent. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/* Text -------------------------------------------------------------------- */

type LabelProps = {
  children: ReactNode;
  variant?: keyof typeof Typography;
  tone?: 'default' | 'secondary' | 'tertiary' | 'primary' | 'danger' | 'inverse' | 'star';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Label({
  children,
  variant = 'body',
  tone = 'default',
  style,
  numberOfLines,
}: LabelProps) {
  const palette = useTheme();
  const color = labelTone(palette, tone);

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[Typography[variant] as TextStyle, { color }, style]}>
      {children}
    </Text>
  );
}

const labelTone = (palette: Palette, tone: LabelProps['tone']): string => {
  switch (tone) {
    case 'secondary':
      return palette.textSecondary;
    case 'tertiary':
      return palette.textTertiary;
    case 'primary':
      return palette.primary;
    case 'danger':
      return palette.danger;
    case 'inverse':
      return palette.onPrimary;
    case 'star':
      return palette.star;
    default:
      return palette.text;
  }
};

/* IconButton -------------------------------------------------------------- */

type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  name: IconName;
  label: string;
  size?: number;
  tone?: 'default' | 'primary' | 'danger' | 'inverse';
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  label,
  size = 20,
  tone = 'default',
  filled = false,
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const foreground = {
    default: palette.text,
    primary: palette.primary,
    danger: palette.danger,
    inverse: palette.onPrimary,
  }[tone];

  const background = filled
    ? {
        default: palette.surfaceMuted,
        primary: palette.primary,
        danger: palette.danger,
        inverse: palette.primary,
      }[tone]
    : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        filled && shadows.bar,
        style,
      ]}
      {...rest}>
      <MaterialCommunityIcons name={name} size={size} color={foreground} />
    </Pressable>
  );
}

/* Button ------------------------------------------------------------------ */

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = true,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const surface = {
    primary: palette.primary,
    secondary: palette.surface,
    ghost: 'transparent',
    danger: palette.danger,
  }[variant];

  const foreground = {
    primary: palette.onPrimary,
    secondary: palette.text,
    ghost: palette.primary,
    danger: palette.onDanger,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: surface,
          borderColor: variant === 'secondary' ? palette.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant === 'primary' && shadows.bar,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={18} color={foreground} /> : null}
          <Text style={[Typography.subheading, { color: foreground }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/* Card -------------------------------------------------------------------- */

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Card({ children, style, padded = true, onPress, accessibilityLabel }: CardProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        shadows.card,
        padded && styles.cardPadded,
        style,
      ]}>
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      {content}
    </Pressable>
  );
}

/* Chip -------------------------------------------------------------------- */

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected = false, onPress, count, style }: ChipProps) {
  const palette = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.primary : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}>
      <Text
        numberOfLines={1}
        style={[
          Typography.caption,
          { color: selected ? palette.onPrimary : palette.textSecondary, fontWeight: '600' },
        ]}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          style={[
            Typography.caption,
            { color: selected ? palette.onPrimary : palette.textTertiary, opacity: 0.8 },
          ]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* Tag --------------------------------------------------------------------- */

export function Tag({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const palette = useTheme();

  return (
    <View style={[styles.tag, { backgroundColor: palette.surfaceMuted }, style]}>
      <Text style={[Typography.caption, { color: palette.textSecondary, fontSize: 12 }]}>{label}</Text>
    </View>
  );
}

export function CategoryTag({ label }: { label: string }) {
  const palette = useTheme();

  return (
    <View style={[styles.tag, { backgroundColor: palette.primarySoft }]}>
      <Text style={[Typography.overline, { color: palette.primary, fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

/* RatingBadge ------------------------------------------------------------- */

export function RatingBadge({
  rating,
  size = 'medium',
}: {
  rating: number;
  size?: 'small' | 'medium';
}) {
  const palette = useTheme();
  const compact = size === 'small';

  return (
    <View
      accessibilityLabel={`Rated ${rating} out of 10`}
      style={[
        styles.ratingBadge,
        compact && { paddingHorizontal: 8, paddingVertical: 4 },
        { backgroundColor: palette.surfaceSunken },
      ]}>
      <Text
        style={[
          compact ? { fontSize: 12, lineHeight: 16 } : { fontSize: 14, lineHeight: 18 },
          { color: palette.text, fontWeight: '800', fontVariant: ['tabular-nums'] },
        ]}>
        {rating.toFixed(1)}
      </Text>
      <MaterialCommunityIcons name="star" size={compact ? 11 : 13} color={palette.star} />
    </View>
  );
}

/* RankBadge --------------------------------------------------------------- */

const rankAccent = (palette: Palette, rank: number): string => {
  if (rank === 1) return palette.star;
  if (rank === 2) return '#9AA7B2';
  if (rank === 3) return '#B07C4F';
  return palette.textTertiary;
};

export function RankBadge({ rank, label }: { rank: number; label?: string }) {
  const palette = useTheme();
  const accent = rankAccent(palette, rank);

  return (
    <View style={[styles.rankBadge, { borderColor: accent, backgroundColor: `${accent}1A` }]}>
      <Text style={[styles.rankBadgeText, { color: accent }]}>{label ?? `#${rank}`}</Text>
    </View>
  );
}

/* Avatar ------------------------------------------------------------------ */

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
  showRing?: boolean;
};

export function Avatar({ name, uri, size = 36, showRing = false }: AvatarProps) {
  const palette = useTheme();
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View
      accessibilityLabel={`${name} avatar`}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.surfaceSunken,
          borderWidth: showRing ? 2 : 0,
          borderColor: palette.surface,
        },
      ]}>
      {uri ? (
        <Poster uri={uri} style={FILL} />
      ) : (
        <Text style={{ color: palette.primary, fontWeight: '800', fontSize: size * 0.38 }}>{letters}</Text>
      )}
    </View>
  );
}

/* Poster ------------------------------------------------------------------ */

type PosterProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  width?: number;
  height?: number;
};

export function Poster({ uri, style, width, height }: PosterProps) {
  const palette = useTheme();

  if (!uri) {
    return (
      <View
        style={[
          styles.posterFallback,
          { backgroundColor: palette.primarySoft, width, height },
          style,
        ]}>
        <MaterialCommunityIcons name="star-four-points-outline" size={22} color={palette.primary} />
      </View>
    );
  }

  return (
    <ExpoImage
      source={{ uri }}
      style={[{ backgroundColor: palette.surfaceSunken, width, height }, style]}
      contentFit="cover"
      transition={160}
    />
  );
}

/* ProgressBar ------------------------------------------------------------- */

export function ProgressBar({
  percent,
  color,
  height = 8,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  const palette = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={[styles.progressTrack, { backgroundColor: palette.surfaceSunken, height }]}>
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? palette.primary,
        }}
      />
    </View>
  );
}

/* FAB --------------------------------------------------------------------- */

type FabProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  icon?: IconName;
  extended?: boolean;
  bottomInset: number;
  style?: StyleProp<ViewStyle>;
};

export function Fab({
  label,
  icon = 'plus',
  extended = true,
  bottomInset,
  style,
  ...rest
}: FabProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        extended && styles.fabExtended,
        { backgroundColor: palette.primary, bottom: bottomInset, opacity: pressed ? 0.85 : 1 },
        shadows.raised,
        style,
      ]}
      {...rest}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.onPrimary} />
      {extended ? <Text style={[Typography.subheading, { color: palette.onPrimary }]}>{label}</Text> : null}
    </Pressable>
  );
}

/* EmptyState -------------------------------------------------------------- */

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const palette = useTheme();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: palette.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={28} color={palette.primary} />
      </View>
      <Label variant="heading" style={styles.emptyTitle}>
        {title}
      </Label>
      <Label variant="caption" tone="secondary" style={styles.emptyMessage}>
        {message}
      </Label>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

/* States ------------------------------------------------------------------ */

/**
 * Pulsing placeholder block. `SkeletonList` composes these so every screen
 * shows the same loading treatment instead of a lone spinner.
 */
export function Skeleton({ height, width = '100%', style }: { height: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const palette = useTheme();
  // Animated.Value is a stable object, so useState (not a ref) avoids touching
  // `current` during render, which the React Compiler rejects.
  const [pulse] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius: Radius.sm,
          backgroundColor: palette.surfaceMuted,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** Row-shaped skeleton approximating `ItemCard`, used while lists load. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  const palette = useTheme();

  return (
    <View style={skeletonStyles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading content">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[
            skeletonStyles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}>
          <Skeleton height={72} width={52} />
          <View style={skeletonStyles.lines}>
            <Skeleton height={14} width="72%" />
            <Skeleton height={11} width="45%" />
            <Skeleton height={11} width="60%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  lines: { flex: 1, gap: Spacing.sm, justifyContent: 'center' },
});

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const palette = useTheme();

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={palette.primary} />
      <Label variant="caption" tone="secondary" style={{ marginTop: Spacing.md }}>
        {label}
      </Label>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Something went wrong"
      message={message}
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}

/* Screen scaffolding ------------------------------------------------------ */

export function SectionHeader({
  title,
  trailing,
  style,
}: {
  title: string;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Label variant="heading" style={styles.sectionTitle}>
        {title}
      </Label>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: 48,
    borderRadius: CardRadius,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  card: {
    borderRadius: CardRadius,
    borderWidth: 1,
  },
  cardPadded: {
    padding: Spacing.lg,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  rankBadge: {
    minWidth: 38,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    minWidth: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  fabExtended: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: Spacing.lg },
  emptyMessage: { marginTop: Spacing.sm, textAlign: 'center', maxWidth: 300 },
  emptyAction: { marginTop: Spacing.xl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionTitle: { flexShrink: 1 },
});
