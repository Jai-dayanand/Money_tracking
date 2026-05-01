import { Feather } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { TransactionRow } from "../components/TransactionRow";
import { useTransactions } from "../hooks/useTransactions";
import { spacing, typography, useAppTheme } from "../theme";
import { Transaction, TransactionKind } from "../types/transaction";
import { formatCurrency } from "../utils/format";

type Filter = "all" | "income" | "expense";
type ViewMode = "list" | "calendar";

export function TransactionsScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { data, isLoading, refetch } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);

  const filteredData = useMemo(() => {
    if (!data) {
      return [];
    }

    if (filter === "all") {
      return data;
    }

    return data.filter((item) => item.kind === filter);
  }, [data, filter]);

  // Build calendar marked dates with transaction counts
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    if (data) {
      data.forEach((transaction) => {
        const dateKey = transaction.date;

        if (!marked[dateKey]) {
          marked[dateKey] = {
            marked: true,
            dotColor: transaction.kind === "income" ? colors.accent : colors.warn,
            transactions: []
          };
        }

        if (Array.isArray(marked[dateKey].transactions)) {
          marked[dateKey].transactions.push(transaction);
        }
      });
    }

    // Mark selected date
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = colors.accent;
    }

    return marked;
  }, [data, selectedDate, colors]);

  const transactionsForSelectedDate = useMemo(() => {
    if (!selectedDate || !markedDates[selectedDate]) {
      return [];
    }

    const transactions = markedDates[selectedDate].transactions || [];

    if (filter === "all") {
      return transactions;
    }

    return transactions.filter((item: Transaction) => item.kind === filter);
  }, [selectedDate, markedDates, filter]);

  const handleDatePress = (date: DateData) => {
    setSelectedDate(date.dateString);
    setDetailModalVisible(true);
  };

  const totalForDate = useMemo(() => {
    const income = transactionsForSelectedDate
      .filter((t) => t.kind === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactionsForSelectedDate
      .filter((t) => t.kind === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense };
  }, [transactionsForSelectedDate]);

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Transaction history</Text>
            <Text style={styles.subtitle}>Clear records, easy tracking.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          >
            <Feather
              name={viewMode === "list" ? "calendar" : "list"}
              size={18}
              color={colors.accent}
            />
          </Pressable>
        </View>
      </View>

      {viewMode === "calendar" ? (
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDatePress}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              textSectionTitleDisabledColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.accent,
              selectedDayTextColor: colors.surface,
              todayTextColor: colors.accent,
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.textSecondary,
              dotColor: colors.accent,
              selectedDotColor: colors.surface,
              arrowColor: colors.accent,
              disabledArrowColor: colors.textSecondary,
              monthTextColor: colors.textPrimary,
              indicatorColor: colors.accent,
              "stylesheet.calendar.basic": {
                container: {
                  backgroundColor: colors.surface
                }
              },
              "stylesheet.day.basic": {
                text: {
                  marginTop: 4,
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textPrimary,
                  fontFamily: typography.familySemiBold
                }
              }
            }}
            enableSwipeMonths
          />
        </View>
      ) : (
        <>
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
        </>
      )}

      <Modal visible={isDetailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Transactions - {selectedDate}</Text>
              <Pressable accessibilityRole="button" onPress={() => setDetailModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            {transactionsForSelectedDate.length === 0 ? (
              <View style={styles.emptyDetail}>
                <Text style={styles.emptyText}>No transactions on this date.</Text>
              </View>
            ) : (
              <>
                <View style={styles.detailSummary}>
                  <View style={styles.detailSummaryItem}>
                    <Text style={styles.detailSummaryLabel}>Income</Text>
                    <Text style={[styles.detailSummaryValue, { color: colors.accent }]}>
                      +{formatCurrency(totalForDate.income, "USD")}
                    </Text>
                  </View>
                  <View style={styles.detailSummaryItem}>
                    <Text style={styles.detailSummaryLabel}>Expense</Text>
                    <Text style={[styles.detailSummaryValue, { color: colors.warn }]}>
                      -{formatCurrency(totalForDate.expense, "USD")}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.detailList} showsVerticalScrollIndicator={false}>
                  {transactionsForSelectedDate.map((transaction, index) => (
                    <View key={transaction.id} style={[styles.detailItem, index !== transactionsForSelectedDate.length - 1 && styles.detailItemBorder]}>
                      <View style={styles.detailItemLeft}>
                        <Text style={styles.detailItemCategory}>{transaction.category}</Text>
                        {transaction.notes && <Text style={styles.detailItemNote}>{transaction.notes}</Text>}
                      </View>
                      <Text style={[styles.detailItemAmount, { color: transaction.kind === "income" ? colors.accent : colors.warn }]}>
                        {transaction.kind === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount, "USD")}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );

  function FilterChip({ label, active, onPress }: FilterChipProps) {
    return (
      <Pressable accessibilityRole="button" style={[styles.chip, active ? styles.chipActive : undefined]} onPress={onPress}>
        <Text style={[styles.chipText, active ? styles.chipTextActive : undefined]}>{label}</Text>
      </Pressable>
    );
  }
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    header: {
      gap: spacing.xxs,
      marginBottom: spacing.md
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start"
    },
    title: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeXl,
      color: colors.textPrimary
    },
    subtitle: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary,
      marginTop: spacing.xxs
    },
    viewToggle: {
      padding: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.border
    },
    calendarContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: spacing.lg,
      paddingBottom: 120
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
      fontSize: typography.sizeSm,
      textAlign: "center"
    },
    detailModal: {
      flex: 1,
      marginTop: 60,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg
    },
    detailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailTitle: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeMd,
      color: colors.textPrimary
    },
    emptyDetail: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    detailSummary: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailSummaryItem: {
      flex: 1,
      gap: spacing.xxs
    },
    detailSummaryLabel: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    detailSummaryValue: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeMd,
      color: colors.textPrimary
    },
    detailList: {
      flex: 1
    },
    detailItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm
    },
    detailItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailItemLeft: {
      flex: 1,
      gap: spacing.xxs
    },
    detailItemCategory: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    detailItemNote: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    detailItemAmount: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeSm,
      marginLeft: spacing.md
    }
  });
