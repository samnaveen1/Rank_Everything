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
      style={styles.scrollView}
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
  scrollView: {
    flexGrow: 0,
    height: 52,
  },

  container: {
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },

  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7d9df",
    backgroundColor: "#ffffff",
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