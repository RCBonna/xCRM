"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  PauseCircle,
  Phone,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteTenantAction,
  reactivateTenantAction,
  suspendTenantAction,
} from "@/app/platform/actions";

type TenantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

type TenantItem = {
  id: string;
  name: string;
  status: TenantStatus;
  owner: { name: string; email: string | null; phone: string | null } | null;
  counts: {
    users: number;
    accounts: number;
    contacts: number;
    activities: number;
    imports: number;
  };
  lastStatusEvent: {
    status: TenantStatus;
    reason: string | null;
    createdAt: string;
    changedBy: string;
  } | null;
};

type DialogAction = "suspend" | "reactivate" | "delete" | null;

type PlatformTenantManagementProps = {
  tenants: TenantItem[];
};

const statusLabels: Record<TenantStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
};

const statusClasses: Record<TenantStatus, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  INACTIVE: "bg-surface-muted text-muted",
  SUSPENDED: "bg-danger/10 text-danger",
  ARCHIVED: "bg-surface-muted text-muted",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PlatformTenantManagement({
  tenants,
}: PlatformTenantManagementProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TenantStatus>("ALL");
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id ?? "");
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visibleTenants = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return tenants.filter((tenant) => {
      const matchesStatus =
        statusFilter === "ALL" || tenant.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        tenant.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        tenant.owner?.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        tenant.owner?.email?.toLocaleLowerCase("pt-BR").includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, tenants]);

  const selectedTenant =
    visibleTenants.find((tenant) => tenant.id === selectedTenantId) ??
    visibleTenants[0] ??
    null;

  useEffect(() => {
    if (dialogAction && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [dialogAction]);

  function closeDialog() {
    dialogRef.current?.close();
    setDialogAction(null);
    setIsSubmitting(false);
  }

  function openDialog(action: Exclude<DialogAction, null>) {
    setIsSubmitting(false);
    setDialogAction(action);
  }

  if (tenants.length === 0) {
    return (
      <section className="rounded-md border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        Nenhuma organização cadastrada.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="grid min-h-[38rem] lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-3">
            <label className="sr-only" htmlFor="tenant-search">
              Buscar Organização
            </label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3">
              <Search size={16} className="shrink-0 text-muted" aria-hidden />
              <input
                id="tenant-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar organização"
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
              />
            </div>
            <label className="mt-2 grid gap-1 text-xs font-medium text-muted">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | TenantStatus)
                }
                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              >
                <option value="ALL">Todos os Status</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="max-h-[34rem] overflow-y-auto p-2">
            {visibleTenants.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">
                Nenhuma organização encontrada.
              </p>
            ) : (
              visibleTenants.map((tenant) => {
                const isSelected = tenant.id === selectedTenant?.id;

                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={[
                      "mb-1 grid w-full gap-1 rounded-md border px-3 py-3 text-left",
                      isSelected
                        ? "border-primary bg-surface-muted"
                        : "border-transparent hover:bg-surface-muted",
                    ].join(" ")}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{tenant.name}</span>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusClasses[tenant.status]}`}>
                        {statusLabels[tenant.status]}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted">
                      {tenant.owner?.name ?? "Sem Owner"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {selectedTenant ? (
          <div className="min-w-0">
            <header className="border-b border-border px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedTenant.name}</h2>
                <span className={`rounded px-2 py-1 text-xs font-medium ${statusClasses[selectedTenant.status]}`}>
                  {statusLabels[selectedTenant.status]}
                </span>
              </div>
            </header>

            <div className="grid gap-5 p-4 sm:p-5">
              <section aria-labelledby="tenant-overview-title">
                <h3 id="tenant-overview-title" className="text-sm font-semibold">
                  Visão Operacional
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-5">
                  {[
                    ["Usuários", selectedTenant.counts.users],
                    ["Empresa/ Prospects", selectedTenant.counts.accounts],
                    ["Contatos", selectedTenant.counts.contacts],
                    ["Ações Pendentes", selectedTenant.counts.activities],
                    ["Importações", selectedTenant.counts.imports],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="min-w-0">
                      <dt className="min-h-8 break-words text-xs leading-4 text-muted">{label}</dt>
                      <dd className="mt-1 text-lg font-semibold leading-none tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 border-t border-border pt-3 text-sm">
                  <p className="font-medium">Proprietário</p>
                  {selectedTenant.owner ? (
                    <div className="mt-2 grid gap-2 text-muted sm:grid-cols-3">
                      <p className="flex min-w-0 items-center gap-2">
                        <UserRound size={15} className="shrink-0 text-primary" aria-hidden />
                        <span className="truncate" title={selectedTenant.owner.name}>{selectedTenant.owner.name}</span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2">
                        <Mail size={15} className="shrink-0 text-primary" aria-hidden />
                        <span className="truncate" title={selectedTenant.owner.email ?? undefined}>{selectedTenant.owner.email ?? "E-mail não informado"}</span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2">
                        <Phone size={15} className="shrink-0 text-primary" aria-hidden />
                        <span className="truncate" title={selectedTenant.owner.phone ?? undefined}>{selectedTenant.owner.phone ?? "Telefone não informado"}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-muted">Nenhum proprietário vinculado.</p>
                  )}
                </div>
              </section>

              <section className="border-t border-border pt-5" aria-labelledby="tenant-access-title">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={17} className="text-primary" aria-hidden />
                  <h3 id="tenant-access-title" className="text-sm font-semibold">Acesso da Organização</h3>
                </div>
                {selectedTenant.lastStatusEvent ? (
                  <div className="mt-3 flex gap-2 text-sm leading-6 text-muted">
                    <Clock3 size={16} className="mt-1 shrink-0" aria-hidden />
                    <p>
                      Última alteração: {statusLabels[selectedTenant.lastStatusEvent.status]} por {selectedTenant.lastStatusEvent.changedBy} em {dateTimeFormatter.format(new Date(selectedTenant.lastStatusEvent.createdAt))}.
                      {selectedTenant.lastStatusEvent.reason ? ` Motivo: ${selectedTenant.lastStatusEvent.reason}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">Nenhuma alteração de acesso registrada.</p>
                )}
                <div className="mt-4">
                  {selectedTenant.status === "SUSPENDED" ? (
                    <button
                      type="button"
                      onClick={() => openDialog("reactivate")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary px-4 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <CheckCircle2 size={16} aria-hidden />
                      Reativar Organização
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openDialog("suspend")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger px-4 text-sm font-medium text-danger hover:bg-danger hover:text-background"
                    >
                      <PauseCircle size={16} aria-hidden />
                      Suspender Organização
                    </button>
                  )}
                </div>
              </section>

              <section className="border-t border-danger/30 pt-5" aria-labelledby="tenant-danger-title">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle size={17} aria-hidden />
                  <h3 id="tenant-danger-title" className="text-sm font-semibold">Zona de Risco</h3>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  A exclusão remove permanentemente usuários, Empresas/Prospects, contatos, ações, oportunidades, histórico, anexos, importações, equipes e demais dados vinculados.
                </p>
                <button
                  type="button"
                  onClick={() => openDialog("delete")}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger px-4 text-sm font-medium text-danger hover:bg-danger hover:text-background"
                >
                  <Trash2 size={16} aria-hidden />
                  Excluir Organização
                </button>
              </section>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center px-5 py-12 text-center text-sm text-muted">
            Selecione uma organização para ver os detalhes.
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="tenant-action-dialog-title"
        className="w-[calc(100%-2rem)] max-w-lg rounded-md border border-border bg-surface p-0 text-foreground shadow-xl shadow-black/30 backdrop:bg-black/60"
        onClose={closeDialog}
      >
        {selectedTenant && dialogAction ? (
          <form
            action={dialogAction === "suspend" ? suspendTenantAction : dialogAction === "reactivate" ? reactivateTenantAction : deleteTenantAction}
            onSubmit={() => setIsSubmitting(true)}
            className="grid gap-4 p-5"
          >
            <input type="hidden" name="tenantId" value={selectedTenant.id} />
            <div>
              <h2 id="tenant-action-dialog-title" className={dialogAction === "delete" ? "text-lg font-semibold text-danger" : "text-lg font-semibold"}>
                {dialogAction === "suspend" ? "Suspender Organização" : dialogAction === "reactivate" ? "Reativar Organização" : "Excluir Organização Definitivamente"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {dialogAction === "suspend"
                  ? `A equipe de ${selectedTenant.name} perderá o acesso operacional até a reativação.`
                  : dialogAction === "reactivate"
                    ? `${selectedTenant.name} voltará a acessar o xCRM imediatamente.`
                    : `Esta ação é permanente e removerá todos os dados de ${selectedTenant.name}.`}
              </p>
            </div>

            {dialogAction === "delete" ? (
              <label className="grid gap-1 text-sm font-medium">
                Confirmação da Exclusão
                <input
                  autoFocus
                  required
                  name="confirmation"
                  placeholder={`EXCLUIR ${selectedTenant.name}`}
                  disabled={isSubmitting}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            ) : (
              <label className="grid gap-1 text-sm font-medium">
                {dialogAction === "suspend" ? "Motivo da Suspensão" : "Motivo da Reativação (Opcional)"}
                <textarea
                  autoFocus
                  required={dialogAction === "suspend"}
                  name="reason"
                  rows={3}
                  disabled={isSubmitting}
                  placeholder={dialogAction === "suspend" ? "Descreva o motivo para a auditoria." : "Registre um contexto, se necessário."}
                  className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={dialogAction === "delete" ? "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-medium text-background disabled:opacity-60" : "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"}
              >
                {isSubmitting ? "Processando..." : dialogAction === "suspend" ? "Confirmar Suspensão" : dialogAction === "reactivate" ? "Confirmar Reativação" : "Excluir Definitivamente"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </section>
  );
}
