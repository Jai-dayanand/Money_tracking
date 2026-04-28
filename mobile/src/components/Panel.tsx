import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors, spacing } from "../theme";

type PanelProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Panel({ children, style }: PanelProps) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 2
  }
});
