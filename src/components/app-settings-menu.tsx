"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  DatabaseZap,
  History,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Paintbrush,
  PackageSearch,
  Sun,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const themes = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "blue", label: "Azul", icon: Paintbrush },
  { value: "green", label: "Verde", icon: Paintbrush },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

const THEME_CHANGE_EVENT = "xcrm-theme-change";

function getServerTheme(): ThemeValue {
  return "system";
}

type AppSettingsMenuProps = {
  tenantId: string;
  userId: string;
  canManageCompanySettings?: boolean;
  canImportData?: boolean;
};

export function AppSettingsMenu({
  tenantId,
  userId,
  canManageCompanySettings = false,
  canImportData = false,
}: AppSettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const themeStorageKey = `xcrm-theme:tenant:${tenantId}:user:${userId}`;
  const [isOpen, setIsOpen] = useState(false);
  const getThemeSnapshot = useCallback((): ThemeValue => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return themes.some((item) => item.value === storedTheme)
      ? (storedTheme as ThemeValue)
      : "system";
  }, [themeStorageKey]);
  const subscribeToTheme = useCallback(
    (onStoreChange: () => void) => {
      function handleStorage(event: StorageEvent) {
        if (event.key === themeStorageKey) {
          onStoreChange();
        }
      }

      window.addEventListener("storage", handleStorage);
      window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
      };
    },
    [themeStorageKey],
  );
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerTheme,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const activeTheme = panelRef.current?.querySelector<HTMLElement>(
        '[aria-pressed="true"]',
      );
      const firstControl = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href]',
      );

      (activeTheme ?? firstControl)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function updateTheme(value: ThemeValue) {
    window.localStorage.setItem(themeStorageKey, value);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="app-settings-menu-panel"
        aria-label={isOpen ? "Fechar Menu" : "Abrir Menu"}
        title="Menu"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-foreground"
      >
        <Menu size={20} aria-hidden />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id="app-settings-menu-panel"
          className="absolute left-0 top-14 z-20 w-72 rounded-md border border-border bg-surface shadow-lg shadow-black/10 sm:left-auto sm:right-0"
        >
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
                      "inline-flex h-11 items-center justify-center rounded text-muted transition-colors hover:bg-surface-muted hover:text-foreground",
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

          <div className="border-b border-border p-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <LayoutDashboard size={16} className="text-primary" aria-hidden />
              Dashboard Principal
            </Link>
            <Link
              href="/dashboard-anterior"
              onClick={() => setIsOpen(false)}
              className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <History size={16} className="text-primary" aria-hidden />
              Dashboard Anterior
            </Link>
            <Link
              href="/agenda"
              onClick={() => setIsOpen(false)}
              className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <CalendarDays size={16} className="text-primary" aria-hidden />
              Agenda de Atividades
            </Link>
          </div>

          {canManageCompanySettings ? (
            <div className="p-2">
              <Link
                href="/settings/company"
                onClick={() => setIsOpen(false)}
                className="flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <Building2 size={16} className="text-primary" aria-hidden />
                Configurações da Empresa
              </Link>
              <Link
                href="/accounts"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <BriefcaseBusiness
                  size={16}
                  className="text-primary"
                  aria-hidden
                />
                Cadastro Prospects/Clientes
              </Link>
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <PackageSearch
                  size={16}
                  className="text-primary"
                  aria-hidden
                />
                Catálogo de Produtos
              </Link>
              <Link
                href="/settings/team"
                onClick={() => setIsOpen(false)}
                className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <UsersRound size={16} className="text-primary" aria-hidden />
                Equipes e Usuários
              </Link>
              {canImportData ? (
                <Link
                  href="/imports"
                  onClick={() => setIsOpen(false)}
                  className="mt-1 flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                >
                  <DatabaseZap
                    size={16}
                    className="text-primary"
                    aria-hidden
                  />
                  Importação de Dados
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
