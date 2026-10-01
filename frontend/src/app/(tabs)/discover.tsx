import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Chip, EmptyState, ErrorState, Label, Poster, SkeletonList } from '@/components/ui/kit';
import { ScreenHeader, SegmentedTabs } from '@/components/ui/ScreenHeader';
import { Radius, Spacing, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  commentOnActivity,
  likeActivity,
  loadFeed,
  loadLeaderboard,
  shareActivity,
} from '@/services/api';
import { ActivityItem, ActivityKind, LeaderboardEntry } from '@/types/community';
import { formatRelativeTime } from '@/utils/format';

type TabKey = 'Leaderboard' | 'Activity';

const LEADERBOARD_TABS: readonly TabKey[] = ['Leaderboard', 'Activity'];

const FEED_FILTERS: { key: ActivityKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All activity' },
  { key: 'ranked', label: 'New rankings' },
  { key: 'updated', label: 'Edits' },
  { key: 'commented', label: 'Comments' },
];

const KIND_VERB: Record<ActivityKind, string> = {
  ranked: 'ranked',
  updated: 'updated their entry for',
  commented: 'commented on',
};

const TREND_ICON = { up: 'arrow-top-right', down: 'arrow-bottom-right', steady: 'minus' } as const;

/** Podium colours keyed by 1-based rank. */
const MEDAL = {
  1: { bg: 'rgba(224,162,43,0.16)', border: 'rgba(224,162,43,0.45)', text: '#B57F14' },
  2: { bg: 'rgba(150,160,165,0.16)', border: 'rgba(150,160,165,0.42)', text: '#6E7A80' },
  3: { bg: 'rgba(184,120,70,0.16)', border: 'rgba(184,120,70,0.42)', text: '#96552F' },
} as const;

export default function DiscoverScreen() {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const [tab, setTab] = useState<TabKey>('Leaderboard');
  const [filter, setFilter] = useState<ActivityKind | 'all'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (intent: 'focus' | 'manual') => {
    setLoading(intent === 'focus');
    setError('');

    try {
      const [board, activity] = await Promise.all([
        loadLeaderboard({ limit: 25 }),
        loadFeed({ limit: 30 }),
      ]);
      setLeaderboard(board);
      setFeed(activity.items);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to reach the community API.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('focus');
    }, [load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load('manual');
  }, [load]);

  const patchActivity = useCallback((id: string, patch: Partial<ActivityItem>) => {
    setFeed((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const onLike = useCallback(
    async (item: ActivityItem) => {
      try {
        const result = await likeActivity(item.id);
        patchActivity(item.id, result);
      } catch (likeError) {
        console.error(likeError);
      }
    },
    [patchActivity],
  );

  const onShare = useCallback(
    async (item: ActivityItem) => {
      try {
        const result = await shareActivity(item.id);
        patchActivity(item.id, { shareCount: result.shareCount });
      } catch (shareError) {
        console.error(shareError);
      }
    },
    [patchActivity],
  );

  const onComment = useCallback(
    async (item: ActivityItem) => {
      try {
        patchActivity(item.id, await commentOnActivity(item.id, 'Great pick.'));
      } catch (commentError) {
        console.error(commentError);
      }
    },
    [patchActivity],
  );

  const visibleFeed = useMemo(
    () => (filter === 'all' ? feed : feed.filter((item) => item.kind === filter)),
    [feed, filter],
  );

  const leader = leaderboard[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScreenHeader
        title="Discover"
        subtitle="Community consensus and activity"
        right={
          <Pressable
            accessibilityLabel="Refresh community data"
            onPress={refresh}
            hitSlop={8}
            style={[
              styles.refresh,
              { backgroundColor: palette.surface, borderColor: palette.border },
              shadows.card,
            ]}>
            <MaterialCommunityIcons name="refresh" size={18} color={palette.primary} />
          </Pressable>
        }
      />

      <View style={styles.segmentWrap}>
        <SegmentedTabs options={LEADERBOARD_TABS} selected={tab} onSelect={(next) => setTab(next as TabKey)} />
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonList rows={5} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : tab === 'Leaderboard' ? (
        <FlatList
          data={leaderboard}
          keyExtractor={(entry) => entry.rankingId}
          contentContainerStyle={[styles.list, leaderboard.length === 0 && styles.listEmpty]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />
          }
          ListHeaderComponent={
            leader ? (
              /* Gradient champion card so the #1 pick leads the screen. */
              <LinearGradient
                colors={[palette.primary, palette.primaryPressed]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.podium}>
                <View style={styles.podiumRow}>
                  <View style={styles.championAvatarRing}>
                    <Avatar name={leader.author.name} uri={leader.author.avatarUrl} size={46} showRing />
                  </View>
                  <View style={styles.flex}>
                    <Label variant="overline" style={styles.podiumEyebrow}>
                      #1 COMMUNITY PICK
                    </Label>
                    <Label variant="title" numberOfLines={1} style={{ color: palette.onPrimary }}>
                      {leader.title}
                    </Label>
                  </View>
                  <MaterialCommunityIcons name="crown" size={24} color={palette.star} />
                </View>

                <View style={styles.podiumMeta}>
                  <View style={styles.podiumScore}>
                    <MaterialCommunityIcons name="star" size={15} color={palette.star} />
                    <Label variant="bodyStrong" style={{ color: palette.onPrimary }}>
                      {leader.consensusRating.toFixed(1)}
                    </Label>
                  </View>
                  <Label variant="caption" style={styles.podiumCaption} numberOfLines={1}>
                    {leader.ratingCount} ratings · by @{leader.author.handle}
                  </Label>
                </View>
              </LinearGradient>
            ) : null
          }
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="podium-gold"
              title="The leaderboard is empty"
              message="Once people start ranking, the highest consensus scores land here."
            />
          }
        />
      ) : (
        <View style={styles.flex}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {FEED_FILTERS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={filter === option.key}
                onPress={() => setFilter(option.key)}
              />
            ))}
          </ScrollView>

          <FlatList
            data={visibleFeed}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, visibleFeed.length === 0 && styles.listEmpty]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />
            }
            renderItem={({ item }) => (
              <ActivityCard item={item} onLike={onLike} onShare={onShare} onComment={onComment} />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="bell-outline"
                title="No activity yet"
                message={
                  filter === 'all'
                    ? 'New rankings, edits, and comments show up here.'
                    : 'Try a different activity filter.'
                }
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);
  const trendTone = entry.trend === 'up' ? palette.success : entry.trend === 'down' ? palette.danger : palette.textTertiary;
  // Gold/silver/bronze tint for the podium, flat for everyone else.
  const medal =
    entry.globalRank === 1 || entry.globalRank === 2 || entry.globalRank === 3
      ? MEDAL[entry.globalRank]
      : undefined;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: medal?.border ?? palette.border,
        },
        medal ? shadows.raised : shadows.card,
      ]}>
      <View
        style={[
          styles.rankSlot,
          { backgroundColor: medal?.bg ?? palette.surfaceMuted },
        ]}>
        <Label
          variant="heading"
          style={medal ? { color: medal.text } : undefined}
          tone={medal ? 'default' : 'tertiary'}>
          {entry.globalRank}
        </Label>
      </View>

      {entry.posterUrl ? (
        <Poster uri={entry.posterUrl} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: palette.surfaceMuted }]}>
          <MaterialCommunityIcons name="image-off-outline" size={16} color={palette.textTertiary} />
        </View>
      )}

      <View style={styles.flex}>
        <Label variant="bodyStrong" numberOfLines={1}>
          {entry.title}
        </Label>
        <Label variant="caption" tone="tertiary" numberOfLines={1}>
          {entry.category} · @{entry.author.handle} · {entry.ratingCount} ratings
        </Label>
      </View>

      <View style={styles.rowScore}>
        <MaterialCommunityIcons name="star" size={13} color={palette.star} />
        <Label variant="bodyStrong" numberOfLines={1}>
          {entry.consensusRating.toFixed(1)}
        </Label>
        <MaterialCommunityIcons name={TREND_ICON[entry.trend]} size={13} color={trendTone} />
      </View>
    </View>
  );
}

