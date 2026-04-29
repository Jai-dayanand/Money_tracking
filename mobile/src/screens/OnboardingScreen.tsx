import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { spacing, typography, useAppTheme } from "../theme";

type OnboardingScreenProps = {
  onContinue: () => Promise<void>;
};

export function OnboardingScreen({ onContinue }: OnboardingScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Track money without the noise.</Text>
        <Text style={styles.subtitle}>
          Add income and expenses in seconds, then check clean insights whenever you need them.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton onPress={() => void onContinue()}>Get started</PrimaryButton>
        <Text style={styles.skip} onPress={() => void onContinue()}>
          Skip
        </Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    content: {
      gap: spacing.sm,
      marginTop: spacing.xl
    },
    kicker: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.accent
    },
    title: {
      fontFamily: typography.familyBold,
      fontSize: typography.sizeDisplay,
      color: colors.textPrimary
    },
    subtitle: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeMd,
      color: colors.textSecondary,
      lineHeight: 24
    },
    actions: {
      marginTop: "auto",
      gap: spacing.sm
    },
    skip: {
      textAlign: "center",
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    }
  });
