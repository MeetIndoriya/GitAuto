"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMe();
      setUser(data);
    } catch (err: any) {
      setUser(null);
      if (err instanceof ApiError && err.statusCode === 401) {
        setError(null);
      } else {
        setError(err.message || "Failed to authenticate session");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
      if (!user && !isPublic) {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
