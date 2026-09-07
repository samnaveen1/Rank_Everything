import AsyncStorage from "@react-native-async-storage/async-storage";
import { RankingItem } from "../types/item";

const STORAGE_KEY = "rank_everything_items";

const isRankingItem = (value: unknown): value is RankingItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.rating === "number" &&
    Number.isFinite(item.rating) &&
    item.rating >= 0 &&
    item.rating <= 10 &&
    typeof item.notes === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

export const saveItems = async (items: RankingItem[]) => {
  const jsonValue = JSON.stringify(items);

  await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
};

export const loadItems = async (): Promise<RankingItem[]> => {
  const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (jsonValue === null) {
    return [];
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(jsonValue);
  } catch {
    throw new Error("Stored rankings contain invalid JSON.");
  }

  if (!Array.isArray(parsedValue) || !parsedValue.every(isRankingItem)) {
    throw new Error("Stored rankings have an invalid format.");
  }

  return parsedValue;
};

export const clearItems = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};