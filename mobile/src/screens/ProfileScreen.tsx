import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useDeleteTransaction, useTransactions, useUpdateTransaction } from "../hooks/useTransactions";
import { usePreferences } from "../preferences";
import { spacing, typography, useAppTheme } from "../theme";
import { Transaction, TransactionKind } from "../types/transaction";
import { formatCurrency, formatShortDate } from "../utils/format";

type EditableRecord = {
  id: string;
  mode: TransactionKind;
  amount: string;
  category: string;
  note: string;
  date: string;
};

function normalizeDate(value: string) {
  return value.length >= 10 ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function toEditableRecord(item: Transaction): EditableRecord {
  return {
    id: item.id,
    mode: item.kind,
    amount: String(item.amount),
    category: item.category,
    note: item.notes ?? "",
    date: normalizeDate(item.date)
  };
}


export function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = createStyles(colors);
  const { currency, currencyOptions, setCurrency } = usePreferences();
  const { data: records, isLoading } = useTransactions();
  const deleteMutation = useDeleteTransaction();
  const updateMutation = useUpdateTransaction();

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [query, setQuery] = useState("");

  const [isManageVisible, setManageVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EditableRecord | null>(null);
  const [editError, setEditError] = useState("");

  const activeCurrency = useMemo(() => {
    return currencyOptions.find((item) => item.code === currency);
  }, [currency, currencyOptions]);

  const filteredCurrencies = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return currencyOptions;
    }

    return currencyOptions.filter((item) => {
      return item.code.toLowerCase().includes(term) || item.label.toLowerCase().includes(term);
    });
  }, [currencyOptions, query]);

  const onSelectCurrency = (code: string) => {
    setCurrency(code);
    setPickerVisible(false);
    setQuery("");
  };

  const onDeleteRecord = async (transactionId: string) => {
    await deleteMutation.mutateAsync(transactionId);
  };

  const onSaveEdit = async () => {
    if (!editingRecord) {
      return;
    }

    setEditError("");

    const amount = Number(editingRecord.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Amount must be greater than zero.");
      return;
    }

    if (editingRecord.category.trim().length < 2) {
      setEditError("Category must be at least 2 characters.");
      return;
    }

    await updateMutation.mutateAsync({
      transactionId: editingRecord.id,
      payload: {
        title: editingRecord.category.trim(),
        amount,
        category: editingRecord.category.trim(),
        date: editingRecord.date,
        kind: editingRecord.mode,
        notes: editingRecord.note.trim() ? editingRecord.note.trim() : undefined,
        isFixed: false
      }
    });

    setEditingRecord(null);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Personalize your default settings.</Text>
      </View>

      <Panel style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <Text style={styles.sectionHint}>Select how balances and amounts are displayed.</Text>

        <Pressable accessibilityRole="button" style={styles.dropdownTrigger} onPress={() => setPickerVisible(true)}>
          <View style={styles.dropdownValueWrap}>
            <Text style={styles.dropdownCode}>{currency}</Text>
            <Text style={styles.dropdownLabel}>{activeCurrency?.label ?? "Selected currency"}</Text>
          </View>
          <Feather name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />
        </Pressable>
      </Panel>

      <Panel style={styles.section}>
        <Text style={styles.sectionTitle}>Manage records</Text>
        <Text style={styles.sectionHint}>Edit or delete transactions from one place.</Text>
        <PrimaryButton disabled={isLoading || (records ?? []).length === 0} onPress={() => setManageVisible(true)}>Manage records</PrimaryButton>
      </Panel>

      <Panel style={styles.section}>
        <View style={styles.themePanelRow}>
          <View style={styles.themePanelLeft}>
            <Text style={styles.sectionTitle}>Theme</Text>
            <Text style={styles.sectionHint}>{isDark ? "Dark mode" : "Light mode"}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={[styles.themeToggleBtn, isDark ? styles.themeToggleBtnDark : undefined]}
            onPress={toggleTheme}
          >
            <Feather
              name={isDark ? "moon" : "sun"}
              size={16}
              color={isDark ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.themeToggleLabel, isDark ? styles.themeToggleLabelDark : undefined]}>
              {isDark ? "Dark" : "Light"}
            </Text>
          </Pressable>
        </View>
      </Panel>

      <Modal visible={isPickerVisible} animationType="fade" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={{ flex: 1 }}>
          <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPickerVisible(false)} />
          <View style={styles.modalBackdrop} pointerEvents="box-none">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select currency</Text>
                <Pressable accessibilityRole="button" onPress={() => setPickerVisible(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by code or name"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No currency found for your search.</Text>}
                renderItem={({ item }) => {
                  const active = item.code === currency;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.currencyRow, active ? styles.currencyRowActive : undefined]}
                      onPress={() => onSelectCurrency(item.code)}
                    >
                      <Text style={[styles.currencyCode, active ? styles.currencyCodeActive : undefined]}>{item.code}</Text>
                      <Text style={styles.currencyLabel}>{item.label}</Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isManageVisible} animationType="fade" transparent onRequestClose={() => setManageVisible(false)}>
        <View style={{ flex: 1 }}>
          <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setManageVisible(false)} />
          <View style={styles.modalBackdrop} pointerEvents="box-none">
            <View style={styles.modalCardLarge}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manage records</Text>
                <Pressable accessibilityRole="button" onPress={() => setManageVisible(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              {isLoading ? (
                <Text style={styles.placeholderText}>Loading records...</Text>
              ) : (records ?? []).length === 0 ? (
                <Text style={styles.placeholderText}>No records to manage yet.</Text>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.manageListContent}
                >
                  {(records ?? []).map((item) => (
                    <View key={item.id} style={styles.recordRow}>
                      <View style={styles.recordMeta}>
                        <Text style={styles.recordTitle} numberOfLines={1}>
                          {item.category}
                        </Text>
                        <Text style={styles.recordSub} numberOfLines={1}>
                          {formatShortDate(item.date)} • {item.kind === "expense" ? "Expense" : "Income"}
                        </Text>
                      </View>
                      <Text style={styles.recordAmount}>{formatCurrency(item.amount, currency)}</Text>
                      <View style={styles.rowActions}>
                        <Pressable
                          accessibilityRole="button"
                          style={styles.actionEdit}
                          onPress={() => {
                            setEditError("");
                            setEditingRecord(toEditableRecord(item));
                          }}
                        >
                          <Text style={styles.actionEditText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          style={styles.actionDelete}
                          disabled={deleteMutation.isPending}
                          onPress={() => void onDeleteRecord(item.id)}
                        >
                          <Text style={styles.actionDeleteText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(editingRecord)} animationType="fade" transparent onRequestClose={() => setEditingRecord(null)}>
        <View style={{ flex: 1 }}>
          <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setEditingRecord(null)} />
          <View style={styles.modalBackdrop} pointerEvents="box-none">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit record</Text>
                <Pressable accessibilityRole="button" onPress={() => setEditingRecord(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              {editingRecord ? (
                <View style={styles.editForm}>
                  <View style={styles.modeRow}>
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.modeChip, editingRecord.mode === "expense" ? styles.modeChipActive : undefined]}
                      onPress={() => setEditingRecord((prev) => (prev ? { ...prev, mode: "expense" } : prev))}
                    >
                      <Text style={[styles.modeText, editingRecord.mode === "expense" ? styles.modeTextActive : undefined]}>Expense</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.modeChip, editingRecord.mode === "income" ? styles.modeChipActive : undefined]}
                      onPress={() => setEditingRecord((prev) => (prev ? { ...prev, mode: "income" } : prev))}
                    >
                      <Text style={[styles.modeText, editingRecord.mode === "income" ? styles.modeTextActive : undefined]}>Income</Text>
                    </Pressable>
                  </View>

                  <TextField
                    label="Amount"
                    value={editingRecord.amount}
                    onChangeText={(value) => setEditingRecord((prev) => (prev ? { ...prev, amount: value } : prev))}
                    keyboardType="decimal-pad"
                  />
                  <TextField
                    label="Category"
                    value={editingRecord.category}
                    onChangeText={(value) => setEditingRecord((prev) => (prev ? { ...prev, category: value } : prev))}
                  />
                  <TextField
                    label="Note (optional)"
                    value={editingRecord.note}
                    onChangeText={(value) => setEditingRecord((prev) => (prev ? { ...prev, note: value } : prev))}
                  />

                  {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

                  <PrimaryButton onPress={() => void onSaveEdit()} loading={updateMutation.isPending}>
                    Save changes
                  </PrimaryButton>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
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
    section: {
      gap: spacing.sm
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
    themePanelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    themePanelLeft: {
      gap: 2,
      flex: 1
    },
    themeToggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm
    },
    themeToggleBtnDark: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    themeToggleLabel: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    themeToggleLabelDark: {
      color: colors.accent
    },
    dropdownTrigger: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    dropdownValueWrap: {
      flex: 1,
      gap: 2
    },
    dropdownCode: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    dropdownLabel: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    dropdownArrow: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeMd,
      color: colors.textSecondary,
      marginLeft: spacing.sm
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg
    },
    modalCard: {
      maxHeight: "82%",
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm
    },
    modalCardLarge: {
      maxHeight: "86%",
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm
    },
    manageListContent: {
      gap: spacing.sm
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    modalTitle: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeMd,
      color: colors.textPrimary
    },
    closeText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textPrimary,
      backgroundColor: colors.panel
    },
    listContent: {
      gap: spacing.xs,
      paddingBottom: spacing.xs
    },
    emptyText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: spacing.md
    },
    currencyRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.panel,
      gap: 2
    },
    currencyRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    currencyCode: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    currencyCodeActive: {
      color: colors.accent
    },
    currencyLabel: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    placeholderText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    manageListContent: {
      gap: spacing.sm,
      paddingBottom: spacing.sm
    },
    recordRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.panel,
      padding: spacing.sm,
      gap: spacing.xs
    },
    recordMeta: {
      gap: 2
    },
    recordTitle: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    recordSub: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeXs,
      color: colors.textSecondary
    },
    recordAmount: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    rowActions: {
      flexDirection: "row",
      gap: spacing.xs
    },
    actionEdit: {
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface
    },
    actionEditText: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeXs,
      color: colors.textPrimary
    },
    actionDelete: {
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface
    },
    actionDeleteText: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeXs,
      color: colors.danger
    },
    editForm: {
      gap: spacing.sm
    },
    modeRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    modeChip: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      paddingVertical: spacing.sm,
      alignItems: "center"
    },
    modeChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    modeText: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    modeTextActive: {
      color: colors.accent
    },
    errorText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.danger
    }
  });
