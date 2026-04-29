import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";
import { TransactionRow } from "../components/TransactionRow";
import { useSummary, useTransactions } from "../hooks/useTransactions";
import { usePreferences } from "../preferences";
import { spacing, typography, useAppTheme } from "../theme";
import { formatCurrency, getTimeGreeting } from "../utils/format";

export function HomeScreen() {
  const { colors } = useAppTheme();
  const { currency } = usePreferences();
  const styles = createStyles(colors);
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const [greeting, setGreeting] = useState(getTimeGreeting());

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [fade]);

  useEffect(() => {
    setGreeting(getTimeGreeting());

    const timer = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const recentTransactions = useMemo(() => (transactions ?? []).slice(0, 3), [transactions]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.title}>Your money at a glance</Text>
        </View>
      </View>

      <Animated.View style={[styles.hero, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }] }>
        <Text style={styles.heroLabel}>Current balance</Text>
        <Text style={styles.heroValue}>{summaryLoading ? "Loading..." : formatCurrency(summary?.balance ?? 0, currency)}</Text>
        <Text style={styles.heroHint}>Plan today, stress less tomorrow.</Text>
      </Animated.View>

      <View style={styles.kpiRow}>
        <Panel style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Income</Text>
          <Text style={styles.kpiValue}>{summaryLoading ? "..." : formatCurrency(summary?.monthlyIncome ?? 0, currency)}</Text>
        </Panel>
        <Panel style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Expenses</Text>
          <Text style={styles.kpiValue}>{summaryLoading ? "..." : formatCurrency(summary?.monthlyExpense ?? 0, currency)}</Text>
        </Panel>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent transactions</Text>
        <Text style={styles.sectionHint}>Latest activity</Text>
      </View>

      {transactionsLoading ? (
        <Panel>
          <Text style={styles.emptyState}>Loading transactions...</Text>
        </Panel>
      ) : recentTransactions.length > 0 ? (
        <View style={styles.list}>
          {recentTransactions.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <Panel>
          <Text style={styles.emptyState}>No transactions yet. Use Add to create your first entry.</Text>
        </Panel>
      )}
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start"
    },
    header: {
      gap: spacing.xxs,
      flex: 1
    },
    greeting: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    title: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeXl,
      color: colors.textPrimary
    },
    hero: {
      borderRadius: 24,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.xs
    },
    heroLabel: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    heroValue: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeDisplay,
      color: colors.textPrimary
    },
    heroHint: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    kpiRow: {
      flexDirection: "row",
      gap: spacing.md
    },
    kpiCard: {
      flex: 1,
      gap: spacing.xs
    },
    kpiLabel: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    kpiValue: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeLg,
      color: colors.textPrimary
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    sectionTitle: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeMd,
      color: colors.textPrimary
    },
    sectionHint: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    list: {
      gap: spacing.sm
    },
    emptyState: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    }
  });
