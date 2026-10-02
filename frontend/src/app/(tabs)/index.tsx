import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import {
  CardRadius,
  Layout,
  Radius,
  ScreenPadding,
  Spacing,
  Typography,
  makeShadows,
} from '@/constants/theme';
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

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [authorHandle, setAuthorHandle] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<'rating' | 'recent'>('rating');
  const [pendingDelete, setPendingDelete] = useState<RankingItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [breakdownId, setBreakdownId] = useState<string | null>(null);

  const rankings = useRankings({
    author: authorHandle ?? undefined,
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
            setDisplayName(user.name);
            setAuthorHandle(user.handle);
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
        subtitle={displayName ? 'Your personal board' : 'Loading your board…'}
        onPressSearch={() => setSearchOpen((value) => !value)}
        searchActive={searchOpen || searchText.length > 0}
      />

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
          shadows.card,
        ]}>
        <View style={styles.summaryStat}>
          <Label variant="title" style={{ color: palette.primary }}>
            {rankings.total}
          </Label>
          <Label variant="overline" style={{ color: palette.textSecondary }}>
            {rankings.total === 1 ? 'RANKING' : 'RANKINGS'}
          </Label>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />

        <View style={styles.summaryStat}>
          <View style={styles.summaryScoreRow}>
            <MaterialCommunityIcons name="star" size={16} color={palette.star} />
            <Label variant="title" style={{ color: palette.text }}>
              {average !== null ? average.toFixed(1) : '—'}
            </Label>
          </View>
          <Label variant="overline" style={{ color: palette.textSecondary }}>
            AVG SCORE
          </Label>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />

        <View style={styles.summaryStat}>
          <Label variant="title" style={{ color: palette.text }}>
            {rankings.categories.length}
          </Label>
          <Label variant="overline" style={{ color: palette.textSecondary }}>
            CATEGORIES
          </Label>
        </View>
      </View>

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
                  : 'Rank movies, games, restaurants, books, travel, and more to build your taste profile.'
              }
              actionLabel={searchText ? undefined : '+ Add ranking'}
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

      {rankings.items.length > 0 ? (
        <Fab label="Add ranking" bottomInset={insets.bottom + Spacing.lg} onPress={() => openEntry()} />
      ) : null}

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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: ScreenPadding,
    marginTop: Spacing.sm,
    borderRadius: CardRadius,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  summaryStat: { flex: 1, alignItems: 'center', gap: 2 },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: 30 },
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
