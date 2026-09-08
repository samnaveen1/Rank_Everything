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

        <View style={styles.categoryBadge}>
          <Text style={styles.category}>{item.category}</Text>
        </View>

        {item.notes ? (
          <Text style={styles.notes}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        <View style={styles.ratingBadge}>
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.star}>★</Text>
        </View>

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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e1e3e8",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    boxShadow: "0px 3px 8px rgba(28, 36, 48, 0.05)",
    elevation: 2,
  },

  rankContainer: {
    justifyContent: "center",
    width: 38,
    marginRight: 10,
  },

  rank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#69707d",
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#171a21",
  },

  category: {
    fontSize: 12,
    color: "#596170",
  },

  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#f0f2f5",
  },

  notes: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#69707d",
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginLeft: 10,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#fff7d6",
  },

  rating: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#7a5a00",
  },

  star: {
    marginLeft: 4,
    color: "#e7ad19",
    fontSize: 13,
  },

  deleteButton: {
    marginTop: 8,
  },

  editButton: {
    marginTop: 12,
    paddingVertical: 2,
  },

  editText: {
    color: "#4d647c",
    fontSize: 12,
    fontWeight: "600",
  },

  deleteText: {
    color: "#c75050",
    fontSize: 12,
  },
});