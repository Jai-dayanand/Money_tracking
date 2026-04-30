import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useCreateTransaction } from "../hooks/useTransactions";
import { spacing, typography, useAppTheme } from "../theme";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  category: z.string().min(2, "Category is required"),
  notes: z.string().max(140, "Keep notes under 140 chars").optional()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;
type EntryMode = "expense" | "income";

const expenseCategories = [
  "Food",
  "Transport",
  "Bills",
  "Rent",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Other Expense"
];

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Bonus",
  "Investment",
  "Gift",
  "Refund",
  "Other Income"
];

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function AddTransactionScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const mutation = useCreateTransaction();
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState<EntryMode>("expense");
  const [isCategoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const defaultValues = useMemo<TransactionFormValues>(
    () => ({
      amount: 0,
      category: "",
      notes: ""
    }),
    []
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues
  });

  const categoryOptions = mode === "expense" ? expenseCategories : incomeCategories;
  const selectedCategory = watch("category");

  useEffect(() => {
    setSuccessMessage("");
    const current = watch("category");

    if (!current || !categoryOptions.includes(current)) {
      setValue("category", categoryOptions[0] ?? "", { shouldValidate: true });
    }
  }, [mode, setValue, watch, categoryOptions]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage("");

    await mutation.mutateAsync({
      title: values.category.trim(),
      amount: values.amount,
      category: values.category.trim(),
      date: getLocalDateString(),
      kind: mode,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      isFixed: false
    });

    setSuccessMessage(`${mode === "expense" ? "Expense" : "Income"} saved successfully.`);
    reset({ ...defaultValues, category: categoryOptions[0] ?? "" });
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Quick add</Text>
        <Text style={styles.subtitle}>Minimal entry: amount, category, note.</Text>
      </View>

      <Panel style={styles.form}>
        <View style={styles.modeRow}>
          <Pressable
            accessibilityRole="button"
            style={[styles.modeChip, mode === "expense" ? styles.modeChipActive : undefined]}
            onPress={() => setMode("expense")}
          >
            <Text style={[styles.modeText, mode === "expense" ? styles.modeTextActive : undefined]}>Expense</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.modeChip, mode === "income" ? styles.modeChipActive : undefined]}
            onPress={() => setMode("income")}
          >
            <Text style={[styles.modeText, mode === "income" ? styles.modeTextActive : undefined]}>Income</Text>
          </Pressable>
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Amount"
              value={value ? String(value) : ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange } }) => (
            <View style={styles.categoryWrap}>
              <Text style={styles.categoryLabel}>Category</Text>
              <Pressable accessibilityRole="button" style={styles.categoryTrigger} onPress={() => setCategoryPickerOpen(true)}>
                <Text style={styles.categoryText}>{selectedCategory || "Select category"}</Text>
                <Feather name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />
              </Pressable>
              {errors.category?.message ? <Text style={styles.errorText}>{errors.category.message}</Text> : null}

              <Modal
                visible={isCategoryPickerOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setCategoryPickerOpen(false)}
              >
                <View style={{ flex: 1 }}>
                  <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
                  <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setCategoryPickerOpen(false)} />
                  <View style={styles.modalBackdrop} pointerEvents="box-none">
                    <View style={styles.modalCard}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select {mode} category</Text>
                        <Pressable accessibilityRole="button" onPress={() => setCategoryPickerOpen(false)}>
                          <Text style={styles.closeText}>Close</Text>
                        </Pressable>
                      </View>

                      <FlatList
                        data={categoryOptions}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}
                        renderItem={({ item }) => {
                          const active = item === selectedCategory;

                          return (
                            <Pressable
                              accessibilityRole="button"
                              style={[styles.categoryItem, active ? styles.categoryItemActive : undefined]}
                              onPress={() => {
                                onChange(item);
                                setCategoryPickerOpen(false);
                              }}
                            >
                              <Text style={[styles.categoryItemText, active ? styles.categoryItemTextActive : undefined]}>{item}</Text>
                            </Pressable>
                          );
                        }}
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Note (optional)"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Any context for this entry"
              error={errors.notes?.message}
            />
          )}
        />

        <PrimaryButton onPress={() => void onSubmit()} loading={mutation.isPending}>
          Save
        </PrimaryButton>

        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
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
    form: {
      gap: spacing.sm,
      marginBottom: spacing.xl
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
    categoryWrap: {
      gap: spacing.xs
    },
    categoryLabel: {
      fontFamily: typography.familySemiBold,
      color: colors.textPrimary,
      fontSize: typography.sizeSm
    },
    categoryTrigger: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      minHeight: 48,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    categoryText: {
      fontFamily: typography.familyRegular,
      color: colors.textPrimary,
      fontSize: typography.sizeMd,
      flex: 1
    },
    errorText: {
      fontFamily: typography.familyRegular,
      color: colors.danger,
      fontSize: typography.sizeXs
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg
    },
    modalCard: {
      maxHeight: "74%",
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
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
    categoryList: {
      gap: spacing.xs,
      paddingBottom: spacing.xs
    },
    categoryItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.panel
    },
    categoryItemActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    categoryItemText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    categoryItemTextActive: {
      color: colors.accent,
      fontFamily: typography.familySemiBold
    },
    success: {
      fontFamily: typography.familyRegular,
      color: colors.accent,
      fontSize: typography.sizeSm,
      textAlign: "center"
    }
  });
