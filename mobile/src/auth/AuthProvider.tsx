import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import * as authApi from "../api/auth";
import { User } from "../types/auth";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  register: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const tokenStorageKey = "auth_token";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const clearMoneyQueries = async () => {
    await Promise.all([
      queryClient.removeQueries({ queryKey: ["transactions"] }),
      queryClient.removeQueries({ queryKey: ["summary"] })
    ]);
  };

  // Load persisted token on mount
  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync(tokenStorageKey);

        if (storedToken) {
          setToken(storedToken);
          // Verify token by fetching current user
          try {
            const currentUser = await authApi.getCurrentUser(storedToken);
            setUser(currentUser);
          } catch {
            // Token is invalid, clear it
            await SecureStore.deleteItemAsync(tokenStorageKey);
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadToken();
  }, []);

  const register = async (email: string, name: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Registering user:", email);
      const response = await authApi.register(email, name, password);
      console.log("Register response:", response);
      await clearMoneyQueries();
      setToken(response.access_token);
      setUser(response.user);
      await SecureStore.setItemAsync(tokenStorageKey, response.access_token);
      console.log("User registered and token saved");
    } catch (error) {
      console.error("Register error:", error);
      const message = error instanceof Error ? error.message : "Registration failed";
      setIsLoading(false);
      throw new Error(message);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Logging in user:", email);
      const response = await authApi.login(email, password);
      console.log("Login response:", response);
      await clearMoneyQueries();
      setToken(response.access_token);
      setUser(response.user);
      await SecureStore.setItemAsync(tokenStorageKey, response.access_token);
      console.log("User logged in and token saved");
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Login failed";
      setIsLoading(false);
      throw new Error(message);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    await clearMoneyQueries();
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync(tokenStorageKey);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isSignedIn: token !== null,
      register,
      login,
      logout
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
