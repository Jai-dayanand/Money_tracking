import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { TransactionRow } from "../components/TransactionRow";
import { useTransactions } from "../hooks/useTransactions";
import { Transaction } from "../types/transaction";
import { colors, spacing, typography } from "../theme";

type Filter = "all" | "income" | "expense";

export function TransactionsScreen() {
  const { data, isLoading, refetch } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");

  const filteredData = useMemo(() => {
    if (!data) {
      return [];
    }

    if (filter === "all") {
      return data;
    }

    return data.filter((item) => item.kind === filter);
  }, [data, filter]);

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction history</Text>
        <Text style={styles.subtitle}>Clear records, easy tracking.</Text>
      </View>

      <View style={styles.filters}>
        <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
        <FilterChip label="Income" active={filter === "income"} onPress={() => setFilter("income")} />
        <FilterChip label="Expenses" active={filter === "expense"} onPress={() => setFilter("expense")} />
      </View>

      {isLoading ? (
        <Panel>
          <Text style={styles.emptyText}>Loading transactions...</Text>
        </Panel>
      ) : (
        <FlatList<Transaction>
          data={filteredData}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <TransactionRow item={item} />}
          ListEmptyComponent={
            <Panel>
              <Text style={styles.emptyText}>No transactions for this filter. Pull to refresh or add a new one.</Text>
            </Panel>
          }
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable accessibilityRole="button" style={[styles.chip, active ? styles.chipActive : undefined]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xxs,
    marginBottom: spacing.md
  },
  title: {
    fontFamily: typography.familyBold,
    fontSize: typography.sizeXl,
    color: colors.textPrimary
  },
  subtitle: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  filters: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  chip: {
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent
  },
  chipText: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  chipTextActive: {
    color: colors.accent
  },
  listContent: {
    paddingBottom: 120
  },
  emptyText: {
    fontFamily: typography.familyRegular,
    color: colors.textSecondary,
    fontSize: typography.sizeSm
  }
});
