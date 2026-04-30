// insights screen
import { useEffect, useMemo, useRef, useState } from "react";
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

// Curated distinct palette for donut segments
const DONUT_COLORS = ["#0F7A63", "#C88A22", "#B94A48", "#3B7DD8", "#8B5CF6", "#D97706"];

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
  const [visibleTooltipKey, setVisibleTooltipKey] = useState<string | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  const topSpends = summary?.topCategories ?? [];

  const recentExpenseFlow = useMemo(() => {
    return (transactions ?? [])
      .filter((item) => item.kind === "expense")
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
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
              {weeklyActivity.map((item, index) => {
                const incomeHeight = item.income > 0 ? Math.max(8, (item.income / weeklyMaxValue) * 92) : 2;
                const expenseHeight = item.expense > 0 ? Math.max(8, (item.expense / weeklyMaxValue) * 92) : 2;
                const selected = item.key === selectedDay?.key;
                const tooltipBottom = 24 + Math.max(incomeHeight, expenseHeight) + 10;
                const totalBars = weeklyActivity.length;

                // Align tooltip to avoid screen edges:
                // first 2 bars → left-align, last 2 bars → right-align, rest → center
                let tooltipStyle: object;
                if (index <= 1) {
                  tooltipStyle = { left: 0 };
                } else if (index >= totalBars - 2) {
                  tooltipStyle = { right: 0 };
                } else {
                  tooltipStyle = { left: "50%", transform: [{ translateX: -62 }] };
                }

                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedDayKey(item.key);
                      setVisibleTooltipKey(item.key);
                      if (tooltipTimerRef.current) {
                        clearTimeout(tooltipTimerRef.current);
                      }
                      tooltipTimerRef.current = setTimeout(() => {
                        setVisibleTooltipKey(null);
                      }, 1500);
                    }}
                    style={styles.chartColumn}
                  >
                    {visibleTooltipKey === item.key ? (
                      <View style={[styles.barTooltip, { bottom: tooltipBottom }, tooltipStyle]}>
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
          (() => {
            const total = topSpends.reduce((s, x) => s + x.amount, 0);
            return (
              <View style={styles.categoryViz}>
                {/* Segmented proportion strip */}
                <View style={styles.segmentStrip}>
                  {topSpends.map((item, i) => {
                    const pct = item.amount / total;
                    const color = DONUT_COLORS[i % DONUT_COLORS.length] ?? "#999";
                    const isFirst = i === 0;
                    const isLast = i === topSpends.length - 1;
                    return (
                      <View
                        key={item.category}
                        style={{
                          flex: pct,
                          height: "100%",
                          backgroundColor: color,
                          borderTopLeftRadius: isFirst ? 999 : 0,
                          borderBottomLeftRadius: isFirst ? 999 : 0,
                          borderTopRightRadius: isLast ? 999 : 0,
                          borderBottomRightRadius: isLast ? 999 : 0
                        }}
                      />
                    );
                  })}
                </View>

                {/* Legend grid */}
                <View style={styles.categoryLegendGrid}>
                  {topSpends.map((item, i) => {
                    const pct = item.amount / total;
                    const color = DONUT_COLORS[i % DONUT_COLORS.length] ?? "#999";
                    return (
                      <View key={item.category} style={styles.categoryLegendItem}>
                        <View style={styles.categoryLegendTop}>
                          <View style={[styles.categoryDot, { backgroundColor: color }]} />
                          <Text style={styles.categoryLegendName} numberOfLines={1}>{item.category}</Text>
                          <Text style={[styles.categoryLegendPct, { color }]}>{Math.round(pct * 100)}%</Text>
                        </View>
                        <Text style={styles.categoryLegendAmt} numberOfLines={1}>
                          {formatCurrency(item.amount, currency)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()
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
              <View key={item.id} style={styles.flowRow}>
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
    categoryViz: {
      gap: spacing.md
    },
    segmentStrip: {
      flexDirection: "row",
      height: 14,
      borderRadius: 999,
      overflow: "hidden",
      gap: 2
    },
    categoryLegendGrid: {
      gap: spacing.xs
    },
    categoryLegendItem: {
      gap: 2
    },
    categoryLegendTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    categoryDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      flexShrink: 0
    },
    categoryLegendName: {
      flex: 1,
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    categoryLegendPct: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm
    },
    categoryLegendAmt: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeXs,
      color: colors.textSecondary,
      paddingLeft: 18
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
