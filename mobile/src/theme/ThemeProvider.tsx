import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

import { AppColors, darkColors, lightColors } from "./colors";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type AppThemeProviderProps = {
  children: ReactNode;
};

const themeModeKey = "theme_mode";

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    async function loadThemeMode() {
      const stored = await SecureStore.getItemAsync(themeModeKey);

      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeModeState(stored);
      }
    }

    void loadThemeMode();
  }, []);

  const resolvedSystemScheme = systemScheme ?? Appearance.getColorScheme() ?? "light";
  const isDark = themeMode === "dark" || (themeMode === "system" && resolvedSystemScheme === "dark");

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void SecureStore.setItemAsync(themeModeKey, mode);
  };

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme: () => setThemeMode(isDark ? "light" : "dark")
    }),
    [isDark, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
