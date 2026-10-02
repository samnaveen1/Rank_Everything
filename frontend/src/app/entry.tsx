import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    CategoryPicker,
    FormError,
    PosterUpload,
    StarRatingInput,
    TagSelector,
    TextField,
} from '@/components/ui/forms';
import { Button, IconButton, Label, LoadingState } from '@/components/ui/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import {
    createRanking,
    loadCategories,
    loadRanking,
    loadTags,
    updateRanking,
} from '@/services/api';
import { RankingInput } from '@/types/item';
import { titleCase } from '@/utils/format';

const SUGGESTED_TAGS = [
  'Action',
  'Thriller',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Indian Cinema',
  'Korean Cinema',
  'Animation',
  'Documentary',
  'Must Try',
  'Fine Dining',
  'Street Food',
  'Seafood',
  'Beach',
  'Mountains',
  'City Break',
  'Non-Fiction',
  'Fiction',
  'Mystery',
  'Open World',
];

type FormState = {
  title: string;
  category: string;
  tags: string[];
  rating: number;
  description: string;
  posterUrls: string[];
};

const emptyForm: FormState = {
  title: '',
  category: '',
  tags: [],
  rating: 0,
  description: '',
  posterUrls: [],
};

export default function EntryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const palette = useTheme();
  const session = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const isEditing = typeof id === 'string' && id.length > 0;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>(SUGGESTED_TAGS);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session.ready && !session.handle) {
      router.replace('/login');
    }
  }, [router, session.handle, session.ready]);

  const patch = useCallback((next: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...next }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadCategories()
      .then((values) => {
        if (!cancelled) {
          setCategories(values);
        }
      })
      .catch(() => {
        // The picker still offers a custom category field.
      });

    loadTags()
      .then((values) => {
        if (!cancelled && values.length > 0) {
          setTagOptions([...new Set([...values, ...SUGGESTED_TAGS])]);
        }
      })
      .catch(() => {
        // Fall back to the suggested list.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditing || !id) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const match = await loadRanking(id);
        if (cancelled) {
          return;
        }
        setForm({
          title: match.title,
          category: match.category,
          tags: match.tags,
          rating: match.rating,
          description: match.description,
          posterUrls: match.posterUrls,
        });
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError('That ranking could not be found. It may have been deleted.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const submit = useCallback(async () => {
    setError('');

    if (!form.title.trim()) {
      setError('Give this ranking a title before saving.');
      return;
    }
    if (!form.category.trim()) {
      setError('Pick a category so it shows up in the right filter.');
      return;
    }
    if (form.rating <= 0) {
      setError('Tap a star to rate this from 1 to 10.');
      return;
    }

    const input: RankingInput = {
      title: form.title.trim(),
      category: titleCase(form.category.trim()),
      tags: form.tags.map(titleCase),
      rating: form.rating,
      description: form.description.trim(),
      posterUrls: form.posterUrls,
    };

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateRanking(id, input);
      } else {
        await createRanking(input);
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.replace('/');
      }
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'The ranking could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [form, id, isEditing, navigation, router]);

  const categoryOptions = useMemo(
    () => [...new Set([...categories, form.category].filter(Boolean))],
    [categories, form.category],
  );

  if (!session.ready || !session.handle) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
        <LoadingState label="Checking your session..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <IconButton name="close" label="Cancel" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Label variant="heading" numberOfLines={1}>
            {isEditing ? 'Edit ranking' : 'Add ranking'}
          </Label>
          <Label variant="caption" tone="secondary" numberOfLines={1}>
            {isEditing ? 'Update your score, tags, and poster' : 'Rate something and tag it'}
          </Label>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading ranking" />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {error ? <FormError message={error} /> : null}

            <Label variant="heading">1. What are you ranking?</Label>
            <PosterUpload
              uris={form.posterUrls}
              onChange={(posterUrls) => patch({ posterUrls })}
            />

            <TextField
              label="Title"
              value={form.title}
              onChangeText={(title) => patch({ title })}
              placeholder="Example: Interstellar"
              autoCapitalize="words"
              maxLength={120}
            />

            <Label variant="heading">2. Category</Label>
            <CategoryPicker
              categories={categoryOptions}
              selected={form.category}
              onChange={(category) => patch({ category })}
            />

            <Label variant="heading">3. Your rating</Label>
            <StarRatingInput
              value={form.rating}
              onChange={(rating) => patch({ rating })}
            />

            <Label variant="heading">4. Tags</Label>
            <TagSelector
              label="Genres & tags"
              options={tagOptions}
              selected={form.tags}
              onChange={(tags) => patch({ tags })}
            />

            <Label variant="heading">5. Your thoughts</Label>
            <TextField
              label="Description"
              value={form.description}
              onChangeText={(description) => patch({ description })}
              placeholder="What did you make of it? Why does it deserve the score?"
              multiline
              maxLength={2000}
            />

            <Button
              title={isEditing ? 'Save changes' : 'Add ranking'}
              icon={isEditing ? 'content-save-outline' : 'plus'}
              loading={saving}
              onPress={submit}
            />

            <View
              style={[
                styles.tip,
                { backgroundColor: palette.primarySoft, borderColor: palette.border },
              ]}>
              <Label variant="caption" style={{ color: palette.textSecondary }}>
                Posters you attach are stored as image references. The first image becomes the cover used
                across your board, the leaderboard, and your profile grid.
              </Label>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerText: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  tip: {
    padding: Spacing.md,
    borderRadius: Spacing.md,
  },
});
