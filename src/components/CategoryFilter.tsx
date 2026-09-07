import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

type Props = {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
};

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const selected =
          category === selectedCategory;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.button,
              selected && styles.selectedButton,
            ]}
          >
            <Text
              style={[
                styles.text,
                selected && styles.selectedText,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 8,
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cccccc",
  },

  selectedButton: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  text: {
    fontSize: 14,
  },

  selectedText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});