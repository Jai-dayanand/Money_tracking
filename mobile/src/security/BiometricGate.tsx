import * as LocalAuthentication from "expo-local-authentication";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type GateState = "checking" | "locked" | "unlocked";

type BiometricGateProps = {
  children: ReactNode;
};

export function BiometricGate({ children }: BiometricGateProps) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    void unlockWithBiometrics();
  }, []);

  async function unlockWithBiometrics() {
    setState("checking");

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setState("unlocked");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Money Tracking",
        fallbackLabel: "Use device passcode"
      });

      if (result.success) {
        setState("unlocked");
        return;
      }

      setState("locked");
    } catch {
      setState("unlocked");
    }
  }

  if (state === "unlocked") {
    return <>{children}</>;
  }

  if (state === "checking") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.subtitle}>Securing your workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Unlock to continue</Text>
      <Text style={styles.subtitle}>Use biometrics for quick and secure access.</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => void unlockWithBiometrics()}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setState("unlocked")}>
        <Text style={styles.skipText}>Continue without biometrics</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  title: {
    fontFamily: typography.familyBold,
    fontSize: typography.sizeXl,
    color: colors.textPrimary,
    textAlign: "center"
  },
  subtitle: {
    fontFamily: typography.familyRegular,
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: "center"
  },
  button: {
    minWidth: 180,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    alignItems: "center"
  },
  buttonText: {
    fontFamily: typography.familySemiBold,
    color: colors.surface,
    fontSize: typography.sizeMd
  },
  skipText: {
    marginTop: spacing.xs,
    fontFamily: typography.familyRegular,
    color: colors.textSecondary,
    fontSize: typography.sizeSm
  }
});
