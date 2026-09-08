import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import CategoryFilter from "../components/CategoryFilter";
import ItemCard from "../components/ItemCard";
import ItemForm from "../components/ItemForm";
import SearchBar from "../components/SearchBar";
import {
    createItem,
    deleteItem as deleteItemFromApi,
    loadItems,
    updateItem,
} from "../services/api";
import { RankingItem } from "../types/item";
import {
    filterByCategory,
    getCategories,
    searchItems,
    sortByRating,
} from "../utils/ranking";

export default function HomeScreen() {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RankingItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<RankingItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

  const loadStoredItems = async () => {
    try {
      setError("");
      setItems(await loadItems());
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load your rankings. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoredItems();
  }, []);

  const categories = useMemo(() => getCategories(items), [items]);
  const rankedItems = useMemo(() => {
    const categoryItems = filterByCategory(items, selectedCategory);
    return sortByRating(searchItems(categoryItems, searchText));
  }, [items, searchText, selectedCategory]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const handleAddItem = async (name: string, category: string, rating: number, notes: string) => {
    try {
      const savedItem = await createItem({ name, category, rating, notes });
      setItems((currentItems) => [...currentItems, savedItem]);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      Alert.alert("Save failed", "The ranking could not be saved. Check that the API is running.");
    }
  };

  const handleEditItem = async (name: string, category: string, rating: number, notes: string) => {
    if (!editingItem) return;

    try {
      const savedItem = await updateItem(editingItem.id, { name, category, rating, notes });
      setItems((currentItems) => currentItems.map((item) => item.id === savedItem.id ? savedItem : item));
      setEditingItem(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      Alert.alert("Save failed", "The ranking could not be saved.");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteItemFromApi(id);
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (deleteError) {
      console.error(deleteError);
      Alert.alert("Delete failed", "The ranking could not be deleted. Check that the API is running.");
    }
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
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={loadStoredItems} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headingBlock}>
            <Text style={styles.eyebrow}>PERSONAL RANKINGS</Text>
            <Text style={styles.title}>Rank Everything</Text>
            <Text style={styles.subtitle}>Keep your favorites in order.</Text>
          </View>
          {!showForm ? (
            <Pressable onPress={openAddForm} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          ) : null}
        </View>

        {showForm ? (
          <ItemForm
            onSave={editingItem ? handleEditItem : handleAddItem}
            onCancel={() => { setEditingItem(null); setShowForm(false); }}
            initialItem={editingItem ?? undefined}
            categories={categories}
          />
        ) : (
          <>
            <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
            <SearchBar value={searchText} onChangeText={setSearchText} />
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your rankings</Text>
              <Text style={styles.listCount}>{rankedItems.length} {rankedItems.length === 1 ? "item" : "items"}</Text>
            </View>
            <FlatList
              data={rankedItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={rankedItems.length === 0 ? styles.emptyList : styles.list}
              renderItem={({ item, index }) => (
                <ItemCard item={item} rank={index + 1} onDelete={() => setDeleteCandidate(item)} onEdit={openEditForm} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>{items.length === 0 ? "🏆" : "⌕"}</Text>
                  <Text style={styles.emptyTitle}>{items.length === 0 ? "No rankings yet" : "No matching rankings"}</Text>
                  <Text style={styles.emptyText}>{items.length === 0 ? "Add your first item to start ranking anything you choose." : "Try a different search or category filter."}</Text>
                  {items.length === 0 ? <Pressable onPress={openAddForm} style={styles.emptyButton}><Text style={styles.emptyButtonText}>+ Add your first item</Text></Pressable> : null}
                </View>
              }
            />
          </>
        )}
      </View>

      <Modal visible={deleteCandidate !== null} transparent animationType="fade" onRequestClose={() => setDeleteCandidate(null)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmEyebrow}>REMOVE RANKING</Text>
            <Text style={styles.confirmTitle}>Delete this item?</Text>
            <Text style={styles.confirmText}>{deleteCandidate?.name} will be permanently removed from your rankings.</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setDeleteCandidate(null)} style={styles.confirmCancel}><Text style={styles.confirmCancelText}>Keep it</Text></Pressable>
              <Pressable onPress={async () => { if (deleteCandidate) await deleteItem(deleteCandidate.id); setDeleteCandidate(null); }} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Delete</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6f8" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, minHeight: 76 },
  headingBlock: { flex: 1, paddingRight: 12 },
  eyebrow: { color: "#637084", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 5 },
  title: { fontSize: 27, fontWeight: "bold", color: "#17202b" },
  subtitle: { fontSize: 14, marginTop: 3, color: "#697585" },
  addButton: { backgroundColor: "#111111", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, minWidth: 76, alignItems: "center" },
  addButtonText: { color: "#ffffff", fontWeight: "bold" },
  list: { paddingTop: 2, paddingBottom: 30 },
  emptyList: { flexGrow: 1 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 10 },
  listTitle: { color: "#17202b", fontSize: 17, fontWeight: "700" },
  listCount: { color: "#7a8492", fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { marginTop: 16, fontSize: 22, fontWeight: "bold" },
  emptyText: { marginTop: 8, textAlign: "center", fontSize: 15, lineHeight: 22 },
  emptyButton: { marginTop: 20, backgroundColor: "#17202b", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: "#ffffff", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  loadingText: { marginTop: 12 },
  errorTitle: { fontSize: 20, fontWeight: "bold" },
  errorText: { marginTop: 8, textAlign: "center" },
  retryButton: { marginTop: 20, backgroundColor: "#111111", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: "#ffffff" },
  confirmBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(18, 25, 35, 0.45)" },
  confirmDialog: { padding: 20, borderRadius: 18, backgroundColor: "#ffffff" },
  confirmEyebrow: { color: "#c75050", fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  confirmTitle: { marginTop: 8, color: "#17202b", fontSize: 21, fontWeight: "700" },
  confirmText: { marginTop: 8, color: "#697585", fontSize: 14, lineHeight: 20 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  confirmCancel: { flex: 1, alignItems: "center", paddingVertical: 12, borderWidth: 1, borderColor: "#dfe1e7", borderRadius: 10 },
  confirmCancelText: { color: "#4d647c", fontWeight: "700" },
  confirmDelete: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#c75050" },
  confirmDeleteText: { color: "#ffffff", fontWeight: "700" },
});
