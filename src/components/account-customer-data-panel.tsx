"use client";

import { ChevronDown, ChevronUp, IdCard, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { CnpjInput } from "@/components/cnpj-input";
import { UppercaseInput } from "@/components/uppercase-input";

type AccountCustomerDataPanelProps = {
  address?: string | null;
  addressComplement?: string | null;
  addressNumber?: string | null;
  district?: string | null;
  document?: string | null;
  legalName?: string | null;
  postalCode?: string | null;
};

type ViaCepResponse = {
  bairro?: string;
  cep?: string;
  complemento?: string;
  erro?: boolean;
  localidade?: string;
  logradouro?: string;
  uf?: string;
};

function normalizeCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value: string) {
  const normalized = normalizeCep(value);
  const first = normalized.slice(0, 5);
  const second = normalized.slice(5, 8);

  return second ? `${first}-${second}` : first;
}

function updateFormField(name: string, value: string) {
  const field = document.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[name="${name}"]`,
  );

  if (!field) {
    return;
  }

  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function AccountCustomerDataPanel({
  address,
  addressComplement,
  addressNumber,
  district,
  document,
  legalName,
  postalCode,
}: AccountCustomerDataPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [cep, setCep] = useState(formatCep(postalCode ?? ""));
  const [streetAddress, setStreetAddress] = useState(address ?? "");
  const [neighborhood, setNeighborhood] = useState(district ?? "");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");

  async function lookupCep() {
    const normalizedCep = normalizeCep(cep);

    if (normalizedCep.length !== 8) {
      setCepMessage("Informe um CEP com 8 dígitos.");
      return;
    }

    setIsLoadingCep(true);
    setCepMessage("");

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${normalizedCep}/json/`,
      );
      const data = (await response.json()) as ViaCepResponse;

      if (!response.ok || data.erro) {
        setCepMessage("CEP não encontrado.");
        return;
      }

      const nextAddress = data.logradouro ?? "";
      const nextDistrict = data.bairro ?? "";

      setStreetAddress(nextAddress);
      setNeighborhood(nextDistrict);
      updateFormField("address", nextAddress);
      updateFormField("district", nextDistrict);

      if (data.localidade) {
        updateFormField("city", data.localidade);
      }

      if (data.uf) {
        updateFormField("state", data.uf);
      }

      setCepMessage("Endereço preenchido pelo CEP.");
    } catch {
      setCepMessage("Não foi possível consultar o CEP agora.");
    } finally {
      setIsLoadingCep(false);
    }
  }

  return (
    <section className="rounded-md border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <IdCard size={16} className="text-primary" aria-hidden />
            Dados do Cliente
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            Preencha quando o cadastro evoluir para Cliente.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          {expanded ? "Recolher" : "Abrir"}
          {expanded ? (
            <ChevronUp size={15} aria-hidden />
          ) : (
            <ChevronDown size={15} aria-hidden />
          )}
        </button>
      </div>

      <div className={expanded ? "grid gap-3 p-3" : "hidden"}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Razão Social</span>
          <UppercaseInput
            name="legalName"
            defaultValue={legalName ?? ""}
            autoComplete="organization"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">CNPJ</span>
          <CnpjInput
            name="document"
            defaultValue={document ?? ""}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm uppercase"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="grid min-w-0 gap-1 text-sm">
            <span className="font-medium">CEP</span>
            <input
              name="postalCode"
              type="text"
              value={cep}
              onBlur={() => {
                if (normalizeCep(cep).length === 8) {
                  void lookupCep();
                }
              }}
              onChange={(event) => setCep(formatCep(event.target.value))}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={isLoadingCep}
            onClick={lookupCep}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingCep ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Search size={16} aria-hidden />
            )}
            Buscar
          </button>
        </div>
        {cepMessage && <p className="text-xs text-muted">{cepMessage}</p>}
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Endereço</span>
          <input
            name="address"
            type="text"
            value={streetAddress}
            onChange={(event) => setStreetAddress(event.target.value)}
            autoComplete="street-address"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <label className="grid min-w-0 gap-1 text-sm">
            <span className="font-medium">Número</span>
            <input
              name="addressNumber"
              type="text"
              defaultValue={addressNumber ?? ""}
              autoComplete="address-line2"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm">
            <span className="font-medium">Complemento</span>
            <input
              name="addressComplement"
              type="text"
              defaultValue={addressComplement ?? ""}
              autoComplete="address-line3"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Bairro</span>
          <input
            name="district"
            type="text"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            autoComplete="address-level3"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          />
        </label>
      </div>
    </section>
  );
}
