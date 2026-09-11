import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import TodoCard from "../components/TodoCard";
import TodoForm from "../components/TodoForm";
import { createTodo, deleteTodo as deleteTodoFromApi, loadTodos, updateTodo } from "../services/api";
import { Todo } from "../types/todo";

export default function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Todo | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [error, setError] = useState("");

  const refreshTodos = async () => {
    try {
      setError("");
      setTodos(await loadTodos());
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load your tasks. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshTodos(); }, []);

  const visibleTodos = useMemo(
    () => showCompleted ? todos : todos.filter((todo) => !todo.completed),
    [showCompleted, todos],
  );
  const openCount = todos.filter((todo) => !todo.completed).length;

  const saveTodo = async (title: string, details: string) => {
    try {
      if (editingTodo) {
        const savedTodo = await updateTodo(editingTodo.id, { title, details });
        setTodos((currentTodos) => currentTodos.map((todo) => todo.id === savedTodo.id ? savedTodo : todo));
      } else {
        const savedTodo = await createTodo({ title, details });
        setTodos((currentTodos) => [savedTodo, ...currentTodos]);
      }
      setEditingTodo(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      Alert.alert("Save failed", "The task could not be saved.");
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const savedTodo = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((currentTodos) => currentTodos.map((currentTodo) => currentTodo.id === savedTodo.id ? savedTodo : currentTodo));
    } catch (toggleError) {
      console.error(toggleError);
      Alert.alert("Update failed", "The task status could not be updated.");
    }
  };

  const removeTodo = async (id: string) => {
    try {
      await deleteTodoFromApi(id);
      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
    } catch (deleteError) {
      console.error(deleteError);
      Alert.alert("Delete failed", "The task could not be deleted.");
    }
  };

  const openNewForm = () => { setEditingTodo(null); setShowForm(true); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading tasks...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorTitle}>Something went wrong</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={refreshTodos} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PERSONAL PLANNER</Text>
            <Text style={styles.title}>Todo list</Text>
            <Text style={styles.subtitle}>{openCount} open {openCount === 1 ? "task" : "tasks"}</Text>
          </View>
          <Pressable onPress={openNewForm} style={styles.addButton}><Text style={styles.addText}>＋ Add task</Text></Pressable>
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.sectionTitle}>Your tasks</Text>
          <Pressable onPress={() => setShowCompleted((value) => !value)} style={styles.filterButton}>
            <Text style={styles.filterText}>{showCompleted ? "All tasks" : "Open only"}</Text>
          </Pressable>
        </View>

        <FlatList
          data={visibleTodos}
          keyExtractor={(todo) => todo.id}
          contentContainerStyle={visibleTodos.length === 0 ? styles.emptyList : styles.list}
          renderItem={({ item }) => <TodoCard todo={item} onToggle={toggleTodo} onEdit={(todo) => { setEditingTodo(todo); setShowForm(true); }} onDelete={setDeleteCandidate} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>{showCompleted ? "Nothing planned yet" : "All tasks are done"}</Text><Text style={styles.muted}>{showCompleted ? "Add a task and keep your day moving." : "Nice work. You can show completed tasks again."}</Text><Pressable onPress={openNewForm} style={styles.emptyButton}><Text style={styles.emptyButtonText}>＋ Add your first task</Text></Pressable></View>}
        />
      </View>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.formBackdrop}><View style={styles.formSheet}><TodoForm initialTodo={editingTodo} onSave={saveTodo} onCancel={() => { setEditingTodo(null); setShowForm(false); }} /></View></View>
      </Modal>

      <Modal visible={deleteCandidate !== null} transparent animationType="fade" onRequestClose={() => setDeleteCandidate(null)}>
        <View style={styles.formBackdrop}><View style={styles.confirm}><Text style={styles.eyebrow}>REMOVE TASK</Text><Text style={styles.confirmTitle}>Delete this task?</Text><Text style={styles.muted}>{deleteCandidate?.title} will be removed permanently.</Text><View style={styles.actions}><Pressable onPress={() => setDeleteCandidate(null)} style={styles.cancel}><Text>Keep it</Text></Pressable><Pressable onPress={async () => { if (deleteCandidate) await removeTodo(deleteCandidate.id); setDeleteCandidate(null); }} style={styles.delete}><Text style={styles.deleteText}>Delete</Text></Pressable></View></View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eef2f1" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#dce3e1" },
  eyebrow: { color: "#63716f", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  title: { color: "#17232a", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#75817f", fontSize: 14, marginTop: 4 },
  addButton: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 11, backgroundColor: "#1e6b70" },
  addText: { color: "#ffffff", fontWeight: "700" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18 },
  sectionTitle: { color: "#17232a", fontSize: 19, fontWeight: "700" },
  filterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dce3e1" },
  filterText: { color: "#52615f", fontSize: 12, fontWeight: "700" },
  list: { paddingBottom: 30 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#dcebea", color: "#1e6b70", textAlign: "center", textAlignVertical: "center", fontSize: 28, fontWeight: "700", overflow: "hidden" },
  emptyTitle: { color: "#17232a", fontSize: 20, fontWeight: "700", marginTop: 15 },
  muted: { color: "#75817f", fontSize: 14, textAlign: "center", marginTop: 7, lineHeight: 20 },
  emptyButton: { marginTop: 18, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: "#17232a" },
  emptyButtonText: { color: "#ffffff", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorTitle: { color: "#17232a", fontSize: 20, fontWeight: "700" },
  retry: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: "#17232a" },
  retryText: { color: "#ffffff", fontWeight: "700" },
  formBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18, 25, 35, 0.42)" },
  formSheet: { padding: 12, backgroundColor: "#eef2f1", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  confirm: { margin: 22, padding: 20, borderRadius: 18, backgroundColor: "#ffffff" },
  confirmTitle: { color: "#17232a", fontSize: 21, fontWeight: "700", marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancel: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#dce3e1" },
  delete: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#c75050" },
  deleteText: { color: "#ffffff", fontWeight: "700" },
});
