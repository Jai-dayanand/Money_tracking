import { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useAuth } from "../auth";
import { spacing, typography, useAppTheme } from "../theme";

export function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { login, register, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (isSignUp && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      if (isSignUp) {
        console.log("Starting registration...");
        await register(email, name, password);
        console.log("Registration successful!");
        Alert.alert("Success", "Account created successfully!");
      } else {
        console.log("Starting login...");
        await login(email, password);
        console.log("Login successful!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      console.error("Auth error:", errorMessage);
      setError(errorMessage);
      Alert.alert("Login Error", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <Screen scrollable>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? "Sign up to start tracking your money" : "Log in to your account"}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton onPress={() => void handleSubmit()} loading={isLoading}>
              {isSignUp ? "Create Account" : "Log In"}
            </PrimaryButton>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </Text>
            <Pressable disabled={isLoading} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.footerLink}>{isSignUp ? "Log In" : "Sign Up"}</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: spacing.lg
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl
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
      gap: spacing.md,
      marginBottom: spacing.xl
    },
    fieldGroup: {
      gap: spacing.xs
    },
    label: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.textPrimary
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textPrimary,
      backgroundColor: colors.surface
    },
    errorText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.danger,
      marginTop: spacing.xs
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs
    },
    footerText: {
      fontFamily: typography.familyRegular,
      fontSize: typography.sizeSm,
      color: colors.textSecondary
    },
    footerLink: {
      fontFamily: typography.familySemiBold,
      fontSize: typography.sizeSm,
      color: colors.accent
    }
  });
