import {
    Linking,
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
  grid?: boolean;
};

export default function ItemCard({
  item,
  rank,
  onDelete,
  onEdit,
  grid = false,
}: Props) {
  return (
    <View style={[styles.card, grid && styles.gridCard]}>
      <View style={styles.topRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        <View style={styles.nameRating}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.star}>★</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>

      {item.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
      ) : null}

      {item.mapLink ? (
        <Pressable onPress={() => Linking.openURL(item.mapLink ?? "")} style={styles.mapButton}>
          <Text style={styles.mapText}>⌖ Open map</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
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
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e1e3e8",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 3,
  },

  gridCard: {
    flex: 1,
    marginHorizontal: 5,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#69707d",
  },

  nameRating: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
    color: "#171a21",
    marginRight: 10,
  },

  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
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

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e8f4f5",
  },

  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e6b70",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  notes: {
    fontSize: 13,
    lineHeight: 18,
    color: "#69707d",
    marginBottom: 8,
  },

  mapButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingVertical: 2,
  },

  mapText: {
    color: "#1e6b70",
    fontSize: 12,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f2f5",
  },

  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe1e7",
    alignItems: "center",
  },

  editText: {
    color: "#4d647c",
    fontSize: 13,
    fontWeight: "600",
  },

  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fdf0f0",
    alignItems: "center",
  },

  deleteText: {
    color: "#c75050",
    fontSize: 13,
    fontWeight: "600",
  },
});
