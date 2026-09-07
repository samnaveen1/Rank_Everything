import { useEffect, useState } from "react";

import {
  Alert,
  Pressable,
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
  initialItem,
}: Props) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [category, setCategory] = useState(initialItem?.category ?? "");
  const [rating, setRating] = useState(
    initialItem ? String(initialItem.rating) : ""
  );
  const [notes, setNotes] = useState(initialItem?.notes ?? "");

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

      <TextInput
        value={category}
        onChangeText={setCategory}
        placeholder="Example: Movie, Mall, Restaurant..."
        style={styles.input}
      />

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
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dddddd",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 10,
  },

  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cccccc",
  },

  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111111",
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});