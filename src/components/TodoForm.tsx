import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Todo } from "../types/todo";

type Props = {
  initialTodo?: Todo | null;
  onSave: (title: string, details: string) => void;
  onCancel: () => void;
};

export default function TodoForm({ initialTodo, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialTodo?.title ?? "");
  const [details, setDetails] = useState(initialTodo?.details ?? "");

  useEffect(() => {
    setTitle(initialTodo?.title ?? "");
    setDetails(initialTodo?.details ?? "");
  }, [initialTodo]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing task", "Please enter a task title.");
      return;
    }

    onSave(title.trim(), details.trim());
  };

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{initialTodo ? "Edit task" : "New task"}</Text>
      <Text style={styles.label}>Task</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What needs to be done?"
        placeholderTextColor="#89939f"
        style={styles.input}
        autoFocus
      />
      <Text style={styles.label}>Details <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder="Add a little context"
        placeholderTextColor="#89939f"
        multiline
        style={[styles.input, styles.detailsInput]}
      />
      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>{initialTodo ? "Save changes" : "Add task"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 18, borderRadius: 18, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dfe6e3" },
  title: { color: "#17232a", fontSize: 21, fontWeight: "700", marginBottom: 14 },
  label: { color: "#5d6968", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  optional: { color: "#9aa3aa", fontWeight: "400" },
  input: { borderWidth: 1, borderColor: "#dce3e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: "#17232a", fontSize: 15, backgroundColor: "#fbfcfc" },
  detailsInput: { minHeight: 82, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#dce3e1" },
  cancelText: { color: "#52615f", fontWeight: "700" },
  saveButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#1e6b70" },
  saveText: { color: "#ffffff", fontWeight: "700" },
});
