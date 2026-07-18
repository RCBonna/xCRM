"use client";

import { AlertTriangle, Building2, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { useFormStatus } from "react-dom";

type AccountsTab = "base" | "new";

type AccountsTabsNavigationProps = {
  activeTab: AccountsTab;
  baseHref: string;
  newHref: string;
};

type AccountCreateActionsProps = {
  baseHref: string;
};

const formId = "new-account-form";
const dialogTitle = "Descartar Dados Digitados?";
const dialogDescription =
  "Existem informações ainda não cadastradas. Se sair agora, os dados preenchidos nesta tela serão descartados.";

function getCreateForm() {
  return document.getElementById(formId) as HTMLFormElement | null;
}

function serializeCreateForm(form: HTMLFormElement) {
  return JSON.stringify(
    Array.from(new FormData(form).entries())
      .filter(([name]) => name !== "returnTo")
      .map(([name, value]) => [
        name,
        typeof value === "string" ? value : value.name,
      ])
      .sort(([firstName], [secondName]) =>
        String(firstName).localeCompare(String(secondName)),
      ),
  );
}

function createFormHasUnsavedData() {
  const form = getCreateForm();

  if (!form?.dataset.initialState) {
    return false;
  }

  return serializeCreateForm(form) !== form.dataset.initialState;
}

function UnsavedAccountDialog({
  isOpen,
  onCancel,
  onDiscard,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    cancelButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-account-title"
        aria-describedby="unsaved-account-description"
        className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-2xl"
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger">
            <AlertTriangle size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="unsaved-account-title" className="text-base font-semibold">
              {dialogTitle}
            </h2>
            <p
              id="unsaved-account-description"
              className="mt-2 text-sm leading-6 text-muted"
            >
              {dialogDescription}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Continuar Editando
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex h-10 items-center justify-center rounded-md bg-danger px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Descartar e Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountsTabsNavigation({
  activeTab,
  baseHref,
  newHref,
}: AccountsTabsNavigationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<AccountsTab | null>(null);

  useEffect(() => {
    if (activeTab !== "new") {
      return;
    }

    const form = getCreateForm();

    if (!form) {
      return;
    }

    const captureInitialState = window.setTimeout(() => {
      form.dataset.initialState = serializeCreateForm(form);
    }, 0);

    return () => {
      window.clearTimeout(captureInitialState);
    };
  }, [activeTab]);

  function selectTab(tab: AccountsTab) {
    if (tab === activeTab) {
      return;
    }

    if (activeTab === "new" && tab === "base" && createFormHasUnsavedData()) {
      setPendingTab(tab);
      return;
    }

    navigateToTab(tab);
  }

  function navigateToTab(tab: AccountsTab) {
    const href = tab === "base" ? baseHref : newHref;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tab: AccountsTab,
  ) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    selectTab(tab === "base" ? "new" : "base");
  }

  const tabs = [
    {
      value: "base" as const,
      label: "Base Comercial",
      icon: Building2,
    },
    {
      value: "new" as const,
      label: "Nova Empresa/Prospect",
      icon: Plus,
    },
  ];

  return (
    <>
      <div
        role="tablist"
        aria-label="Empresas e Prospects"
        className="flex gap-1 border-b border-border"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.value === activeTab;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.value}-accounts-panel`}
              id={`${tab.value}-accounts-tab`}
              tabIndex={isActive ? 0 : -1}
              disabled={isPending}
              onClick={() => selectTab(tab.value)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.value)}
              className={[
                "-mb-px inline-flex min-h-12 items-center justify-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors disabled:cursor-progress disabled:opacity-70",
                isActive
                  ? "border-primary bg-surface-muted text-foreground"
                  : "border-transparent text-muted hover:bg-surface-muted hover:text-foreground",
              ].join(" ")}
            >
              {isPending && !isActive ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden />
              ) : (
                <Icon size={16} aria-hidden />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
      <UnsavedAccountDialog
        isOpen={pendingTab !== null}
        onCancel={() => setPendingTab(null)}
        onDiscard={() => {
          const tab = pendingTab;
          setPendingTab(null);

          if (tab) {
            navigateToTab(tab);
          }
        }}
      />
    </>
  );
}

export function AccountCreateActions({
  baseHref,
}: AccountCreateActionsProps) {
  const router = useRouter();
  const { pending } = useFormStatus();
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  function cancelCreation() {
    if (createFormHasUnsavedData()) {
      setIsDiscardDialogOpen(true);
      return;
    }

    router.push(baseHref, { scroll: false });
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={cancelCreation}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-wait disabled:opacity-70 sm:min-w-36"
        >
          <X size={16} aria-hidden />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary-action-border bg-primary-action-bg px-5 text-sm font-medium text-primary-action-foreground transition-colors hover:bg-primary-action-bg-hover disabled:cursor-wait disabled:opacity-75 sm:min-w-60"
        >
          {pending ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
              Cadastrando...
            </>
          ) : (
            <>
              <Plus size={16} aria-hidden />
              Cadastrar Empresa/Prospect
            </>
          )}
        </button>
      </div>
      <UnsavedAccountDialog
        isOpen={isDiscardDialogOpen}
        onCancel={() => setIsDiscardDialogOpen(false)}
        onDiscard={() => {
          setIsDiscardDialogOpen(false);
          router.push(baseHref, { scroll: false });
        }}
      />
    </>
  );
}
