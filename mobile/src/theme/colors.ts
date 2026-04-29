export type AppColors = {
  background: string;
  surface: string;
  panel: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  warn: string;
  danger: string;
  border: string;
  shadow: string;
  chartBase: string;
};

export const lightColors: AppColors = {
  background: "#F6F5F0",
  surface: "#FFFFFF",
  panel: "#ECEAE0",
  textPrimary: "#1A1F16",
  textSecondary: "#5A6458",
  accent: "#0F7A63",
  accentSoft: "#E2F3EE",
  warn: "#C88A22",
  danger: "#B94A48",
  border: "#E4E1D7",
  shadow: "#11160D",
  chartBase: "#DAD5C6"
};

export const darkColors: AppColors = {
  background: "#000000",
  surface: "#111111",
  panel: "#181818",
  textPrimary: "#F5F5F5",
  textSecondary: "#B3B3B3",
  accent: "#2BA489",
  accentSoft: "#1A1A1A",
  warn: "#D49A37",
  danger: "#D87371",
  border: "#2A2A2A",
  shadow: "#000000",
  chartBase: "#333333"
};

export const colors = lightColors;
