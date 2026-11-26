
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
  getGitLabLoginUrl,
  logout as logoutRequest,
  type AuthUser,
} from "./auth";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  loginWithGitHub: () => void;
  loginWithGitLab: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Configure backend URL through environment variables.
// Local development: http://localhost:8000
// Production: configure your deployed backend URL.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend"
).replace(/\/+$/, "");

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

  const loginWithGitHub = () => {
    window.location.assign(
      `${API_BASE_URL}/auth/github/login`
    );
  };

  const loginWithGitLab = () => {
    window.location.assign(getGitLabLoginUrl());
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
        loginWithGitHub,
        loginWithGitLab,
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
