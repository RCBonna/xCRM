import type { ProposalStatus } from "@/generated/prisma/client";

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  DRAFT: "Rascunho",
  READY: "Pronta",
  SENT: "Enviada",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  EXPIRED: "Expirada",
  SUPERSEDED: "Substituída",
  CANCELED: "Cancelada",
};

export const proposalStatusTone: Record<ProposalStatus, string> = {
  DRAFT: "bg-surface-muted text-muted",
  READY: "bg-primary/15 text-primary",
  SENT: "bg-primary/15 text-primary",
  ACCEPTED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  EXPIRED: "bg-warning/15 text-warning",
  SUPERSEDED: "bg-surface-muted text-muted",
  CANCELED: "bg-danger/15 text-danger",
};

export const proposalCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const proposalDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function formatProposalNumber(number: number, version = 1) {
  return `PROP-${String(number).padStart(5, "0")}.${version}`;
}
