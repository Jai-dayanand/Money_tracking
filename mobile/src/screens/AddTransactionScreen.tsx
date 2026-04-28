import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Panel } from "../components/Panel";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useCreateTransaction } from "../hooks/useTransactions";
import { colors, spacing, typography } from "../theme";

const transactionSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  category: z.string().min(2, "Category is required"),
  date: z.string().min(8, "Use a valid date"),
  notes: z.string().max(140, "Keep notes under 140 chars").optional(),
  kind: z.enum(["income", "expense"]),
  isFixed: z.boolean()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const today = new Date().toISOString().slice(0, 10);

export function AddTransactionScreen() {
  const mutation = useCreateTransaction();
  const [successMessage, setSuccessMessage] = useState("");

  const defaultValues = useMemo<TransactionFormValues>(
    () => ({
      title: "",
      amount: 0,
      category: "",
      date: today,
      notes: "",
      kind: "expense",
      isFixed: false
    }),
    []
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage("");

    await mutation.mutateAsync({
      title: values.title.trim(),
      amount: values.amount,
      category: values.category.trim(),
      date: values.date,
      kind: values.kind,
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
      isFixed: values.isFixed
    });

    setSuccessMessage("Transaction saved successfully.");
    reset(defaultValues);
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Quick add</Text>
        <Text style={styles.subtitle}>Log an income or expense in under 20 seconds.</Text>
      </View>

      <Panel style={styles.form}>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Groceries, Salary, Uber..."
              error={errors.title?.message}
              returnKeyType="next"
            />
          )}
        />

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
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Category"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Food, Transport, Bills..."
              error={errors.category?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Date (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="2026-04-25"
              autoCapitalize="none"
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Notes (optional)"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Any context for this transaction"
              error={errors.notes?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="kind"
          render={({ field: { value, onChange } }) => (
            <View style={styles.segmentRow}>
              <Segment label="Expense" active={value === "expense"} onPress={() => onChange("expense")} />
              <Segment label="Income" active={value === "income"} onPress={() => onChange("income")} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="isFixed"
          render={({ field: { value, onChange } }) => (
            <Pressable accessibilityRole="button" style={styles.toggleRow} onPress={() => onChange(!value)}>
              <Text style={styles.toggleLabel}>Recurring / fixed transaction</Text>
              <View style={[styles.toggleBadge, value ? styles.toggleOn : undefined]}>
                <Text style={[styles.toggleBadgeText, value ? styles.toggleBadgeTextOn : undefined]}>
                  {value ? "Yes" : "No"}
                </Text>
              </View>
            </Pressable>
          )}
        />

        <PrimaryButton onPress={() => void onSubmit()} loading={mutation.isPending}>
          Save transaction
        </PrimaryButton>

        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      </Panel>
    </Screen>
  );
}

type SegmentProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function Segment({ label, active, onPress }: SegmentProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.segment, active ? styles.segmentActive : undefined]}>
      <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : undefined]}>{label}</Text>
    </Pressable>
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
  form: {
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.panel
  },
  segmentActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft
  },
  segmentLabel: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  segmentLabelActive: {
    color: colors.accent
  },
  toggleRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  toggleLabel: {
    fontFamily: typography.familyRegular,
    color: colors.textPrimary,
    fontSize: typography.sizeSm
  },
  toggleBadge: {
    minWidth: 48,
    borderRadius: 999,
    backgroundColor: colors.panel,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: spacing.xs
  },
  toggleOn: {
    backgroundColor: colors.accent
  },
  toggleBadgeText: {
    fontFamily: typography.familySemiBold,
    fontSize: typography.sizeSm,
    color: colors.textSecondary
  },
  toggleBadgeTextOn: {
    color: colors.surface
  },
  success: {
    fontFamily: typography.familyRegular,
    color: colors.accent,
    fontSize: typography.sizeSm,
    textAlign: "center"
  }
});
