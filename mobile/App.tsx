import "react-native-gesture-handler";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PreferencesProvider } from "./src/preferences";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { BiometricGate } from "./src/security/BiometricGate";
import { AppThemeProvider, lightColors, useAppTheme } from "./src/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30
    }
  }
});

const onboardingKey = "onboarding_complete";

function AppBody() {
  const { colors, isDark } = useAppTheme();
  const [onboardingResolved, setOnboardingResolved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function loadOnboardingState() {
      const completed = await SecureStore.getItemAsync(onboardingKey);
      setShowOnboarding(completed !== "true");
      setOnboardingResolved(true);
    }

    void loadOnboardingState();
  }, []);

  const finishOnboarding = async () => {
    await SecureStore.setItemAsync(onboardingKey, "true");
    setShowOnboarding(false);
  };

  if (!onboardingResolved) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <BiometricGate>
      <StatusBar style={isDark ? "light" : "dark"} />
      {showOnboarding ? <OnboardingScreen onContinue={finishOnboarding} /> : <RootNavigator />}
    </BiometricGate>
  );
}

export default function App() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold
  });

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <PreferencesProvider>
            <AppBody />
          </PreferencesProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightColors.background
  }
});
