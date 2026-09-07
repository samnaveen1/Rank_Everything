import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RankingItem } from "../types/item";

type Props = {
  item: RankingItem;
  rank: number;
  onDelete: (id: string) => void;
  onEdit: (item: RankingItem) => void;
};

export default function ItemCard({
  item,
  rank,
  onDelete,
  onEdit,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>#{rank}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>

        <Text style={styles.category}>
          {item.category}
        </Text>

        {item.notes ? (
          <Text style={styles.notes}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.rating}>
          {item.rating.toFixed(1)} ⭐
        </Text>

        <Pressable
          onPress={() => onEdit(item)}
          style={styles.editButton}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },

  rankContainer: {
    justifyContent: "center",
    marginRight: 14,
  },

  rank: {
    fontSize: 20,
    fontWeight: "bold",
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  category: {
    marginTop: 4,
    fontSize: 14,
  },

  notes: {
    marginTop: 6,
    fontSize: 13,
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  rating: {
    fontSize: 17,
    fontWeight: "bold",
  },

  deleteButton: {
    marginTop: 8,
  },

  editButton: {
    marginTop: 15,
  },

  editText: {
    color: "#111111",
  },

  deleteText: {
    color: "red",
  },
});