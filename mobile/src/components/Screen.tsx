import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing, useAppTheme } from "../theme";

type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
};

export function Screen({ children, scrollable = true }: ScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors.background);

  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (backgroundColor: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 120,
      gap: spacing.md
    },
    content: {
      flex: 1,
      padding: spacing.lg
    }
  });
