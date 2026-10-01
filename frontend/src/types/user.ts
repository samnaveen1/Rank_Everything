export type UserHandle = {
  handle: string;
  name: string;
  avatarUrl: string;
};

export type UserProfile = UserHandle & {
  bio: string;
  followerCount: number;
  followingCount: number;
  isCurrentUser: boolean;
};

export type UserStats = {
  rankingCount: number;
  averageRating: number | null;
  followerCount: number;
  topCategories: string[];
};

export type ProfileGroup = 'top' | 'recent' | 'category';
