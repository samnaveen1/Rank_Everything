import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import {
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';

import { CardRadius, Radius, Spacing, Typography, makeShadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { titleCase } from '@/utils/format';
import { Chip, IconButton, Label } from './kit';

/** Spreads into a StyleSheet entry to pin an element to its parent. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/* TextField --------------------------------------------------------------- */

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  hint,
  error,
  multiline,
  containerStyle,
  style,
  ...rest
}: TextFieldProps) {
  const palette = useTheme();

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      <Label variant="overline" tone="secondary">
        {label}
      </Label>
      <TextInput
        placeholderTextColor={palette.textTertiary}
        multiline={multiline}
        style={[
          styles.input,
          { color: palette.text },
          { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border },
          multiline && styles.inputMultiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Label variant="caption" tone="danger">
          {error}
        </Label>
      ) : hint ? (
        <Label variant="caption" tone="tertiary">
          {hint}
        </Label>
      ) : null}
    </View>
  );
}

/* StarRatingInput -------------------------------------------------------- */

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Ten tappable stars with a continuous fill so half steps are visible, plus a
 * live numeric readout.
 */
export function StarRatingInput({
  value,
  onChange,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const palette = useTheme();
  const [rowWidth, setRowWidth] = useState(0);

  const stars = useMemo(() => Array.from({ length: max }, (_, index) => index + 1), [max]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!rowWidth) {
        return;
      }

      const exactValue = (event.nativeEvent.locationX / rowWidth) * max;
      const snappedValue = Math.min(max, Math.max(0, Math.round(exactValue * 2) / 2));
      onChange(Number(snappedValue.toFixed(1)));
    },
    [max, onChange, rowWidth],
  );

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={styles.starHeader}>
        <Label variant="overline" tone="secondary">
          Your rating
        </Label>
        <View style={styles.starReadout}>
          <MaterialCommunityIcons name="star" size={16} color={palette.star} />
          <Label variant="numeric" tone="star">
            {value.toFixed(1)}
          </Label>
          <Label variant="caption" tone="tertiary">
            / {max}
          </Label>
        </View>
      </View>

      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`Rate from 0 to ${max} stars`}
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        onPress={handlePress}
        style={styles.starRow}>
        {stars.map((star) => {
          const fill = clamp(value - (star - 1), 0, 1);
          return (
            <View key={star} style={styles.starSlot} pointerEvents="none">
              <MaterialCommunityIcons name="star-outline" size={26} color={palette.starMuted} />
              {fill > 0 ? (
                <View style={[styles.starFillClip, { width: `${fill * 100}%` }]}>
                  <MaterialCommunityIcons name="star" size={26} color={palette.star} />
                </View>
              ) : null}
            </View>
          );
        })}
      </Pressable>

      <View style={styles.starScale}>
        <Label variant="caption" tone="tertiary">
          Not for me
        </Label>
        <Label variant="caption" tone="tertiary">
          Perfect
        </Label>
      </View>
    </View>
  );
}

/* TagSelector ------------------------------------------------------------- */

type TagSelectorProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  allowCustom?: boolean;
};

