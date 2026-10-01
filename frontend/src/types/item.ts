export type StarLevel = 1 | 2 | 3 | 4 | 5;

export type VoteDistribution = Record<`${StarLevel}`, number>;

export type RankingItem = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  /** Personal score out of 10. */
  rating: number;
  description: string;
  posterUrls: string[];
  authorHandle: string;
  reviewCount: number;
  voteDistribution: VoteDistribution;
  createdAt: string;
  updatedAt: string;
};

/** Fields the client is allowed to send. */
export type RankingInput = Pick<
  RankingItem,
  'title' | 'category' | 'tags' | 'rating' | 'description' | 'posterUrls'
> & {
  authorHandle?: string;
};

export type RankingPage = {
  items: RankingItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type RatingBucket = {
  stars: StarLevel;
  count: number;
  percent: number;
};

export type RatingBreakdown = {
  rankingId: string;
  title: string;
  category: string;
  posterUrl: string | null;
  average: number;
  totalVotes: number;
  distribution: RatingBucket[];
};
