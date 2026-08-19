"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  getGitHubLoginUrl,
  logout as logoutRequest,
  type AuthUser,
} from "./auth";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const result = await getCurrentUser();

      setAuthenticated(result.authenticated);
      setUser(result.user);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = () => {
    window.location.href = getGitHubLoginUrl();
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
