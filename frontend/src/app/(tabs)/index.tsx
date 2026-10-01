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
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    Chip,
    EmptyState,
    ErrorState,
    Fab,
    Label,
    SkeletonList,
} from '@/components/ui/kit';
import { ConfirmDialog, ItemCard, PaginationBar } from '@/components/ui/ranking';
import { RatingBreakdownSheet } from '@/components/ui/RatingBreakdownSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Layout, Radius, Spacing, Typography, makeShadows } from '@/constants/theme';
import { useRankings } from '@/hooks/use-rankings';
import { useTheme } from '@/hooks/use-theme';
import { deleteRanking, loadCurrentUser } from '@/services/api';
import { RankingItem } from '@/types/item';
import { titleCase } from '@/utils/format';

export default function MyTopTenScreen() {
  const router = useRouter();
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const [handle, setHandle] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<'rating' | 'recent'>('rating');
  const [pendingDelete, setPendingDelete] = useState<RankingItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [breakdownId, setBreakdownId] = useState<string | null>(null);

  const rankings = useRankings({
    author: handle ?? undefined,
    category,
    query: searchText,
    sort,
  });

  // Resolve the signed-in handle once; the app has no auth layer, so the API
  // decides which rankings are "mine".
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadCurrentUser()
        .then((user) => {
          if (!cancelled) {
            setHandle(user.handle);
          }
        })
        .catch((error) => console.error(error));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    try {
      await deleteRanking(pendingDelete.id);
      rankings.removeItem(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, rankings]);

  const openEntry = useCallback(
    (item?: RankingItem) => {
      router.push(item ? { pathname: '/entry', params: { id: item.id } } : '/entry');
    },
    [router],
  );

  const fabInset = insets.bottom + Layout.fabSize + Spacing.lg;

  // Headline numbers for the hero strip; derived from what is already loaded
  // so no extra request is needed.
  const scored = rankings.items.filter((item) => item.rating > 0);
  const average =
    scored.length > 0
      ? scored.reduce((sum, item) => sum + item.rating, 0) / scored.length
      : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScreenHeader
        title="RANK.io"
        subtitle={handle ? `@${handle}'s personal board` : 'Loading your board…'}
        onPressSearch={() => setSearchOpen((value) => !value)}
        searchActive={searchOpen || searchText.length > 0}
      />

      {/* Hero strip: makes the flagship board feel like the centerpiece. */}
      <LinearGradient
        colors={[palette.primary, palette.primaryPressed]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroStat}>
          <Label variant="display" style={{ color: palette.onPrimary }}>
            {rankings.total}
          </Label>
          <Label variant="overline" style={styles.heroStatLabel}>
            {rankings.total === 1 ? 'RANKING' : 'RANKINGS'}
          </Label>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroStat}>
          <View style={styles.heroScoreRow}>
            <MaterialCommunityIcons name="star" size={18} color={palette.star} />
            <Label variant="display" style={{ color: palette.onPrimary }}>
              {average !== null ? average.toFixed(1) : '—'}
            </Label>
          </View>
          <Label variant="overline" style={styles.heroStatLabel}>
            AVG SCORE
          </Label>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroStat}>
          <Label variant="display" style={{ color: palette.onPrimary }}>
            {rankings.categories.length}
          </Label>
          <Label variant="overline" style={styles.heroStatLabel}>
            CATEGORIES
          </Label>
        </View>
      </LinearGradient>

      {searchOpen ? (
        <View style={styles.searchWrap}>
          <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.card]}>
            <MaterialCommunityIcons name="magnify" size={18} color={palette.textTertiary} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by title, category, tag, or notes"
              placeholderTextColor={palette.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[styles.searchInput, { color: palette.text }]}
            />
            {searchText ? (
              <Pressable accessibilityLabel="Clear search" onPress={() => setSearchText('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={17} color={palette.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sortRow}>
            {(['rating', 'recent'] as const).map((option) => (
              <Chip
                key={option}
                label={option === 'rating' ? 'Top rated' : 'Most recent'}
                selected={sort === option}
                onPress={() => setSort(option)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}>
        {rankings.categories.map((option) => (
          <Chip
            key={option}
            label={titleCase(option)}
            selected={category === option}
            onPress={() => setCategory(option)}
          />
        ))}
      </ScrollView>

      {rankings.loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonList rows={5} />
        </View>
      ) : rankings.error ? (
        <ErrorState message={rankings.error} onRetry={rankings.refresh} />
      ) : (
        <FlatList
          data={rankings.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            rankings.items.length === 0 && styles.listEmpty,
            { paddingBottom: fabInset + Spacing.lg },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={rankings.refresh}
              tintColor={palette.primary}
            />
          }
          onEndReached={rankings.hasMore ? rankings.loadMore : undefined}
          onEndReachedThreshold={0.4}
          renderItem={({ item, index }) => (
            <ItemCard
              item={item}
              rank={index + 1}
              onEdit={openEntry}
              onDelete={setPendingDelete}
              onOpenRatings={(target) => setBreakdownId(target.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={searchText ? 'magnify' : 'trophy-outline'}
              title={searchText ? 'No matches' : 'Nothing ranked yet'}
              message={
                searchText
                  ? 'Try a different search, or clear the category filter.'
                  : 'Add your first ranking and it will show up at the top of your board.'
              }
              actionLabel={searchText ? undefined : '＋ Add ranking'}
              onAction={searchText ? undefined : () => openEntry()}
            />
          }
          ListFooterComponent={
            rankings.items.length > 0 ? (
              <PaginationBar
                page={rankings.page}
                pageSize={10}
                total={rankings.total}
                loaded={rankings.items.length}
                onPageChange={rankings.goToPage}
                onLoadMore={rankings.loadMore}
                loadingMore={rankings.loadingMore}
                hasMore={rankings.hasMore}
              />
            ) : null
          }
        />
      )}

      <Fab label="Add ranking" bottomInset={insets.bottom + Spacing.lg} onPress={() => openEntry()} />

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete ranking"
        message={`${pendingDelete?.title ?? ''} will be removed from your board permanently.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <RatingBreakdownSheet rankingId={breakdownId} onClose={() => setBreakdownId(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatLabel: { color: '#FFFFFF', opacity: 0.82 },
  heroDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.28)' },
  skeletonWrap: { paddingTop: Spacing.md },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chipScroll: {
    flexGrow: 0,
    maxHeight: 52,
  },
  chipRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  listEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: Spacing.md,
  },
});
