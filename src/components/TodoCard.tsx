import { Pressable, StyleSheet, Text, View } from "react-native";
import { Todo } from "../types/todo";

type Props = {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: Props) {
  return (
    <View style={[styles.card, todo.completed && styles.completedCard]}>
      <Pressable onPress={() => onToggle(todo)} style={[styles.checkbox, todo.completed && styles.checked]}>
        {todo.completed ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.title, todo.completed && styles.completedTitle]}>{todo.title}</Text>
        {todo.details ? <Text style={styles.details}>{todo.details}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => onEdit(todo)}><Text style={styles.edit}>Edit</Text></Pressable>
        <Pressable onPress={() => onDelete(todo)}><Text style={styles.delete}>Delete</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: "#dfe6e3", backgroundColor: "#ffffff" },
  completedCard: { backgroundColor: "#f3f7f5" },
  checkbox: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 7, borderWidth: 1.5, borderColor: "#93a29f" },
  checked: { borderColor: "#1e6b70", backgroundColor: "#1e6b70" },
  check: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  content: { flex: 1 },
  title: { color: "#17232a", fontSize: 16, fontWeight: "700" },
  completedTitle: { color: "#77827f", textDecorationLine: "line-through" },
  details: { color: "#74817f", fontSize: 13, lineHeight: 18, marginTop: 5 },
  actions: { alignItems: "flex-end", gap: 8 },
  edit: { color: "#1e6b70", fontSize: 12, fontWeight: "700" },
  delete: { color: "#c75050", fontSize: 12 },
});
