import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CardRadius, Spacing, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RankingItem } from '@/types/item';
import { titleCase } from '@/utils/format';
import { Card, CategoryTag, IconButton, Label, Poster, RankBadge, RatingBadge, Tag } from './kit';

/** Spreads into a StyleSheet entry to pin an element to its parent. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

export type RankingCardAction = 'edit' | 'delete' | 'ratings';

type ItemCardProps = {
  item: RankingItem;
  rank: number;
  onEdit?: (item: RankingItem) => void;
  onDelete?: (item: RankingItem) => void;
  onOpenRatings?: (item: RankingItem) => void;
  /** Leaderboard rows show a global badge instead of the personal position. */
  rankLabel?: string;
  badgeTone?: 'personal' | 'global';
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ItemCard({
  item,
  rank,
  onEdit,
  onDelete,
  onOpenRatings,
  rankLabel,
  badgeTone = 'personal',
  footer,
  style,
}: ItemCardProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);
  const posterUri = item.posterUrls[0] ?? null;
  const isGlobal = badgeTone === 'global';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        shadows.card,
        style,
      ]}>
      <View style={styles.top}>
        <View style={styles.leading}>
          <View style={styles.rankSlot}>
            <RankBadge rank={rank} label={rankLabel} />
          </View>
          <Poster uri={posterUri} style={styles.poster} width={64} height={88} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, rated ${item.rating} out of 10`}
          onPress={() => onOpenRatings?.(item)}
          style={styles.middle}>
          <Label variant="bodyStrong" numberOfLines={2}>
            {item.title}
          </Label>

          <View style={styles.metaRow}>
            <CategoryTag label={titleCase(item.category)} />
            {isGlobal ? (
              <View style={styles.globalTag}>
                <MaterialCommunityIcons name="earth" size={10} color={palette.textTertiary} />
                <Label variant="overline" tone="tertiary" style={styles.globalTagText}>
                  Global
                </Label>
              </View>
            ) : null}
          </View>

          {item.tags.length > 0 ? (
            <View style={styles.tags}>
              {item.tags.slice(0, 3).map((tag) => (
                <Tag key={tag} label={titleCase(tag)} />
              ))}
              {item.tags.length > 3 ? (
                <Tag label={`+${item.tags.length - 3}`} />
              ) : null}
            </View>
          ) : null}

          {item.description ? (
            <Label variant="caption" tone="secondary" numberOfLines={2} style={styles.description}>
              {item.description}
            </Label>
          ) : null}
        </Pressable>

        <View style={styles.trailing}>
          <RatingBadge rating={item.rating} />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.actions}>
        {onOpenRatings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View rating breakdown for ${item.title}`}
            onPress={() => onOpenRatings(item)}
            style={styles.textAction}>
            <MaterialCommunityIcons name="chart-bar" size={15} color={palette.primary} />
            <Label variant="caption" tone="primary">
              {item.reviewCount > 0
                ? `${item.reviewCount} review${item.reviewCount === 1 ? '' : 's'}`
                : 'Breakdown'}
            </Label>
          </Pressable>
        ) : (
          <View />
        )}

        <View style={styles.iconActions}>
          {onEdit ? (
            <IconButton name="pencil-outline" label={`Edit ${item.title}`} size={17} onPress={() => onEdit(item)} />
          ) : null}
          {onDelete ? (
            <IconButton
              name="trash-can-outline"
              label={`Delete ${item.title}`}
              size={17}
              tone="danger"
              onPress={() => onDelete(item)}
            />
          ) : null}
        </View>
      </View>

      {footer}
    </View>
  );
}

type PaginationBarProps = {
  page: number;
  pageSize: number;
  total: number;
  loaded: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  loadingMore?: boolean;
  hasMore: boolean;
};

