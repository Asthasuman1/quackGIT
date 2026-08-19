const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AuthUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
};

export type AuthResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check authentication");
  }

  return response.json();
}

export function getGitHubLoginUrl(): string {
  return `${API_BASE_URL}/auth/github/login`;
}

export async function logout(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}