function ActivityCard({
  item,
  onLike,
  onShare,
  onComment,
}: {
  item: ActivityItem;
  onLike: (item: ActivityItem) => void;
  onShare: (item: ActivityItem) => void;
  onComment: (item: ActivityItem) => void;
}) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        shadows.card,
      ]}>
      <View style={styles.cardHeader}>
        <Avatar name={item.actor.name} size={36} />
        <View style={styles.flex}>
          <Label variant="bodyStrong" numberOfLines={1}>
            {item.actor.name}
          </Label>
          <Label variant="caption" tone="tertiary" numberOfLines={1}>
            {KIND_VERB[item.kind]} {item.target?.title ?? 'something'} ·{' '}
            {formatRelativeTime(item.createdAt)}
          </Label>
        </View>
      </View>

      {item.target ? (
        <View style={[styles.target, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
          {item.target.posterUrl ? (
            <Poster uri={item.target.posterUrl} style={styles.targetPoster} />
          ) : null}
          <View style={styles.flex}>
            <Label variant="bodyStrong" numberOfLines={1}>
              {item.target.title}
            </Label>
            <Label variant="caption" tone="tertiary" numberOfLines={1}>
              {item.target.category}
              {item.target.rating !== null ? ` · your score ${item.target.rating.toFixed(1)}` : ''}
            </Label>
          </View>
        </View>
      ) : null}

      {item.comments.length > 0 ? (
        <Label variant="caption" tone="secondary" numberOfLines={2}>
          “{item.comments[item.comments.length - 1].body}”
        </Label>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={item.likedByMe ? 'Unlike' : 'Like'}
          onPress={() => onLike(item)}
          hitSlop={6}
          style={styles.action}>
          <MaterialCommunityIcons
            name={item.likedByMe ? 'heart' : 'heart-outline'}
            size={17}
            color={item.likedByMe ? palette.danger : palette.textTertiary}
          />
          <Label variant="caption" tone={item.likedByMe ? 'danger' : 'tertiary'}>
            {item.likeCount}
          </Label>
        </Pressable>

        <Pressable accessibilityLabel="Comment" onPress={() => onComment(item)} hitSlop={6} style={styles.action}>
          <MaterialCommunityIcons name="comment-outline" size={17} color={palette.textTertiary} />
          <Label variant="caption" tone="tertiary">
            {item.commentCount}
          </Label>
        </Pressable>

        <Pressable accessibilityLabel="Share" onPress={() => onShare(item)} hitSlop={6} style={styles.action}>
          <MaterialCommunityIcons name="share-variant-outline" size={17} color={palette.textTertiary} />
          <Label variant="caption" tone="tertiary">
            {item.shareCount}
          </Label>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  skeletonWrap: { paddingTop: Spacing.md },
  segmentWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  listEmpty: { flexGrow: 1 },
  separator: { height: Spacing.md },
  refresh: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  podium: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  championAvatarRing: {
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 2,
  },
  podiumEyebrow: { color: '#FFFFFF', opacity: 0.82 },
  podiumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  podiumScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  podiumCaption: { color: '#FFFFFF', opacity: 0.85, flex: 1 },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  rankSlot: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  targetPoster: { width: 36, height: 48, borderRadius: Radius.sm },
  actions: { flexDirection: 'row', gap: Spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
