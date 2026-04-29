import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { useSummary, useTransactions } from "../hooks/useTransactions";
import { usePreferences } from "../preferences";
import { spacing, typography, useAppTheme } from "../theme";
import { Transaction } from "../types/transaction";
import { formatCurrency, formatShortDate } from "../utils/format";

type ActivityPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
};

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseTransactionDate(value: string) {
  const plainDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (plainDateMatch) {
    return new Date(Number(plainDateMatch[1]), Number(plainDateMatch[2]) - 1, Number(plainDateMatch[3]));
  }

  return new Date(value);
}

function buildLastSevenDaysActivity(items: Transaction[]): ActivityPoint[] {
  const now = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));

    return {
      key: toLocalDateKey(date),
      label: weekdayShort[date.getDay()] ?? "",
      income: 0,
      expense: 0,
      incomeCount: 0,
      expenseCount: 0
    };
  });

  const mapByDate = new Map(days.map((day) => [day.key, day]));

  items.forEach((item) => {
    const parsed = parseTransactionDate(item.date);

    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    const day = mapByDate.get(toLocalDateKey(parsed));

    if (!day) {
      return;
    }

    if (item.kind === "income") {
      day.income += item.amount;
      day.incomeCount += 1;
    } else {
      day.expense += item.amount;
      day.expenseCount += 1;
    }
  });

  return days;
}

function formatDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);

  if (!year || !month || !day) {
    return dayKey;
  }

  return formatShortDate(new Date(year, month - 1, day).toISOString());
}

