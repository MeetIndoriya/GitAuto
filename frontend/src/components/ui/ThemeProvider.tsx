"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [highContrast, setHighContrastState] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("gitauto_theme") as Theme | null;
    if (saved && ["dark", "light", "system"].includes(saved)) {
      setThemeState(saved);
    }
    const savedContrast = localStorage.getItem("gitauto_high_contrast");
    if (savedContrast === "true") {
      setHighContrastState(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let active: "dark" | "light" = "dark";
      if (theme === "system") {
        active = mediaQuery.matches ? "dark" : "light";
      } else {
        active = theme;
      }

      setResolvedTheme(active);
      if (active === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("gitauto_theme", t);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem("gitauto_high_contrast", enabled ? "true" : "false");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, highContrast, setHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
