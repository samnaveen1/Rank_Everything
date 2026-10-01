import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
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

import { Avatar, EmptyState, ErrorState, Label, LoadingState, Poster } from '@/components/ui/kit';
import { RatingBreakdownSheet } from '@/components/ui/RatingBreakdownSheet';
import { ScreenHeader, SegmentedTabs } from '@/components/ui/ScreenHeader';
import { Radius, Spacing, makeShadows } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import {
    loadCurrentUser,
    loadUserRankings,
    loadUserStats,
    type ProfileRankingSummary,
} from '@/services/api';
import { logoutAccount } from '@/services/auth';
import { ProfileGroup, UserProfile, UserStats } from '@/types/user';
import { formatRating } from '@/utils/format';

const GROUP_TABS: readonly ProfileGroup[] = ['top', 'recent', 'category'];

const GROUP_LABEL: Record<ProfileGroup, string> = {
  top: 'Top',
  recent: 'Recent',
  category: 'Categories',
};

type Bucket = {
  category: string;
  items: ProfileRankingSummary[];
};

const bucketByCategory = (items: ProfileRankingSummary[]): Bucket[] => {
  const map = new Map<string, ProfileRankingSummary[]>();
  for (const item of items) {
    const key = item.category || 'Uncategorised';
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()]
    .map(([category, bucketItems]) => ({ category, items: bucketItems }))
    .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
};

export default function ProfileScreen() {
  const router = useRouter();
  const palette = useTheme();
  const session = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [group, setGroup] = useState<ProfileGroup>('top');
  const [items, setItems] = useState<ProfileRankingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [breakdownId, setBreakdownId] = useState<string | null>(null);

  const load = useCallback(
    async (intent: 'focus' | 'manual', selectedGroup: ProfileGroup) => {
      setLoading(intent === 'focus');
      setError('');

      try {
        const [user, userStats, rankings] = await Promise.all([
          loadCurrentUser(),
          loadUserStats('me'),
          loadUserRankings('me', selectedGroup),
        ]);
        setProfile(user);
        setStats(userStats);
        setItems(rankings);
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load your profile.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void load('focus', group);
    }, [group, load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load('manual', group);
  }, [group, load]);

  const buckets = useMemo(() => bucketByCategory(items), [items]);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      await session.signOut();
      router.replace('/login');
    }
  }, [router, session]);

  const displayName = profile?.name?.trim() || session.handle || 'Your profile';
  const displayHandle = profile?.handle || session.handle || 'guest';

  const header = (
    <>
      {/* Gradient hero so the profile reads as a distinct identity card. */}
      <LinearGradient
        colors={[palette.primary, palette.primaryPressed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroAvatarRing}>
            <Avatar
              name={displayName}
              uri={profile?.avatarUrl}
              size={68}
              showRing
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out and switch user"
            onPress={signOut}
            hitSlop={8}
            style={({ pressed }) => [
              styles.signOut,
              { backgroundColor: 'rgba(255,255,255,0.16)', opacity: pressed ? 0.7 : 1 },
            ]}>
            <MaterialCommunityIcons name="logout-variant" size={15} color={palette.onPrimary} />
            <Label variant="captionStrong" style={{ color: palette.onPrimary }}>
              Logout
            </Label>
          </Pressable>
        </View>

        <View style={styles.heroText}>
          <Label variant="title" numberOfLines={1} style={{ color: palette.onPrimary }}>
            {displayName}
          </Label>
          <Label variant="caption" numberOfLines={1} style={{ color: palette.onPrimary, opacity: 0.85 }}>
            @{displayHandle}
          </Label>
          {profile?.bio ? (
            <Label variant="caption" numberOfLines={3} style={styles.heroBio}>
              {profile.bio}
            </Label>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.statRow}>
        <StatCard value={stats?.rankingCount ?? 0} label="Rankings" />
        <StatCard
          value={stats?.averageRating != null ? stats.averageRating.toFixed(1) : '—'}
          label="Avg score"
          icon="star"
        />
        <StatCard value={profile?.followerCount ?? 0} label="Followers" />
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedTabs
          options={GROUP_TABS.map((key) => GROUP_LABEL[key])}
          selected={GROUP_LABEL[group]}
          onSelect={(label) =>
            setGroup(GROUP_TABS.find((key) => GROUP_LABEL[key] === label) ?? 'top')
          }
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScreenHeader title="Profile" subtitle={session.handle ? `Signed in as @${session.handle}` : undefined} />

      {loading ? (
        <LoadingState label="Loading your profile" />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          key={group}
          data={group === 'category' ? buckets : items}
          keyExtractor={(entry: any) =>
            group === 'category'
              ? `category-${(entry as Bucket).category}-${(entry as Bucket).items
                  .map((item) => item.id)
                  .join('-')}`
              : (entry as ProfileRankingSummary).id
          }
          numColumns={group === 'category' ? 1 : 2}
          columnWrapperStyle={group === 'category' ? undefined : styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={styles.listHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />
          }
          renderItem={({ item }) =>
            group === 'category' ? (
              <CategoryBucket bucket={item as Bucket} onOpenRatings={setBreakdownId} />
            ) : (
              <GridTile item={item as ProfileRankingSummary} onOpenRatings={setBreakdownId} />
            )
          }
          ListEmptyComponent={
            <EmptyState
              icon="image-multiple-outline"
              title="Nothing here yet"
              message={
                group === 'top'
                  ? 'Add rankings to build your Top 10 board.'
                  : 'Rankings you add will appear in this view.'
              }
            />
          }
        />
      )}

      <RatingBreakdownSheet rankingId={breakdownId} onClose={() => setBreakdownId(null)} />
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon?: 'star' }) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: palette.surface, borderColor: palette.border },
        shadows.card,
      ]}>
      <View style={styles.statValue}>
        {icon ? <MaterialCommunityIcons name={icon} size={14} color={palette.star} /> : null}
        <Label variant="title">{value}</Label>
      </View>
      <Label variant="caption" tone="tertiary">
        {label}
      </Label>
    </View>
  );
}

