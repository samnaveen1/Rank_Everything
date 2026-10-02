import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// LinearGradient removed in light redesign
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, EmptyState, ErrorState, Label, LoadingState, Poster } from '@/components/ui/kit';
import { RatingBreakdownSheet } from '@/components/ui/RatingBreakdownSheet';
import { ScreenHeader, SegmentedTabs } from '@/components/ui/ScreenHeader';
import { Radius, ScreenPadding, Spacing, makeShadows } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { setThemeOverride, useTheme } from '@/hooks/use-theme';
import {
    loadCurrentUser,
    loadUserRankings,
    loadUserStats,
    updateCurrentUser,
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
  const shadows = useMemo(() => makeShadows(palette), [palette]);
  const session = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [group, setGroup] = useState<ProfileGroup>('top');
  const [items, setItems] = useState<ProfileRankingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [breakdownId, setBreakdownId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [editDraft, setEditDraft] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    backgroundImageUrl: '',
    themePreference: 'light' as 'light' | 'dark',
  });

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
        setThemeOverride(user.themePreference);
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

  const openEditProfile = useCallback(() => {
    if (!profile) return;
    setEditDraft({
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      backgroundImageUrl: profile.backgroundImageUrl,
      themePreference: profile.themePreference,
    });
    setProfileError('');
    setEditOpen(true);
  }, [profile]);

  const pickImage = useCallback(async (field: 'avatarUrl' | 'backgroundImageUrl') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setEditDraft((current) => ({ ...current, [field]: result.assets[0].uri }));
    }
  }, []);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      const updated = await updateCurrentUser(editDraft);
      setProfile(updated);
      setThemeOverride(updated.themePreference);
      setEditOpen(false);
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : 'Unable to update your profile.');
    } finally {
      setSavingProfile(false);
    }
  }, [editDraft]);

  const header = (
    <>
      <View
        style={[
          styles.profileCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
          shadows.card,
        ]}>
        <View style={styles.cover}>
          {profile?.backgroundImageUrl ? <Poster uri={profile.backgroundImageUrl} style={styles.coverImage} /> : null}
          <View style={[styles.coverTint, { backgroundColor: palette.primarySoft }]} />
        </View>
        <View style={styles.heroTop}>
          <View style={styles.heroAvatarRing}>
            <Avatar name={displayName} uri={profile?.avatarUrl} size={68} showRing />
          </View>

        </View>

        <View style={styles.heroText}>
          <Label variant="title" numberOfLines={1} style={{ color: palette.text }}>
            {displayName}
          </Label>
          <Label variant="caption" numberOfLines={1} style={{ color: palette.textSecondary }}>
            @{displayHandle}
          </Label>
          {profile?.bio ? (
            <Label variant="caption" numberOfLines={3} style={[styles.heroBio, { color: palette.textSecondary }]}>
              {profile.bio}
            </Label>
          ) : null}
          <Button title="Edit profile" icon="pencil-outline" fullWidth={false} variant="secondary" onPress={openEditProfile} />
        </View>
      </View>

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
      <ScreenHeader
        title="Profile"
        subtitle="Your RANK.io identity"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out and switch user"
            onPress={signOut}
            hitSlop={8}
            style={({ pressed }) => [
              styles.signOut,
              { backgroundColor: palette.primarySoft, opacity: pressed ? 0.7 : 1 },
            ]}>
            <MaterialCommunityIcons name="logout-variant" size={15} color={palette.primary} />
            <Label variant="captionStrong" style={{ color: palette.primary }}>
              Logout
            </Label>
          </Pressable>
        }
      />

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

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]} behavior="padding">
          <View style={[styles.editSheet, { backgroundColor: palette.background }]}>
            <View style={styles.editHeader}>
              <View>
                <Label variant="title">Edit profile</Label>
                <Label variant="caption" tone="secondary">Make your RANK.io identity yours.</Label>
              </View>
              <Pressable accessibilityLabel="Close edit profile" onPress={() => setEditOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={palette.text} />
              </Pressable>
            </View>

            {profileError ? <Label variant="caption" tone="danger">{profileError}</Label> : null}

            <ScrollView contentContainerStyle={styles.editContent} keyboardShouldPersistTaps="handled">
              <View style={styles.imageActions}>
                <Button title="Change avatar" icon="account-circle-outline" variant="secondary" onPress={() => void pickImage('avatarUrl')} />
                <Button title="Change cover" icon="image-outline" variant="secondary" onPress={() => void pickImage('backgroundImageUrl')} />
              </View>
              <Label variant="overline" tone="secondary">Display name</Label>
              <TextInput
                value={editDraft.name}
                onChangeText={(name) => setEditDraft((current) => ({ ...current, name }))}
                placeholder="Your name"
                placeholderTextColor={palette.textTertiary}
                style={[styles.editInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              />
              <Label variant="overline" tone="secondary">Bio</Label>
              <TextInput
                value={editDraft.bio}
                onChangeText={(bio) => setEditDraft((current) => ({ ...current, bio }))}
                placeholder="Tell people what you love ranking"
                placeholderTextColor={palette.textTertiary}
                multiline
                style={[styles.editInput, styles.editBio, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              />
              <Label variant="overline" tone="secondary">Theme</Label>
              <View style={styles.themeRow}>
                {(['light', 'dark'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    accessibilityRole="button"
                    accessibilityState={{ selected: editDraft.themePreference === mode }}
                    onPress={() => setEditDraft((current) => ({ ...current, themePreference: mode }))}
                    style={[styles.themeChoice, { backgroundColor: editDraft.themePreference === mode ? palette.primary : palette.surface, borderColor: palette.border }]}>
                    <Label tone={editDraft.themePreference === mode ? 'inverse' : 'secondary'}>{mode === 'light' ? 'Light' : 'Dark'}</Label>
                  </Pressable>
                ))}
              </View>
              <Button title="Save profile" icon="content-save-outline" loading={savingProfile} onPress={() => void saveProfile()} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  profileCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: ScreenPadding,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cover: {
    height: 92,
    margin: -Spacing.lg,
    marginBottom: 0,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverTint: { ...StyleSheet.absoluteFill, opacity: 0.42 },
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
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  editSheet: {
    maxHeight: '88%',
    padding: Spacing.lg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  editContent: { gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  imageActions: { gap: Spacing.sm, marginBottom: Spacing.sm },
  editInput: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  editBio: { minHeight: 100, textAlignVertical: 'top' },
  themeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  themeChoice: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
