"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

import { signInAction, signUpAction } from "@/app/auth/actions";
import { PasswordField } from "@/components/password-field";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type AccessTab = "sign-in" | "sign-up";

type LoginAccessTabsProps = {
  initialTab?: string;
};

const tabs: Array<{
  icon: typeof LogIn;
  label: string;
  value: AccessTab;
}> = [
  { value: "sign-in", label: "Entrar", icon: LogIn },
  { value: "sign-up", label: "Criar Acesso", icon: UserPlus },
];

export function LoginAccessTabs({ initialTab }: LoginAccessTabsProps) {
  const [activeTab, setActiveTab] = useState<AccessTab>(
    initialTab === "sign-up" ? "sign-up" : "sign-in",
  );

  return (
    <div className="rounded-md border border-border bg-surface">
      <div
        role="tablist"
        aria-label="Acesso ao xCRM"
        className="grid grid-cols-2 border-b border-border px-5 pt-3"
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
              aria-controls={`${tab.value}-panel`}
              id={`${tab.value}-tab`}
              onClick={() => setActiveTab(tab.value)}
              className={[
                "-mb-px inline-flex h-12 items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium text-muted",
                isActive
                  ? "border-primary bg-surface-muted text-foreground"
                  : "border-transparent",
              ].join(" ")}
            >
              <Icon size={16} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "sign-in" && (
        <form
          id="sign-in-panel"
          role="tabpanel"
          aria-labelledby="sign-in-tab"
          action={signInAction}
          className="flex min-h-[20rem] flex-col p-5"
        >
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">E-mail</span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Senha</span>
              <PasswordField name="password" autoComplete="current-password" />
            </label>
          </div>
          <PendingSubmitButton className="mt-auto h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-wait disabled:opacity-80">
            Entrar
          </PendingSubmitButton>
        </form>
      )}

      {activeTab === "sign-up" && (
        <form
          id="sign-up-panel"
          role="tabpanel"
          aria-labelledby="sign-up-tab"
          action={signUpAction}
          className="flex min-h-[20rem] flex-col p-5"
        >
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Nome</span>
              <input
                required
                name="name"
                type="text"
                autoComplete="name"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">E-mail</span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Senha</span>
              <PasswordField name="password" autoComplete="new-password" />
            </label>
          </div>
          <PendingSubmitButton className="mt-6 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-wait disabled:opacity-80">
            Criar Acesso
          </PendingSubmitButton>
        </form>
      )}
    </div>
  );
}
