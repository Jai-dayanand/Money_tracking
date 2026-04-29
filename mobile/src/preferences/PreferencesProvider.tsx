import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export type CurrencyOption = {
  code: string;
  label: string;
};

const fallbackCurrencyOptions: CurrencyOption[] = [
  { code: "USD", label: "US Dollar" },
  { code: "INR", label: "Indian Rupee" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "AED", label: "UAE Dirham" }
];

const currencyStorageKey = "preferred_currency";
const currenciesEndpoint = "https://openexchangerates.org/api/currencies.json";

type PreferencesContextValue = {
  currency: string;
  currencyOptions: CurrencyOption[];
  currenciesLoading: boolean;
  setCurrency: (currency: string) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

type PreferencesProviderProps = {
  children: ReactNode;
};

function isValidCurrencyCode(value: string) {
  return /^[A-Z]{3}$/.test(value);
}

function normalizeCurrencyOptions(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .reduce<CurrencyOption[]>((accumulator, [code, label]) => {
      if (!isValidCurrencyCode(code) || typeof label !== "string" || label.trim().length === 0) {
        return accumulator;
      }

      accumulator.push({
        code,
        label: label.trim()
      });

      return accumulator;
    }, [])
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [currency, setCurrencyState] = useState("USD");
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>(fallbackCurrencyOptions);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  useEffect(() => {
    async function loadStoredCurrency() {
      const stored = await SecureStore.getItemAsync(currencyStorageKey);

      if (stored && isValidCurrencyCode(stored)) {
        setCurrencyState(stored);
      }
    }

    void loadStoredCurrency();
  }, []);

  useEffect(() => {
    async function fetchCurrencies() {
      setCurrenciesLoading(true);

      try {
        const response = await fetch(currenciesEndpoint);

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        const normalized = normalizeCurrencyOptions(data);

        if (normalized.length > 0) {
          setCurrencyOptions(normalized);
        }
      } catch {
        setCurrencyOptions((current) => (current.length > 0 ? current : fallbackCurrencyOptions));
      } finally {
        setCurrenciesLoading(false);
      }
    }

    void fetchCurrencies();
  }, []);

  const setCurrency = (nextCurrency: string) => {
    const normalized = nextCurrency.trim().toUpperCase();

    if (!isValidCurrencyCode(normalized)) {
      return;
    }

    setCurrencyState(normalized);
    void SecureStore.setItemAsync(currencyStorageKey, normalized);
  };

  const value = useMemo(
    () => ({
      currency,
      currencyOptions,
      currenciesLoading,
      setCurrency
    }),
    [currency, currencyOptions, currenciesLoading]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}

