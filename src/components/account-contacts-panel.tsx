"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { AccountSectionPanel } from "@/components/account-section-panel";

type AccountContactsPanelProps = {
  children: ReactNode;
  contactCount: number;
  hasContacts: boolean;
  newContactForm: ReactNode;
};

export function AccountContactsPanel({
  children,
  contactCount,
  hasContacts,
  newContactForm,
}: AccountContactsPanelProps) {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const newContactContentId = "account-new-contact-form";

  return (
    <AccountSectionPanel
      id="contatos"
      title="Contatos"
      icon="contacts"
      count={contactCount}
      defaultExpanded={false}
      emptyContent={
        <p className="px-4 py-4 text-sm text-muted">
          {hasContacts
            ? `${contactCount} contato${contactCount === 1 ? "" : "s"} cadastrado${
                contactCount === 1 ? "" : "s"
              }. Use Ver Contatos para editar.`
            : "Nenhum contato cadastrado."}
        </p>
      }
      actionContent={
        <>
          <div className="px-4 py-4">
            <button
              type="button"
              aria-expanded={isAddingContact}
              aria-controls={newContactContentId}
              onClick={() => setIsAddingContact((current) => !current)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <Plus size={16} aria-hidden />
              {isAddingContact ? "Recolher Novo Contato" : "Adicionar Contato"}
              {isAddingContact ? (
                <ChevronUp size={15} aria-hidden />
              ) : (
                <ChevronDown size={15} aria-hidden />
              )}
            </button>
          </div>
          {isAddingContact ? (
            <div id={newContactContentId}>{newContactForm}</div>
          ) : null}
        </>
      }
    >
      {hasContacts ? (
        children
      ) : (
        <p className="px-4 py-4 text-sm text-muted">
          Nenhum contato cadastrado.
        </p>
      )}
    </AccountSectionPanel>
  );
}
