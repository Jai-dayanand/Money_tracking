import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type TextFieldProps = {
  label: string;
  error?: string;
} & TextInputProps;

export function TextField({ label, error, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    fontFamily: typography.familySemiBold,
    color: colors.textPrimary,
    fontSize: typography.sizeSm
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    fontFamily: typography.familyRegular,
    color: colors.textPrimary,
    fontSize: typography.sizeMd
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    fontFamily: typography.familyRegular,
    color: colors.danger,
    fontSize: typography.sizeXs
  }
});
