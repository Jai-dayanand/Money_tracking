import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "../theme";

type PrimaryButtonProps = {
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({ onPress, children, disabled, loading }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.button, isDisabled ? styles.buttonDisabled : undefined]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.label}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg
  },
  buttonDisabled: {
    opacity: 0.65
  },
  label: {
    fontFamily: typography.familySemiBold,
    color: colors.surface,
    fontSize: typography.sizeMd
  }
});