/**
 * Renders "Showing X - Y of Z items" plus page buttons with a See More escape
 * hatch, so the list is navigable without scrolling forever.
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  loaded,
  onPageChange,
  onLoadMore,
  loadingMore = false,
  hasMore,
}: PaginationBarProps) {
  const palette = useTheme();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    const window: number[] = [1];
    const from = Math.max(2, page - 1);
    const to = Math.min(pageCount - 1, page + 1);
    if (from > 2) window.push(-1);
    for (let index = from; index <= to; index += 1) window.push(index);
    if (to < pageCount - 1) window.push(-1);
    window.push(pageCount);
    return window;
  }, [page, pageCount]);

  if (total === 0) {
    return null;
  }

  return (
    <View style={styles.pagination}>
      <Label variant="caption" tone="tertiary">
        Showing {start} - {end} of {total} item{total === 1 ? '' : 's'}
      </Label>

      {loaded < total ? (
        <View style={styles.pageRow}>
          {pages.map((entry, index) =>
            entry === -1 ? (
              <Label key={`gap-${index}`} variant="caption" tone="tertiary" style={styles.pageGap}>
                …
              </Label>
            ) : (
              <Pressable
                key={entry}
                accessibilityRole="button"
                accessibilityLabel={`Go to page ${entry}`}
                accessibilityState={{ selected: entry === page }}
                onPress={() => onPageChange(entry)}
                style={[
                  styles.page,
                  entry === page
                    ? { backgroundColor: palette.primary }
                    : { backgroundColor: palette.surface, borderColor: palette.border },
                ]}>
                <Label
                  variant="caption"
                  tone={entry === page ? 'inverse' : 'secondary'}
                  style={entry === page ? styles.pageTextActive : undefined}>
                  {entry}
                </Label>
              </Pressable>
            ),
          )}
        </View>
      ) : null}

      {hasMore ? (
        <Pressable
          accessibilityRole="button"
          onPress={onLoadMore}
          disabled={loadingMore}
          style={({ pressed }) => [styles.seeMore, { borderColor: palette.border }, pressed && { opacity: 0.7 }]}>
          <Label variant="caption" tone="primary">
            {loadingMore ? 'Loading…' : 'See More'}
          </Label>
          <MaterialCommunityIcons name="chevron-down" size={16} color={palette.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.dialogBackdrop, { backgroundColor: palette.overlay }]}>
      <View
        style={[
          styles.dialog,
          { backgroundColor: palette.surface },
          shadows.raised,
        ]}>
        <Label variant="overline" tone="danger">
          {title}
        </Label>
        <Label variant="heading" style={styles.dialogTitle}>
          {title}
        </Label>
        <Label variant="body" tone="secondary" style={styles.dialogMessage}>
          {message}
        </Label>
        <View style={styles.dialogActions}>
          <View style={styles.dialogButton}>
            <Card
              padded={false}
              style={[
                styles.dialogButtonInner,
                { borderColor: palette.border },
              ]}
              onPress={onCancel}>
              <Label variant="subheading" tone="secondary">
                Keep it
              </Label>
            </Card>
          </View>
          <View style={styles.dialogButton}>
            <Card
              padded={false}
              style={[
                styles.dialogButtonInner,
                { backgroundColor: palette.danger, borderColor: palette.danger },
              ]}
              onPress={onConfirm}>
              <Label variant="subheading" tone="inverse">
                {busy ? 'Working…' : confirmLabel}
              </Label>
            </Card>
          </View>
        </View>
      </View>
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeightRatio?: number;
};

export function BottomSheet({ visible, onClose, title, subtitle, children, maxHeightRatio = 0.85 }: SheetProps) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.sheetBackdrop, { backgroundColor: palette.overlay }]}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: palette.background, maxHeight: `${maxHeightRatio * 100}%` },
          shadows.raised,
        ]}>
        <View style={styles.sheetGrabber}>
          <View style={[styles.grabber, { backgroundColor: palette.borderStrong }]} />
        </View>

        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderText}>
            <Label variant="title" numberOfLines={1}>
              {title}
            </Label>
            {subtitle ? (
              <Label variant="caption" tone="secondary" numberOfLines={1}>
                {subtitle}
              </Label>
            ) : null}
          </View>
          <IconButton name="close" label="Close" onPress={onClose} />
        </View>

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardRadius,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  leading: {
    gap: 6,
    alignItems: 'center',
  },
  rankSlot: {
    flexDirection: 'row',
  },
  poster: {
    borderRadius: 10,
  },
  middle: {
    flex: 1,
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  globalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  globalTagText: { fontSize: 9 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  description: { marginTop: 1 },
  trailing: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingRight: Spacing.sm,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pagination: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  page: {
    minWidth: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pageTextActive: { color: '#FFFFFF' },
  pageGap: { paddingHorizontal: 2 },
  seeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: CardRadius,
    borderWidth: 1,
  },
  dialogBackdrop: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: CardRadius + 4,
    padding: Spacing.xl,
  },
  dialogTitle: { marginTop: 4 },
  dialogMessage: { marginTop: Spacing.sm },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  dialogButton: { flex: 1 },
  dialogButtonInner: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sheetBackdrop: {
    ...FILL,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
  },
  sheetGrabber: { alignItems: 'center', paddingBottom: Spacing.sm },
  grabber: { width: 38, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sheetHeaderText: { flex: 1 },
  sheetContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
});
