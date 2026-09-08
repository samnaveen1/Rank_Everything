import { useEffect, useState } from "react";

import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Props = {
  onSave: (
    name: string,
    category: string,
    rating: number,
    notes: string
  ) => void;

  onCancel: () => void;
  categories: string[];
  initialItem?: {
    name: string;
    category: string;
    rating: number;
    notes: string;
  };
};

export default function ItemForm({
  onSave,
  onCancel,
  categories,
  initialItem,
}: Props) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [category, setCategory] = useState(initialItem?.category ?? "");
  const [rating, setRating] = useState(
    initialItem ? String(initialItem.rating) : ""
  );
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    setName(initialItem?.name ?? "");
    setCategory(initialItem?.category ?? "");
    setRating(initialItem ? String(initialItem.rating) : "");
    setNotes(initialItem?.notes ?? "");
  }, [initialItem]);

  const handleSave = () => {
    if (!rating.trim()) {
      Alert.alert("Invalid rating", "Please enter a rating between 0 and 10.");
      return;
    }

    const numericRating = Number(rating);

    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a name.");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Missing category", "Please enter a category.");
      return;
    }

    if (
      Number.isNaN(numericRating) ||
      numericRating < 0 ||
      numericRating > 10
    ) {
      Alert.alert("Invalid rating", "Rating must be between 0 and 10.");
      return;
    }

    onSave(
      name.trim(),
      category.trim(),
      numericRating,
      notes.trim()
    );
  };

  return (
    <View style={styles.form}>
      <Text style={styles.title}>
        {initialItem ? "Edit Ranking" : "Add New Ranking"}
      </Text>

      <Text style={styles.label}>
        What do you want to rank?
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Example: Interstellar"
        style={styles.input}
      />

      <Text style={styles.label}>
        Category
      </Text>

      {creatingCategory ? (
        <View style={styles.categoryInputRow}>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Example: Movie, Mall, Restaurant..."
            style={[styles.input, styles.categoryTextInput]}
            autoFocus
          />
          <Pressable
            onPress={() => {
              setCreatingCategory(false);
              setCategory("");
            }}
            style={styles.cancelCategoryButton}
          >
            <Text style={styles.cancelCategoryText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setShowCategoryPicker(true)}
            style={styles.selectInput}
          >
            <Text style={category ? styles.selectText : styles.placeholderText}>
              {category || "Select a category"}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>

          <Modal
            visible={showCategoryPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCategoryPicker(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Pressable style={styles.categorySheet} onPress={() => undefined}>
                <Text style={styles.sheetTitle}>Choose category</Text>
                <ScrollView style={styles.categoryOptions}>
                  {categories.filter((option) => option !== "All").map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setCategory(option);
                        setShowCategoryPicker(false);
                      }}
                      style={styles.categoryOption}
                    >
                      <Text style={styles.categoryOptionText}>{option}</Text>
                      {option === category ? <Text style={styles.checkmark}>✓</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  onPress={() => {
                    setCategory("");
                    setCreatingCategory(true);
                    setShowCategoryPicker(false);
                  }}
                  style={styles.newCategoryButton}
                >
                  <Text style={styles.newCategoryText}>+ Create new category</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}

      <Text style={styles.label}>
        Rating (0 - 10)
      </Text>

      <TextInput
        value={rating}
        onChangeText={setRating}
        placeholder="Example: 9.5"
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>
        Notes
      </Text>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="What did you think?"
        multiline
        style={[
          styles.input,
          styles.notesInput,
        ]}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 18,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e1e3e8",
    boxShadow: "0px 4px 12px rgba(28, 36, 48, 0.06)",
    elevation: 3,
  },

  title: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#17202b",
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#596170",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#dfe1e7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: "#17202b",
    backgroundColor: "#fbfbfc",
  },

  categoryInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  categoryTextInput: {
    flex: 1,
  },

  cancelCategoryButton: {
    paddingHorizontal: 8,
  },

  cancelCategoryText: {
    color: "#c75050",
    fontSize: 12,
  },

  selectInput: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#dfe1e7",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fbfbfc",
  },

  selectText: {
    color: "#17202b",
    fontSize: 16,
  },

  placeholderText: {
    color: "#8a8f9b",
    fontSize: 16,
  },

  chevron: {
    color: "#69707d",
    fontSize: 20,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(18, 25, 35, 0.45)",
  },

  categorySheet: {
    maxHeight: "75%",
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
  },

  sheetTitle: {
    color: "#17202b",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  categoryOptions: {
    maxHeight: 260,
  },

  categoryOption: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f3",
  },

  categoryOptionText: {
    color: "#27313d",
    fontSize: 15,
  },

  checkmark: {
    color: "#2d7a59",
    fontSize: 18,
    fontWeight: "700",
  },

  newCategoryButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#17202b",
    alignItems: "center",
  },

  newCategoryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe1e7",
    alignItems: "center",
  },

  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#17202b",
    alignItems: "center",
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});