import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CardRadius, Spacing } from '@/constants/theme';
import { loadRatingBreakdown } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';
import { RatingBreakdown, StarLevel } from '@/types/item';
import { formatCount, formatRating, titleCase } from '@/utils/format';
import { BottomSheet } from './ranking';
import { IconButton, Label, Poster, ProgressBar, RatingBadge, SectionHeader, Tag } from './kit';

type RatingBreakdownSheetProps = {
  rankingId: string | null;
  onClose: () => void;
};

/**
 * Aggregate vote distribution for a ranking, shown as 5★ down to 1★ progress
 * bars with the overall score and review count.
 */
export function RatingBreakdownSheet({ rankingId, onClose }: RatingBreakdownSheetProps) {
  const palette = useTheme();
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<RatingBreakdown | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Clear stale data while rendering when a different ranking is requested,
  // instead of syncing it back down in an effect.
  if (rankingId !== loadedId) {
    setLoadedId(rankingId);
    setBreakdown(null);
    setError('');
  }

  useEffect(() => {
    if (!rankingId) {
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const result = await loadRatingBreakdown(rankingId);
        if (!cancelled) {
          setBreakdown(result);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        console.error(loadError);
        setError('Could not load the rating breakdown.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rankingId, attempt]);

  const loading = rankingId !== null && !breakdown && !error;

  const retry = () => {
    setBreakdown(null);
    setError('');
    setAttempt((value) => value + 1);
  };

  return (
    <BottomSheet
      visible={rankingId !== null}
      onClose={onClose}
      title={breakdown?.title ?? 'Rating breakdown'}
      subtitle={breakdown ? titleCase(breakdown.category) : undefined}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Label variant="body" tone="danger">
            {error}
          </Label>
          <IconButton name="refresh" label="Retry" onPress={retry} style={styles.retry} />
        </View>
      ) : breakdown ? (
        <BreakdownBody breakdown={breakdown} />
      ) : null}
    </BottomSheet>
  );
}

function BreakdownBody({ breakdown }: { breakdown: RatingBreakdown }) {
  const palette = useTheme();

  return (
    <View style={{ gap: Spacing.lg }}>
      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Poster uri={breakdown.posterUrl} style={styles.summaryPoster} width={64} height={88} />

        <View style={styles.summaryText}>
          <Label variant="heading" numberOfLines={2}>
            {breakdown.title}
          </Label>
          <View style={styles.summaryMeta}>
            <RatingBadge rating={breakdown.average} />
            <Tag label={titleCase(breakdown.category)} />
          </View>
          <Label variant="caption" tone="secondary">
            {breakdown.totalVotes > 0
              ? `View ${formatCount(breakdown.totalVotes)} review${breakdown.totalVotes === 1 ? '' : 's'}`
              : 'No community reviews yet'}
          </Label>
        </View>
      </View>

      <SectionHeader title="Vote distribution" />

      <View style={{ gap: Spacing.md }}>
        {breakdown.distribution.map((bucket) => (
          <View key={bucket.stars} style={styles.bucket}>
            <View style={styles.bucketLabel}>
              <MaterialCommunityIcons
                name={bucket.stars > 0 ? 'star' : 'star-outline'}
                size={14}
                color={bucket.stars > 0 ? palette.star : palette.starMuted}
              />
              <Label variant="caption" tone="secondary">
                {bucket.stars}★
              </Label>
            </View>

            <View style={styles.bar}>
              <ProgressBar
                percent={bucket.percent}
                color={bucket.stars >= 4 ? palette.star : bucket.stars === 3 ? palette.textTertiary : palette.danger}
                height={10}
              />
            </View>

            <View style={styles.bucketValue}>
              <Label variant="numeric" tone="secondary">
                {formatRating(bucket.percent)}%
              </Label>
              <Label variant="caption" tone="tertiary" style={styles.bucketCount}>
                {formatCount(bucket.count)}
              </Label>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.footnote, { backgroundColor: palette.surfaceMuted }]}>
        <MaterialCommunityIcons name="information-outline" size={15} color={palette.textTertiary} />
        <Label variant="caption" tone="tertiary" style={styles.footnoteText}>
          Scores are weighted by community votes, so a single 10★ from one person moves the average far
          less than broad agreement.
        </Label>
      </View>
    </View>
  );
}

export type { StarLevel };

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
  },
  retry: { marginTop: Spacing.xs },
  summary: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: CardRadius,
    borderWidth: 1,
  },
  summaryPoster: { borderRadius: 10 },
  summaryText: { flex: 1, gap: 6, justifyContent: 'center' },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  bucket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bucketLabel: {
    width: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bar: { flex: 1 },
  bucketValue: {
    width: 62,
    alignItems: 'flex-end',
  },
  bucketCount: { fontSize: 11 },
  footnote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: CardRadius,
  },
  footnoteText: { flex: 1 },
});