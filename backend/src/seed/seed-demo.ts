import bcrypt from "bcryptjs";
import { closeDatabase, getDatabase } from "../db/mongodb.js";
import { ActivityDocument } from "../modules/community/types.js";
import { RankingItem } from "../modules/rankings/types.js";
import { UserDocument } from "../modules/users/types.js";

const DEMO_HANDLE = "demo";
const DEMO_PASSWORD = "Demo@12345";
const now = new Date().toISOString();
const poster = (slug: string): string => `https://picsum.photos/seed/rankio-demo-${slug}/600/800`;

const rankings: RankingItem[] = [
  {
    id: "demo-ranking-interstellar",
    title: "Interstellar",
    category: "Movies",
    tags: ["Sci-Fi", "Drama", "Space"],
    rating: 9.5,
    description: "Big-hearted science fiction with a score that keeps climbing on every rewatch.",
    posterUrls: [poster("interstellar")],
    authorHandle: DEMO_HANDLE,
    reviewCount: 12,
    voteDistribution: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 11 },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "demo-ranking-dark-knight",
    title: "The Dark Knight",
    category: "Movies",
    tags: ["Action", "Thriller", "Modern Classic"],
    rating: 9.2,
    description: "A superhero film with the tension and scale of a great crime epic.",
    posterUrls: [poster("dark-knight")],
    authorHandle: DEMO_HANDLE,
    reviewCount: 10,
    voteDistribution: { "1": 0, "2": 0, "3": 0, "4": 2, "5": 8 },
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
  },
  {
    id: "demo-ranking-red-dead",
    title: "Red Dead Redemption 2",
    category: "Games",
    tags: ["Open World", "Narrative", "Adventure"],
    rating: 9.7,
    description: "A patient, beautiful open world that rewards paying attention.",
    posterUrls: [poster("red-dead")],
    authorHandle: DEMO_HANDLE,
    reviewCount: 14,
    voteDistribution: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 13 },
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
  },
  {
    id: "demo-ranking-tokyo-food",
    title: "Tokyo Food Tour",
    category: "Restaurants",
    tags: ["Street Food", "Travel", "Must Try"],
    rating: 9.0,
    description: "A delicious route through tiny counters, late-night noodles, and perfect coffee.",
    posterUrls: [poster("tokyo-food")],
    authorHandle: DEMO_HANDLE,
    reviewCount: 8,
    voteDistribution: { "1": 0, "2": 0, "3": 0, "4": 2, "5": 6 },
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "demo-ranking-silent-path",
    title: "The Silent Path",
    category: "Books",
    tags: ["Fiction", "Mystery", "Reflective"],
    rating: 8.5,
    description: "A quiet, thoughtful read about memory, place, and what we choose to keep.",
    posterUrls: [poster("silent-path")],
    authorHandle: DEMO_HANDLE,
    reviewCount: 6,
    voteDistribution: { "1": 0, "2": 0, "3": 1, "4": 2, "5": 3 },
    createdAt: "2026-09-05T10:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z",
  },
];

const main = async (): Promise<void> => {
  const database = await getDatabase();
  try {
    const users = database.collection<UserDocument>("users");
    const rankingCollection = database.collection<RankingItem>("ranking_items");
    const activity = database.collection<ActivityDocument>("activity");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    await users.updateOne(
      { handle: DEMO_HANDLE },
      {
        $set: {
          name: "Sam",
          email: "demo@rank.io",
          passwordHash,
          provider: "local",
          bio: "Ranking things I love.",
          avatarUrl: poster("demo-avatar"),
          backgroundImageUrl: poster("demo-cover"),
          themePreference: "light",
          followerCount: 0,
          followingCount: 0,
          following: [],
        },
        $setOnInsert: { handle: DEMO_HANDLE, joinedAt: now },
      },
      { upsert: true },
    );

    for (const ranking of rankings) {
      await rankingCollection.updateOne(
        { id: ranking.id },
        { $set: ranking },
        { upsert: true },
      );

      const activityId = `demo-activity-${ranking.id}`;
      await activity.updateOne(
        { id: activityId },
        {
          $set: {
            kind: "ranked",
            actorHandle: DEMO_HANDLE,
            targetId: ranking.id,
            body: `Sam ranked ${ranking.title}`,
            createdAt: ranking.createdAt,
            likeHandles: [],
            shareCount: 0,
            comments: [],
          },
          $setOnInsert: { id: activityId },
        },
        { upsert: true },
      );
    }

    process.stdout.write("Demo data seeded successfully.\n\nLogin:\nEmail: demo@rank.io\nPassword: Demo@12345\n");
  } finally {
    await closeDatabase();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
