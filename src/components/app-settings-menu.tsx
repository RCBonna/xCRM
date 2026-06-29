"use client";

import {
  BriefcaseBusiness,
  Building2,
  Menu,
  Monitor,
  Moon,
  Paintbrush,
  Sun,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const themes = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "blue", label: "Azul", icon: Paintbrush },
  { value: "green", label: "Verde", icon: Paintbrush },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

type AppSettingsMenuProps = {
  canManageCompanySettings?: boolean;
};

export function AppSettingsMenu({
  canManageCompanySettings = false,
}: AppSettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function updateTheme(value: ThemeValue) {
    setTheme(value);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Abrir Menu"
        title="Menu"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-foreground"
      >
        <Menu size={20} aria-hidden />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-20 w-72 rounded-md border border-border bg-surface shadow-lg shadow-black/10">
          <div className="border-b border-border px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Tema
            </p>
            <div className="mt-2 grid grid-cols-5 gap-1">
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
                      "inline-flex h-10 items-center justify-center rounded text-muted transition-colors hover:bg-surface-muted hover:text-foreground",
                      isActive ? "bg-primary text-primary-foreground" : "",
                    ].join(" ")}
                  >
                    <Icon size={15} aria-hidden />
                    <span className="sr-only">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {canManageCompanySettings ? (
            <div className="p-2">
              <Link
                href="/settings/company"
                onClick={() => setIsOpen(false)}
                className="flex h-10 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <Building2 size={16} className="text-primary" aria-hidden />
                Configurações da Empresa
              </Link>
              <Link
                href="/accounts"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex h-10 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <BriefcaseBusiness
                  size={16}
                  className="text-primary"
                  aria-hidden
                />
                Cadastro Prospects/Clientes
              </Link>
              <Link
                href="/settings/team"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex h-10 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <UsersRound size={16} className="text-primary" aria-hidden />
                Equipes e Usuários
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
