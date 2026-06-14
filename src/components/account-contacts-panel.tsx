"use client";

import { ChevronDown, ChevronUp, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type AccountContactsPanelProps = {
  children: ReactNode;
  extraContacts: ReactNode;
  hasContacts: boolean;
  hasExtraContacts: boolean;
  newContactForm: ReactNode;
};

export function AccountContactsPanel({
  children,
  extraContacts,
  hasContacts,
  hasExtraContacts,
  newContactForm,
}: AccountContactsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UserRound size={18} className="text-primary" aria-hidden />
          Contatos
        </h2>
        {hasExtraContacts && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {expanded ? "Recolher" : "Ver Todos"}
            {expanded ? (
              <ChevronUp size={15} aria-hidden />
            ) : (
              <ChevronDown size={15} aria-hidden />
            )}
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {hasContacts ? (
          <>
            {children}
            {expanded && extraContacts}
          </>
        ) : (
          <p className="px-4 py-4 text-sm text-muted">
            Nenhum contato cadastrado.
          </p>
        )}
        {newContactForm}
      </div>
    </section>
  );
}
