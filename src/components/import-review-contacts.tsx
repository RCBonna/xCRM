"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

type ReviewContact = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
};

type EditableContact = {
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
};

type ImportReviewContactsProps = {
  contacts: ReviewContact[];
};

function normalizeContacts(contacts: ReviewContact[]): EditableContact[] {
  const normalizedContacts = contacts.map((contact, index) => ({
    name: contact.name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    role: contact.role ?? "",
    isPrimary: Boolean(contact.isPrimary) || (index === 0 && !contacts.some((item) => item.isPrimary)),
  }));

  return normalizedContacts;
}

export function ImportReviewContacts({ contacts }: ImportReviewContactsProps) {
  const [items, setItems] = useState<EditableContact[]>(() =>
    normalizeContacts(contacts),
  );

  function updateContact(index: number, field: keyof EditableContact, value: string) {
    setItems((current) =>
      current.map((contact, itemIndex) =>
        itemIndex === index ? { ...contact, [field]: value } : contact,
      ),
    );
  }

  function setPrimary(index: number) {
    setItems((current) =>
      current.map((contact, itemIndex) => ({
        ...contact,
        isPrimary: itemIndex === index,
      })),
    );
  }

  function removeContact(index: number) {
    setItems((current) => {
      const nextContacts = current.filter((_, itemIndex) => itemIndex !== index);

      if (nextContacts.length > 0 && !nextContacts.some((contact) => contact.isPrimary)) {
        nextContacts[0] = { ...nextContacts[0], isPrimary: true };
      }

      return nextContacts;
    });
  }

  function addContact() {
    setItems((current) => [
      ...current,
      {
        name: "Contato a Revisar",
        email: "",
        phone: "",
        role: "",
        isPrimary: current.length === 0,
      },
    ]);
  }

  return (
    <div className="border-b border-border px-4 py-3">
      <input type="hidden" name="contactsJson" value={JSON.stringify(items)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Contatos
          </h3>
          <p className="mt-1 text-xs text-muted">
            Revise os contatos detectados na célula de e-mail antes de aprovar a linha.
          </p>
        </div>
        <button
          type="button"
          onClick={addContact}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted"
        >
          <Plus size={14} aria-hidden />
          Adicionar Contato
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Nenhum contato detectado. Adicione um contato para revisar esta linha.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-border border-y border-border">
          {items.map((contact, index) => (
            <div key={`${contact.email}-${index}`} className="grid gap-3 py-3 lg:grid-cols-12 lg:items-end">
              <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                <span className="text-xs font-medium">Nome</span>
                <input
                  value={contact.name}
                  onChange={(event) => updateContact(index, "name", event.target.value)}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid min-w-0 gap-1 text-sm lg:col-span-2">
                <span className="text-xs font-medium">Função/Cargo</span>
                <input
                  value={contact.role}
                  onChange={(event) => updateContact(index, "role", event.target.value)}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                <span className="text-xs font-medium">E-mail</span>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(event) => updateContact(index, "email", event.target.value)}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid min-w-0 gap-1 text-sm lg:col-span-2">
                <span className="text-xs font-medium">Telefone</span>
                <input
                  value={contact.phone}
                  onChange={(event) => updateContact(index, "phone", event.target.value)}
                  className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                />
              </label>
              <div className="flex items-end gap-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  aria-pressed={contact.isPrimary}
                  className={[
                    "inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium",
                    contact.isPrimary
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted",
                  ].join(" ")}
                >
                  <Star size={14} aria-hidden />
                  {contact.isPrimary ? "Principal" : "Definir Principal"}
                </button>
                <button
                  type="button"
                  onClick={() => removeContact(index)}
                  aria-label={`Remover contato ${contact.name || index + 1}`}
                  title="Remover Contato"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-danger text-danger"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
