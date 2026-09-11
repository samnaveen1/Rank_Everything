import { RankingItem } from "../types/item";

export const sortByRating = (
  items: RankingItem[]
): RankingItem[] => {
  return [...items].sort(
    (a, b) => b.rating - a.rating
  );
};

export const filterByCategory = (
  items: RankingItem[],
  category: string
): RankingItem[] => {
  if (category === "All") {
    return items;
  }

  return items.filter(
    (item) => item.category === category
  );
};

export const searchItems = (
  items: RankingItem[],
  searchText: string
): RankingItem[] => {
  const query = searchText.trim().toLowerCase();

  if (!query) {
    return items;
  }

  return items.filter((item) => {
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.notes.toLowerCase().includes(query) ||
      item.mapLink?.toLowerCase().includes(query)
    );
  });
};

export const getCategories = (
  items: RankingItem[]
): string[] => {
  const categories = items.map(
    (item) => item.category
  );

  return ["All", ...new Set(categories)];
};