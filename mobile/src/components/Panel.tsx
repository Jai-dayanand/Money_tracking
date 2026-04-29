import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { spacing, useAppTheme } from "../theme";

type PanelProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Panel({ children, style }: PanelProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors.surface, colors.border, colors.shadow);

  return <View style={[styles.panel, style]}>{children}</View>;
}

const createStyles = (backgroundColor: string, borderColor: string, shadowColor: string) =>
  StyleSheet.create({
    panel: {
      borderRadius: 20,
      backgroundColor,
      borderWidth: 1,
      borderColor,
      padding: spacing.md,
      shadowColor,
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4
      },
      elevation: 2
    }
  });