function GridTile({
  item,
  onOpenRatings,
}: {
  item: ProfileRankingSummary;
  onOpenRatings: (id: string) => void;
}) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: palette.surface, borderColor: palette.border },
        shadows.card,
      ]}>
      <Poster
        uri={item.posterUrl}
        style={styles.tilePoster}
        width={undefined}
        height={undefined}
      />

      <View style={styles.tileBody}>
        <Label variant="captionStrong" numberOfLines={2}>
          {item.title}
        </Label>
        <Label variant="caption" tone="tertiary" numberOfLines={1}>
          {item.category}
        </Label>
      </View>

      <Pressable
        accessibilityLabel={`Rating breakdown for ${item.title}`}
        onPress={() => onOpenRatings(item.id)}
        hitSlop={6}
        style={styles.tileScore}>
        <MaterialCommunityIcons name="star" size={13} color={palette.star} />
        <Label variant="captionStrong" tone="secondary">
          {formatRating(item.rating)}
        </Label>
      </Pressable>
    </View>
  );
}

function CategoryBucket({
  bucket,
  onOpenRatings,
}: {
  bucket: Bucket;
  onOpenRatings: (id: string) => void;
}) {
  return (
    <View style={styles.bucket}>
      <View style={styles.bucketHeader}>
        <Label variant="captionStrong">
          {bucket.category}
        </Label>
        <Label variant="caption" tone="tertiary">
          {bucket.items.length}
        </Label>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bucketRow}>
        {bucket.items.map((item) => (
          <View key={`${bucket.category}-${item.id}`} style={styles.bucketTile}>
            <GridTile item={item} onOpenRatings={onOpenRatings} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  listHeader: { gap: Spacing.lg, paddingBottom: Spacing.lg },
  column: { gap: Spacing.md },
  hero: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAvatarRing: {
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 2,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  heroText: { gap: 2 },
  heroBio: { marginTop: Spacing.sm, opacity: 0.9 },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  stat: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segmentWrap: { paddingTop: Spacing.xs },
  tile: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tilePoster: {
    width: '100%',
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm, gap: 2 },
  tileScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  bucket: { gap: Spacing.sm, marginBottom: Spacing.lg },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketRow: { gap: Spacing.md, paddingRight: Spacing.lg },
  bucketTile: { width: 140 },
});
