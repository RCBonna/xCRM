"use client";

import { Building2, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition, type KeyboardEvent } from "react";
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
const unsavedMessage =
  "Existem dados não cadastrados. Deseja sair e descartar essas informações?";

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

function canLeaveCreateForm() {
  const form = getCreateForm();

  if (!form?.dataset.initialState) {
    return true;
  }

  if (serializeCreateForm(form) === form.dataset.initialState) {
    return true;
  }

  return window.confirm(unsavedMessage);
}

export function AccountsTabsNavigation({
  activeTab,
  baseHref,
  newHref,
}: AccountsTabsNavigationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

    if (activeTab === "new" && tab === "base" && !canLeaveCreateForm()) {
      return;
    }

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
  );
}

export function AccountCreateActions({
  baseHref,
}: AccountCreateActionsProps) {
  const router = useRouter();
  const { pending } = useFormStatus();

  function cancelCreation() {
    if (!canLeaveCreateForm()) {
      return;
    }

    router.push(baseHref, { scroll: false });
  }

  return (
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
  );
}
