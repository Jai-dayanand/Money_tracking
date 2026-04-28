import { StyleSheet, Text, View } from "react-native";

import { Transaction } from "../types/transaction";
import { colors, spacing, typography } from "../theme";
import { formatCurrency, formatShortDate } from "../utils/format";

type TransactionRowProps = {
  item: Transaction;
};

export function TransactionRow({ item }: TransactionRowProps) {
  const isExpense = item.kind === "expense";

  return (
    <View style={styles.row}>
      <View style={styles.leftBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {item.category} • {formatShortDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
        {isExpense ? "-" : "+"}
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  leftBlock: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xxs
  },
  title: {
    fontFamily: typography.familySemiBold,
    color: colors.textPrimary,
    fontSize: typography.sizeMd
  },
  meta: {
    fontFamily: typography.familyRegular,
    color: colors.textSecondary,
    fontSize: typography.sizeSm
  },
  amount: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeMd
  },
  expense: {
    color: colors.danger
  },
  income: {
    color: colors.accent
  }
});
