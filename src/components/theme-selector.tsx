"use client";

import { Monitor, Moon, Paintbrush, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "blue", label: "Azul", icon: Paintbrush },
  { value: "green", label: "Verde", icon: Paintbrush },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeValue>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const storedTheme = window.localStorage.getItem("xcrm-theme");
    return themes.some((item) => item.value === storedTheme)
      ? (storedTheme as ThemeValue)
      : "system";
  });

  useEffect(() => {
    window.localStorage.setItem("xcrm-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function updateTheme(value: ThemeValue) {
    setTheme(value);
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-1">
      {themes.map((item) => {
        const Icon = item.icon;
        const isActive = item.value === theme;

        return (
          <button
            key={item.value}
            type="button"
            title={`Tema ${item.label}`}
            aria-pressed={isActive}
            onClick={() => updateTheme(item.value)}
            className={[
              "inline-flex h-8 w-9 items-center justify-center rounded text-muted",
              isActive ? "bg-primary text-primary-foreground" : "",
            ].join(" ")}
          >
            <Icon size={15} aria-hidden />
            <span className="sr-only">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
