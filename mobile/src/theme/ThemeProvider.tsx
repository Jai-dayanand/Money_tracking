import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { AppColors, darkColors, lightColors } from "./colors";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type AppThemeProviderProps = {
  children: ReactNode;
};

const themeModeKey = "theme_mode";

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  // Load persisted preference once on mount
  useEffect(() => {
    async function loadThemeMode() {
      const stored = await SecureStore.getItemAsync(themeModeKey);

      if (stored === "light" || stored === "dark") {
        setThemeModeState(stored);
      }
    }

    void loadThemeMode();
  }, []);

  const isDark = themeMode === "dark";

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void SecureStore.setItemAsync(themeModeKey, mode);
  };

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      themeMode,
      setThemeMode
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
