"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* -------------------------------------------------------------------
 * RBAC types — DESIGN-SYSTEM.md §6.1
 * ------------------------------------------------------------------- */
export type UserRole = "operador" | "lideranca" | "gestao";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sb_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setAccessToken(parsed.accessToken);
        setRefreshToken(parsed.refreshToken);
      } catch {
        localStorage.removeItem("sb_auth");
      }
    }
    setIsLoading(false);
  }, []);

  // Persist auth state
  useEffect(() => {
    if (user && accessToken) {
      localStorage.setItem(
        "sb_auth",
        JSON.stringify({ user, accessToken, refreshToken }),
      );
    } else {
      localStorage.removeItem("sb_auth");
    }
  }, [user, accessToken, refreshToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return false;

        const data = await res.json();
        // Map backend response to AuthUser with role + permissions
        const mappedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: (data.user.role as UserRole) || "operador",
          permissions: data.user.permissions || [],
        };
        setUser(mappedUser);
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("sb_auth");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Fetch wrapper that auto-attaches JWT */
export async function authFetch(
  url: string,
  accessToken: string | null,
  options?: RequestInit,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return fetch(url, { ...options, headers });
}

/* -------------------------------------------------------------------
 * RBAC nav visibility — DESIGN-SYSTEM.md §6.1
 * ------------------------------------------------------------------- */
export interface NavItem {
  label: string;
  icon: string;
  href: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Sessões", icon: "MessageSquare", href: "/backoffice/sessions", roles: ["operador", "lideranca"] },
  { label: "Leads", icon: "Users", href: "/backoffice/leads", roles: ["operador", "lideranca", "gestao"] },
  { label: "Métricas", icon: "BarChart3", href: "/backoffice/metrics", roles: ["operador", "lideranca", "gestao"] },
  { label: "Campanhas", icon: "Link", href: "/backoffice/campaigns", roles: ["lideranca", "gestao"] },
  { label: "Configuração", icon: "Settings", href: "/backoffice/settings", roles: ["lideranca", "gestao"] },
  { label: "Operadores", icon: "Users", href: "/backoffice/operators", roles: ["lideranca", "gestao"] },
  { label: "Compliance", icon: "Shield", href: "/backoffice/compliance", roles: ["lideranca", "gestao"] },
  { label: "Auditoria", icon: "Clock", href: "/backoffice/audit", roles: ["lideranca", "gestao"] },
];

/** Filter nav items by user role */
export function getNavItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
