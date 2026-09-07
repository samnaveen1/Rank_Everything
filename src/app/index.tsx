import { useEffect, useMemo, useState } from "react";
import CategoryFilter from "../components/CategoryFilter";
import SearchBar from "../components/SearchBar";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  filterByCategory,
  getCategories,
  searchItems,
  sortByRating,
} from "../utils/ranking";
import ItemCard from "../components/ItemCard";
import ItemForm from "../components/ItemForm";

import {
  loadItems,
  saveItems,
} from "../services/storage";

import { RankingItem } from "../types/item";

export default function HomeScreen() {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RankingItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStoredItems();
  }, []);

  const loadStoredItems = async () => {
    try {
      setError("");

      const storedItems = await loadItems();

      setItems(storedItems);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load your rankings."
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => getCategories(items), [items]);

  const rankedItems = useMemo(() => {
    const categoryItems = filterByCategory(items, selectedCategory);
    const searchedItems = searchItems(categoryItems, searchText);

    return sortByRating(searchedItems);
  }, [items, searchText, selectedCategory]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const handleAddItem = async (
    name: string,
    category: string,
    rating: number,
    notes: string
  ) => {
    const now = new Date().toISOString();

    const newItem: RankingItem = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      category,
      rating,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const updatedItems = [
      ...items,
      newItem,
    ];

    try {
      await saveItems(updatedItems);

      setItems(updatedItems);
      setShowForm(false);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Save failed",
        "The ranking could not be saved."
      );
    }
  };

  const handleEditItem = async (
    name: string,
    category: string,
    rating: number,
    notes: string
  ) => {
    if (!editingItem) {
      return;
    }

    const updatedItems = items.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            name,
            category,
            rating,
            notes,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    try {
      await saveItems(updatedItems);

      setItems(updatedItems);
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Save failed",
        "The ranking could not be saved."
      );
    }
  };

  const deleteItem = async (id: string) => {
    const updatedItems = items.filter(
      (item) => item.id !== id
    );

    try {
      await saveItems(updatedItems);

      setItems(updatedItems);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Delete failed",
        "The ranking could not be deleted."
      );
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete ranking",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteItem(id),
        },
      ]
    );
  };

  const openAddForm = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const openEditForm = (item: RankingItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading rankings...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          onPress={loadStoredItems}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              🏆 Rank Everything
            </Text>

            <Text style={styles.subtitle}>
              Your personal rankings
            </Text>
          </View>

          {!showForm && (
            <Pressable
              onPress={openAddForm}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                + Add
              </Text>
            </Pressable>
          )}
        </View>

        {showForm ? (
          <ItemForm
            onSave={editingItem ? handleEditItem : handleAddItem}
            onCancel={() => {
              setEditingItem(null);
              setShowForm(false);
            }}
            initialItem={editingItem ?? undefined}
          />
        ) : (
          <>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
            />

            <FlatList
              data={rankedItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={
                rankedItems.length === 0
                  ? styles.emptyList
                  : styles.list
              }
              renderItem={({ item, index }) => (
                <ItemCard
                  item={item}
                  rank={index + 1}
                  onDelete={handleDelete}
                  onEdit={openEditForm}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>
                    {items.length === 0 ? "🏆" : "⌕"}
                  </Text>

                  <Text style={styles.emptyTitle}>
                    {items.length === 0
                      ? "No rankings yet"
                      : "No matching rankings"}
                  </Text>

                  <Text style={styles.emptyText}>
                    {items.length === 0
                      ? "Add your first item to start ranking anything you choose."
                      : "Try a different search or category filter."}
                  </Text>

                  {items.length === 0 ? (
                    <Pressable
                      onPress={openAddForm}
                      style={styles.emptyButton}
                    >
                      <Text style={styles.emptyButtonText}>
                        + Add your first item
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#111111",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  list: {
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 48,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "bold",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  errorText: {
    marginTop: 8,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});