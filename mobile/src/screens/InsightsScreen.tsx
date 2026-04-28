import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { useSummary, useTransactions } from "../hooks/useTransactions";
import { colors, spacing, typography } from "../theme";
import { formatCurrency, formatShortDate } from "../utils/format";

export function InsightsScreen() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();

  const topSpends = summary?.topCategories ?? [];

  const recentExpenseFlow = useMemo(() => {
    return (transactions ?? [])
      .filter((item) => item.kind === "expense")
      .slice(0, 5)
      .map((item) => ({
        date: formatShortDate(item.date),
        amount: item.amount
      }));
  }, [transactions]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Simple signals that help you spend smarter.</Text>
      </View>

      <Panel>
        <Text style={styles.cardTitle}>Monthly snapshot</Text>
        {summaryLoading ? (
          <Text style={styles.placeholder}>Loading summary...</Text>
        ) : (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Income</Text>
              <Text style={styles.snapshotValue}>{formatCurrency(summary?.monthlyIncome ?? 0)}</Text>
            </View>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Expense</Text>
              <Text style={styles.snapshotValue}>{formatCurrency(summary?.monthlyExpense ?? 0)}</Text>
            </View>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Balance</Text>
              <Text style={styles.snapshotValue}>{formatCurrency(summary?.balance ?? 0)}</Text>
            </View>
          </View>
        )}
      </Panel>

      <Panel>
        <Text style={styles.cardTitle}>Top spending categories</Text>
        {summaryLoading ? (
          <Text style={styles.placeholder}>Loading category spend...</Text>
        ) : topSpends.length > 0 ? (
          <View style={styles.barsWrap}>
            {topSpends.map((item) => {
              const max = topSpends[0]?.amount ?? 1;
              const ratio = item.amount / max;

              return (
                <View key={item.category} style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>{item.category}</Text>
                    <Text style={styles.barAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(8, ratio * 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.placeholder}>No expense data yet.</Text>
        )}
      </Panel>

      <Panel>
        <Text style={styles.cardTitle}>Recent expense flow</Text>
        {transactionsLoading ? (
          <Text style={styles.placeholder}>Loading flow...</Text>
        ) : recentExpenseFlow.length > 0 ? (
          <View style={styles.flowList}>
            {recentExpenseFlow.map((item) => (
              <View key={`${item.date}-${item.amount}`} style={styles.flowRow}>
                <Text style={styles.flowDate}>{item.date}</Text>
                <Text style={styles.flowAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>Add transactions to see your trend.</Text>
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xxs
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
  cardTitle: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  placeholder: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  snapshotRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  snapshotBlock: {
    flex: 1,
    gap: spacing.xxs
  },
  snapshotLabel: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeXs,
    color: colors.textSecondary
  },
  snapshotValue: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeMd,
    color: colors.textPrimary
  },
  barsWrap: {
    gap: spacing.sm
  },
  barItem: {
    gap: spacing.xxs
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  barLabel: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeSm,
    color: colors.textPrimary
  },
  barAmount: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.chartBase,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent
  },
  flowList: {
    gap: spacing.xs
  },
  flowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs
  },
  flowDate: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  flowAmount: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeSm,
    color: colors.textPrimary
  }
});
