import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export default function SearchBar({
  value,
  onChangeText,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by name, category, or notes"
        placeholderTextColor="#8a8f9b"
        style={styles.input}
        clearButtonMode="while-editing"
      />
      {value ? (
        <Pressable onPress={() => onChangeText("")} style={styles.clearButton}>
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dfe1e7",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  icon: {
    color: "#69707d",
    fontSize: 23,
    marginRight: 8,
  },

  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
  },

  clearButton: {
    paddingLeft: 10,
  },

  clearText: {
    color: "#69707d",
    fontSize: 22,
  },
});