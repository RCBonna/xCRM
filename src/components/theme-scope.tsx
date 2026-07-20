"use client";

import { useEffect } from "react";

type ThemeScopeProps = {
  theme?: "system" | "light" | "dark" | "blue" | "green";
};

export function ThemeScope({ theme = "system" }: ThemeScopeProps) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