export function InsightsScreen() {
  const { colors } = useAppTheme();
  const { currency } = usePreferences();
  const styles = createStyles(colors);
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

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

  const weeklyActivity = useMemo(() => buildLastSevenDaysActivity(transactions ?? []), [transactions]);

  useEffect(() => {
    if (weeklyActivity.length === 0) {
      setSelectedDayKey(null);
      return;
    }

    setSelectedDayKey((current) => {
      if (current && weeklyActivity.some((item) => item.key === current)) {
        return current;
      }

      return weeklyActivity[weeklyActivity.length - 1]?.key ?? null;
    });
  }, [weeklyActivity]);

  const selectedDay = useMemo(() => {
    return weeklyActivity.find((item) => item.key === selectedDayKey) ?? weeklyActivity[weeklyActivity.length - 1];
  }, [selectedDayKey, weeklyActivity]);

  const hasWeeklyActivity = useMemo(() => {
    return weeklyActivity.some((item) => item.income > 0 || item.expense > 0);
  }, [weeklyActivity]);

  const weeklyMaxValue = useMemo(() => {
    return Math.max(
      1,
      ...weeklyActivity.map((item) => item.income),
      ...weeklyActivity.map((item) => item.expense)
    );
  }, [weeklyActivity]);

  const monthlyIncome = summary?.monthlyIncome ?? 0;
  const monthlyExpense = summary?.monthlyExpense ?? 0;
  const expenseRatio = monthlyIncome > 0 ? Math.min(1, monthlyExpense / monthlyIncome) : monthlyExpense > 0 ? 1 : 0;
  const ratioColor = monthlyExpense > monthlyIncome ? colors.danger : colors.accent;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Visual signals to track your money better.</Text>
      </View>

      <Panel>
        <Text style={styles.cardTitle}>Monthly snapshot</Text>
        {summaryLoading ? (
          <Text style={styles.placeholder}>Loading summary...</Text>
        ) : (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Income</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.snapshotValue}>
                {formatCurrency(monthlyIncome, currency)}
              </Text>
            </View>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Expense</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.snapshotValue}>
                {formatCurrency(monthlyExpense, currency)}
              </Text>
            </View>
            <View style={styles.snapshotBlock}>
              <Text style={styles.snapshotLabel}>Balance</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.snapshotValue}>
                {formatCurrency(summary?.balance ?? 0, currency)}
              </Text>
            </View>
          </View>
        )}
      </Panel>

      <Panel>
        <Text style={styles.cardTitle}>Spending ratio</Text>
        {summaryLoading ? (
          <Text style={styles.placeholder}>Loading ratio...</Text>
        ) : (
          <>
            <View style={styles.ratioTrack}>
              <View style={[styles.ratioFill, { width: `${Math.max(3, expenseRatio * 100)}%`, backgroundColor: ratioColor }]} />
            </View>
            <View style={styles.ratioRow}>
              <Text style={styles.ratioText}>
                Spent {formatCurrency(monthlyExpense, currency)} of {formatCurrency(monthlyIncome, currency)} income
              </Text>
              <Text style={[styles.ratioPercent, { color: ratioColor }]}>{Math.round(expenseRatio * 100)}%</Text>
            </View>
          </>
        )}
      </Panel>

      <Panel>
        <Text style={styles.cardTitle}>7-day activity</Text>
        <Text style={styles.sectionHint}>Tap a day to inspect exact income/expense values.</Text>
        {transactionsLoading ? (
          <Text style={styles.placeholder}>Loading activity...</Text>
        ) : hasWeeklyActivity ? (
          <>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
            <View style={styles.chartArea}>
              {weeklyActivity.map((item) => {
                const incomeHeight = item.income > 0 ? Math.max(8, (item.income / weeklyMaxValue) * 92) : 2;
                const expenseHeight = item.expense > 0 ? Math.max(8, (item.expense / weeklyMaxValue) * 92) : 2;
                const selected = item.key === selectedDay?.key;
                const tooltipBottom = 24 + Math.max(incomeHeight, expenseHeight) + 10;

                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => setSelectedDayKey(item.key)}
                    style={styles.chartColumn}
                  >
                    {selected ? (
                      <View style={[styles.barTooltip, { bottom: tooltipBottom }]}>
                        <Text style={styles.barTooltipDate}>{formatDayLabel(item.key)}</Text>
                        <Text style={styles.barTooltipIncome}>In {formatCurrency(item.income, currency)}</Text>
                        <Text style={styles.barTooltipExpense}>Out {formatCurrency(item.expense, currency)}</Text>
                      </View>
                    ) : null}
                    <View style={styles.barPair}>
                      <View style={[styles.barBase, styles.barIncome, { height: incomeHeight }]} />
                      <View style={[styles.barBase, styles.barExpense, { height: expenseHeight }]} />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Add transactions to generate this chart.</Text>
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
                    <Text style={styles.barAmount} numberOfLines={1}>
                      {formatCurrency(item.amount, currency)}
                    </Text>
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
                <Text style={styles.flowAmount}>{formatCurrency(item.amount, currency)}</Text>
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

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
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
      marginBottom: spacing.xs
    },
    sectionHint: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary,
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
      color: colors.textPrimary,
      flexShrink: 1
    },
    ratioTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.chartBase,
      overflow: "hidden"
    },
    ratioFill: {
      height: "100%",
      borderRadius: 999
    },
    ratioRow: {
      marginTop: spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    ratioText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary,
      flex: 1
    },
    ratioPercent: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeMd
    },
    legendRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.sm
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 999
    },
    legendText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    chartArea: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "stretch",
      height: 146,
      gap: spacing.xs,
      overflow: "visible"
    },
    chartColumn: {
      flex: 1,
      position: "relative",
      borderRadius: 10,
      alignItems: "center",
      paddingVertical: spacing.xs,
      paddingHorizontal: 2,
      overflow: "visible"
    },
    barPair: {
      width: "100%",
      height: 102,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      gap: 4
    },
    barBase: {
      width: 8,
      borderRadius: 999,
      minHeight: 2
    },
    barIncome: {
      backgroundColor: colors.accent
    },
    barExpense: {
      backgroundColor: colors.danger
    },
    chartLabel: {
      marginTop: spacing.xxs,
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    barTooltip: {
      position: "absolute",
      left: "50%",
      transform: [{ translateX: -62 }],
      width: 124,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: 6,
      paddingHorizontal: 8,
      gap: 2,
      zIndex: 10
    },
    barTooltipDate: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeXs,
      color: colors.textPrimary
    },
    barTooltipIncome: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.accent
    },
    barTooltipExpense: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.danger
    },
    barsWrap: {
      gap: spacing.sm
    },
    barItem: {
      gap: spacing.xxs
    },
    barLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    barLabel: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textPrimary,
      flex: 1
    },
    barAmount: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textSecondary,
      maxWidth: "55%"
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