export function TagSelector({
  label,
  options,
  selected,
  onChange,
  max = 8,
  allowCustom = true,
}: TagSelectorProps) {
  const palette = useTheme();
  const [draft, setDraft] = useState('');

  const normalizedOptions = useMemo(
    () => options.map(titleCase).filter((option) => !selected.includes(option)),
    [options, selected],
  );

  const toggle = useCallback(
    (tag: string) => {
      onChange(
        selected.includes(tag)
          ? selected.filter((value) => value !== tag)
          : selected.length >= max
            ? selected
            : [...selected, tag],
      );
    },
    [selected, onChange, max],
  );

  const commitDraft = useCallback(() => {
    const tag = titleCase(draft);
    if (tag && !selected.includes(tag) && selected.length < max) {
      onChange([...selected, tag]);
    }
    setDraft('');
  }, [draft, selected, onChange, max]);

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={styles.tagHeader}>
        <Label variant="overline" tone="secondary">
          {label}
        </Label>
        <Label variant="caption" tone="tertiary">
          {selected.length}/{max}
        </Label>
      </View>

      <View style={styles.tagWrap}>
        {selected.map((tag) => (
          <Chip key={tag} label={`${tag}  ×`} selected onPress={() => toggle(tag)} />
        ))}
        {normalizedOptions.map((option) => (
          <Chip key={option} label={option} onPress={() => toggle(option)} />
        ))}
      </View>

      {allowCustom ? (
        <View style={styles.tagInputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commitDraft}
            onBlur={commitDraft}
            returnKeyType="done"
            placeholder="Add your own tag"
            placeholderTextColor={palette.textTertiary}
            autoCapitalize="words"
            style={[
              styles.tagInput,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          />
          {draft.trim() ? (
            <IconButton name="check" label="Add tag" filled tone="primary" onPress={commitDraft} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* PosterUpload ------------------------------------------------------------ */

type PosterUploadProps = {
  uris: string[];
  onChange: (uris: string[]) => void;
  max?: number;
  error?: string;
};

export const PosterUpload = ({ uris, onChange, max = 6, error }: PosterUploadProps) => {
  const palette = useTheme();
  const [busy, setBusy] = useState(false);

  const pick = useCallback(async () => {
    const remaining = max - uris.length;
    if (remaining <= 0) {
      return;
    }

    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo library access is required to attach a poster.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: Platform.OS !== 'web',
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const picked = result.assets.map((asset) => asset.uri);
      onChange([...uris, ...picked].slice(0, max));
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  }, [uris, onChange, max]);

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={styles.tagHeader}>
        <Label variant="overline" tone="secondary">
          Poster images
        </Label>
        <Label variant="caption" tone="tertiary">
          {uris.length}/{max}
        </Label>
      </View>

      <View style={styles.posterWrap}>
        {uris.map((uri, index) => (
          <View key={uri} style={[styles.posterTile, { borderColor: palette.border }]}>
            <ExpoImage
              source={{ uri }}
              style={FILL}
              contentFit="cover"
              transition={140}
            />
            {index === 0 ? (
              <View style={[styles.coverTag, { backgroundColor: palette.primary }]}>
                <Label variant="overline" tone="inverse" style={styles.coverTagText}>
                  Cover
                </Label>
              </View>
            ) : null}
            <View style={styles.posterRemove}>
              <IconButton
                name="close"
                label={`Remove image ${index + 1}`}
                size={14}
                tone="inverse"
                filled
                onPress={() => onChange(uris.filter((value) => value !== uri))}
                style={styles.posterRemoveButton}
              />
            </View>
          </View>
        ))}

        {uris.length < max ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tap to upload poster"
            onPress={pick}
            disabled={busy}
            style={({ pressed }) => [
              styles.posterAdd,
              { borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted, opacity: pressed ? 0.7 : 1 },
            ]}>
            <MaterialCommunityIcons name="image-plus" size={22} color={palette.primary} />
            <Label variant="caption" tone="primary" style={styles.posterAddLabel}>
              {busy ? 'Opening…' : 'Tap to upload poster'}
            </Label>
            <Label variant="caption" tone="tertiary" style={styles.posterAddHint}>
              Up to {max} images
            </Label>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Label variant="caption" tone="danger">
          {error}
        </Label>
      ) : null}
    </View>
  );
};

/* CategoryPicker ---------------------------------------------------------- */

export function CategoryPicker({
  categories,
  selected,
  onChange,
  allowCustom = true,
}: {
  categories: string[];
  selected: string;
  onChange: (category: string) => void;
  allowCustom?: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const palette = useTheme();

  const commit = useCallback(() => {
    const value = titleCase(draft);
    if (value) {
      onChange(value);
    }
    setDraft('');
    setCreating(false);
  }, [draft, onChange]);

  return (
    <View style={{ gap: Spacing.sm }}>
      <Label variant="overline" tone="secondary">
        Category
      </Label>

      <View style={styles.tagWrap}>
        {categories.map((category) => (
          <Chip
            key={category}
            label={titleCase(category)}
            selected={selected === category}
            onPress={() => onChange(category)}
          />
        ))}
        {allowCustom ? (
          <Chip label="＋ New" onPress={() => setCreating(true)} />
        ) : null}
      </View>

      {creating ? (
        <View style={styles.tagInputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            autoFocus
            returnKeyType="done"
            placeholder="Category name"
            placeholderTextColor={palette.textTertiary}
            autoCapitalize="words"
            style={[
              styles.tagInput,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          />
          <IconButton name="check" label="Save category" filled tone="primary" onPress={commit} />
          <IconButton name="close" label="Cancel" onPress={() => setCreating(false)} />
        </View>
      ) : null}
    </View>
  );
};

/* FormError --------------------------------------------------------------- */

export function FormError({ message }: { message: string }) {
  const palette = useTheme();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  return (
    <View
      style={[
        styles.formError,
        { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
        shadows.card,
      ]}>
      <MaterialCommunityIcons name="alert-circle" size={18} color={palette.danger} />
      <Label variant="caption" tone="danger" style={{ flex: 1 }}>
        {message}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: CardRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  starHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starReadout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starSlot: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starFillClip: {
    position: 'absolute',
    left: 0,
    top: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  starScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: CardRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  posterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  posterTile: {
    width: 96,
    height: 128,
    borderRadius: CardRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posterAdd: {
    width: 96,
    height: 128,
    borderRadius: CardRadius,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 2,
  },
  posterAddLabel: { textAlign: 'center' },
  posterAddHint: { fontSize: 11 },
  coverTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  coverTagText: { fontSize: 9 },
  posterRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  posterRemoveButton: {
    width: 26,
    height: 26,
    backgroundColor: 'rgba(10,20,24,0.72)',
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: CardRadius,
    borderWidth: 1,
  },
});
