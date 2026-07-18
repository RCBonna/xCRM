import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Info,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UsersRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  discardImportBatchAction,
  importApprovedRowsAction,
  importSingleRowAction,
  rejectImportRowAction,
  reprocessImportRowContactsAction,
  updateImportRowAction,
} from "@/app/imports/actions";
import { signOutAction } from "@/app/auth/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { CnpjInput } from "@/components/cnpj-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ImportMappingStarter } from "@/components/import-mapping-starter";
import { ImportStatusFilter } from "@/components/import-status-filter";
import { ImportReviewContacts } from "@/components/import-review-contacts";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import type { JobStatus } from "@/generated/prisma/client";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ImportsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    row?: string;
    status?: string;
    query?: string;
  }>;
};

type ReviewRowJson = {
  company?: {
    name?: string | null;
    legalName?: string | null;
    document?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    address?: string | null;
    addressNumber?: string | null;
    addressComplement?: string | null;
    district?: string | null;
    website?: string | null;
    segment?: string | null;
    mainSupplier?: string | null;
    notes?: string | null;
  };
  contacts?: Array<{
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    isPrimary?: boolean;
  }>;
  history?: Array<{
    body?: string | null;
  }>;
  futureActions?: Array<{
    title?: string | null;
    description?: string | null;
    scheduledAt?: string | null;
  }>;
  aiSuggestion?: {
    confidence?: number;
    explanation?: string;
    warnings?: string[];
  };
};

const activeImportStatuses: JobStatus[] = [
  "QUEUED",
  "PROCESSING",
  "REVIEWING",
  "APPROVED",
];

const statusLabels: Record<string, string> = {
  QUEUED: "Na Fila",
  PROCESSING: "Processando",
  REVIEWING: "Em Revisão",
  APPROVED: "Aprovada",
  IMPORTED: "Importada",
  DISCARDED: "Descartada",
  REJECTED: "Rejeitada",
  COMPLETED: "Concluída",
  FAILED: "Falhou",
};

const rowStatusFilters: Array<{
  label: string;
  value: "ALL" | JobStatus;
}> = [
  { label: "Todas", value: "ALL" },
  { label: "Em Revisão", value: "REVIEWING" },
  { label: "Aprovadas", value: "APPROVED" },
  { label: "Importadas", value: "IMPORTED" },
  { label: "Rejeitadas", value: "REJECTED" },
  { label: "Falharam", value: "FAILED" },
];

const statusBadgeClasses: Record<string, string> = {
  QUEUED: "border-border bg-surface-muted text-muted",
  PROCESSING: "border-primary/35 bg-primary/10 text-primary",
  REVIEWING: "border-primary/35 bg-primary/10 text-primary",
  APPROVED: "border-warning/40 bg-warning/10 text-warning",
  IMPORTED: "border-success/35 bg-success/15 text-success",
  COMPLETED: "border-success/35 bg-success/15 text-success",
  DISCARDED: "border-danger/35 bg-danger/10 text-danger",
  REJECTED: "border-danger/35 bg-danger/10 text-danger",
  FAILED: "border-danger/35 bg-danger/10 text-danger",
};

function getStatusBadgeClass(status: string) {
  return [
    "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium normal-case tracking-normal",
    statusBadgeClasses[status] ?? "border-border bg-surface-muted text-muted",
  ].join(" ");
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}
function getReviewJson(value: unknown): ReviewRowJson {
  return value && typeof value === "object" ? (value as ReviewRowJson) : {};
}

function getRawJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function normalizeSearchValue(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function normalizeEmailValue(value?: string | null) {
  return (value ?? "").trim().toLocaleLowerCase("pt-BR");
}

function getImportsHref({
  status,
  row,
  query,
}: {
  status?: string;
  row?: string;
  query?: string;
}) {
  const search = new URLSearchParams();

  if (status && status !== "ALL") {
    search.set("status", status);
  }

  if (query) {
    search.set("query", query);
  }

  if (row) {
    search.set("row", row);
  }

  const value = search.toString();
  return value ? `/imports?${value}` : "/imports";
}

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser = await getAppUser(user);

  if (!appUser) {
    redirect("/onboarding");
  }

  const suspendedRedirectPath = redirectPathForTenantStatus(appUser);

  if (suspendedRedirectPath) {
    redirect(suspendedRedirectPath);
  }

  if (appUser.role !== "OWNER") {
    redirect("/dashboard?error=Somente%20Owner%20pode%20importar%20dados.");
  }

  const params = await searchParams;
  const [
    activeImport,
    activeTeamsWithLeader,
    unreadNotificationsCount,
    importMappingTemplates,
  ] = await Promise.all([
    prisma.importBatch.findFirst({
      where: {
        tenantId: appUser.tenantId,
        status: {
          in: activeImportStatuses,
        },
      },
      include: {
        rows: {
          orderBy: {
            rowNumber: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.team.findMany({
      where: {
        tenantId: appUser.tenantId,
        status: "ACTIVE",
        managerUserId: {
          not: null,
        },
      },
      include: {
        manager: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.notification.count({
      where: {
        tenantId: appUser.tenantId,
        recipientUserId: appUser.id,
        readAt: null,
      },
    }),
    prisma.importMappingTemplate.findMany({
      where: {
        tenantId: appUser.tenantId,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        mappingJson: true,
      },
    }),
  ]);

  const importedRows =
    activeImport?.rows.filter((row) => row.status === "IMPORTED").length ?? 0;
  const rejectedRows =
    activeImport?.rows.filter((row) => row.status === "REJECTED").length ?? 0;
  const approvedRows =
    activeImport?.rows.filter((row) => row.status === "APPROVED").length ?? 0;
  const pendingRows =
    activeImport?.rows.filter((row) =>
      ["REVIEWING", "APPROVED"].includes(row.status),
    ).length ?? 0;
  const currentStatusFilter = rowStatusFilters.some(
    (filter) => filter.value === params.status,
  )
    ? params.status!
    : "ALL";
  const currentSearchQuery = params.query?.trim() ?? "";
  const normalizedSearchQuery = normalizeSearchValue(currentSearchQuery);
  const filteredRows =
    activeImport?.rows.filter(
      (row) => currentStatusFilter === "ALL" || row.status === currentStatusFilter,
    ) ?? [];
  const visibleRows = filteredRows.filter((row) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const rowJson = getReviewJson(row.normalizedJson);
    return [rowJson.company?.name, rowJson.company?.legalName].some((value) =>
      normalizeSearchValue(value).includes(normalizedSearchQuery),
    );
  });
  const nextReviewRow = visibleRows.find((row) =>
    ["REVIEWING", "APPROVED"].includes(row.status),
  );
  const selectedRow =
    visibleRows.find((row) => row.id === params.row) ??
    nextReviewRow ??
    visibleRows[0] ??
    null;
  const reviewJson = getReviewJson(selectedRow?.normalizedJson);
  const history = reviewJson.history?.[0];
  const futureAction = reviewJson.futureActions?.[0];
  const warnings = (reviewJson.aiSuggestion?.warnings ?? []).filter(
    (warning) => warning !== "Nenhuma próxima ação futura foi identificada.",
  );
  const legalNameValue =
    reviewJson.company?.legalName || reviewJson.company?.name || "";
  const selectedFilterLabel =
    rowStatusFilters.find((filter) => filter.value === currentStatusFilter)?.label ??
    "Todas";
  const statusFilterOptions = rowStatusFilters.map((filter) => ({
    label: filter.label,
    href: getImportsHref({
      status: filter.value,
      query: currentSearchQuery || undefined,
    }),
    isActive: currentStatusFilter === filter.value,
  }));
  const isImportedRow = selectedRow?.status === "IMPORTED";
  const selectedExistingAccount = reviewJson.company?.name
    ? await prisma.account.findFirst({
        where: {
          tenantId: appUser.tenantId,
          name: {
            equals: reviewJson.company.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
          contacts: {
            where: {
              email: {
                not: null,
              },
            },
            select: {
              email: true,
            },
          },
        },
      })
    : null;
  const existingContactEmails = new Set(
    selectedExistingAccount?.contacts
      .map((contact) => normalizeEmailValue(contact.email))
      .filter(Boolean) ?? [],
  );
  const repeatedContactEmails = Array.from(
    new Set(
      (reviewJson.contacts ?? [])
        .map((contact) => normalizeEmailValue(contact.email))
        .filter((email) => email && existingContactEmails.has(email)),
    ),
  );
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Importação Temporária"
            subtitle="Revise e corrija cada linha antes de enviar para a base definitiva."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={userIdentity}
              email={userEmail}
              role={userRole}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium"
            >
              <ArrowLeft size={16} aria-hidden />
              Dashboard
            </Link>
            <AppSettingsMenu canManageCompanySettings canImportData />
            <form action={signOutAction}>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        {(params.error || params.message) && (
          <section
            className={[
              "rounded-md border px-4 py-3 text-sm",
              params.error
                ? "border-danger text-danger"
                : "border-border bg-surface text-muted",
            ].join(" ")}
          >
            {params.error ?? params.message}
          </section>
        )}

        {activeImport && (
          <section className="rounded-md border border-border bg-surface">
            <div className="grid gap-0 divide-y divide-border lg:grid-cols-[minmax(0,1.8fr)_auto_repeat(4,minmax(8rem,0.45fr))] lg:divide-x lg:divide-y-0">
            <div className="min-w-0 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Origem da Carga
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {activeImport?.fileName ?? "Nenhuma carga ativa"}
              </p>
              {activeImport?.sourcePath ? (
                <p className="mt-1 truncate text-xs text-muted" title={activeImport.sourcePath}>
                  {activeImport.sourcePath}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-center px-3 py-3">
              {activeImport ? (
                <>
                  <form
                    id="discard-import-batch-form"
                    action={discardImportBatchAction}
                    className="hidden"
                  >
                    <input type="hidden" name="batchId" value={activeImport.id} />
                  </form>
                  <ConfirmSubmitButton
                    formId="discard-import-batch-form"
                    title="Descartar Carga Temporária"
                    message="Esta ação marca a carga atual como descartada e libera o tenant para iniciar outra importação. Linhas já importadas para a base definitiva não serão apagadas."
                    confirmLabel="Descartar Carga"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-danger px-3 text-xs font-medium text-danger"
                  >
                    <Trash2 size={14} aria-hidden />
                    Descartar Carga
                  </ConfirmSubmitButton>
                </>
              ) : null}
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Linhas
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none">
                {activeImport?.totalRows ?? 0}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Pendentes
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none">
                {pendingRows}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Importadas
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none">
                {importedRows}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Rejeitadas
              </p>
              <p className="mt-1 text-2xl font-semibold leading-none">
                {rejectedRows}
              </p>
            </div>
            </div>
          </section>
        )}

        {!activeImport && (
          <ImportMappingStarter mappingTemplates={importMappingTemplates} />
        )}

        {activeImport && (
          <section className="grid gap-5 lg:grid-cols-[20rem_1fr]">
            <aside className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="p-3">
                <form
                  id="import-approved-rows-form"
                  action={importApprovedRowsAction}
                  className="hidden"
                >
                  <input type="hidden" name="batchId" value={activeImport.id} />
                </form>
                <div className="flex items-center gap-2">
                  <form action="/imports" className="min-w-0 flex flex-1 items-center gap-1">
                    {currentStatusFilter !== "ALL" ? (
                      <input type="hidden" name="status" value={currentStatusFilter} />
                    ) : null}
                    <label className="sr-only" htmlFor="import-prospect-search">
                      Buscar Empresa ou Prospect
                    </label>
                    <input
                      id="import-prospect-search"
                      name="query"
                      type="search"
                      defaultValue={currentSearchQuery}
                      placeholder="Buscar Prospect"
                      className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                    />
                    <button
                      type="submit"
                      aria-label="Buscar Empresa ou Prospect"
                      title="Buscar Empresa ou Prospect"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted"
                    >
                      <Search size={14} aria-hidden />
                    </button>
                  </form>
                  <ImportStatusFilter
                    label={selectedFilterLabel}
                    options={statusFilterOptions}
                  />
                </div>
                <div className="mt-3 rounded-md border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-semibold">
                        <UsersRound size={14} className="text-primary" aria-hidden />
                        Encaminhar Para Equipe
                      </p>
                      <p className="mt-1 text-xs leading-4 text-muted">
                        O líder recebe os prospects e uma notificação para distribuir.
                      </p>
                    </div>
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-primary">
                      {approvedRows}
                    </span>
                  </div>
                  <select
                    form="import-approved-rows-form"
                    name="teamId"
                    className="mt-3 h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                    defaultValue=""
                  >
                    <option value="">Sem encaminhamento</option>
                    {activeTeamsWithLeader.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} - {team.manager?.name ?? "Líder"}
                      </option>
                    ))}
                  </select>
                  <ConfirmSubmitButton
                    formId="import-approved-rows-form"
                    title="Importar Linhas Aprovadas"
                    message={`Importar ${approvedRows} linha(s) aprovada(s) para a Base Comercial? Se uma equipe for selecionada, os prospects serão atribuídos ao líder e ele receberá uma notificação.`}
                    confirmLabel="Importar Aprovadas"
                    disabled={approvedRows === 0}
                    confirmClassName="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <FileCheck2 size={14} aria-hidden />
                    Importar {approvedRows} Aprovada(s)
                  </ConfirmSubmitButton>
                </div>
              </div>
              <div className="max-h-[41rem] overflow-auto p-2">
                {visibleRows.length === 0 && (
                  <div className="rounded border border-dashed border-border px-3 py-6 text-center text-xs leading-5 text-muted">
                    Nenhuma linha encontrada para os filtros aplicados.
                  </div>
                )}
                {visibleRows.map((row) => {
                  const rowJson = getReviewJson(row.normalizedJson);
                  const isSelected = row.id === selectedRow?.id;
                  const rowHref = getImportsHref({
                    status: currentStatusFilter,
                    row: row.id,
                    query: currentSearchQuery || undefined,
                  });

                  return (
                    <Link
                      key={row.id}
                      href={rowHref}
                      className={[
                        "mb-1 block rounded border px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-surface-muted"
                          : "border-transparent hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          Linha {row.rowNumber}
                        </span>
                        <span className={getStatusBadgeClass(row.status)}>
                          {statusLabels[row.status]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs leading-5 text-muted">
                        {rowJson.company?.name ?? "Empresa a Revisar"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <div className="grid gap-4">
              {selectedRow ? (
                <section
                  key={selectedRow.id}
                  className="overflow-hidden rounded-md border border-border bg-surface"
                >
                <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      <span>Linha {selectedRow.rowNumber}</span>
                      <span className={getStatusBadgeClass(selectedRow.status)}>
                        {statusLabels[selectedRow.status]}
                      </span>
                    </p>
                    <h2 className="mt-1 text-base font-semibold">
                      {reviewJson.company?.name ?? "Empresa a Revisar"}
                    </h2>
                  </div>
                  <div className="text-xs text-muted">
                    Confiança:{" "}
                    {Math.round((reviewJson.aiSuggestion?.confidence ?? 0) * 100)}%
                  </div>
                </div>

                {selectedExistingAccount && (
                  <div
                    role="status"
                    className="mx-4 mt-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm"
                  >
                    <div className="flex gap-3">
                      <Info
                        size={18}
                        className="mt-0.5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          Empresa/Prospect já existente
                        </p>
                        <p className="mt-1 leading-6 text-muted">
                          Esta linha será vinculada ao cadastro atual de{" "}
                          <Link
                            href={`/accounts/${selectedExistingAccount.id}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {selectedExistingAccount.name}
                          </Link>
                          . Os dados já cadastrados da Empresa/Prospect não serão
                          sobrescritos; a importação acrescenta histórico, ações e
                          contatos novos.
                        </p>
                        <p className="mt-1 leading-6 text-muted">
                          {repeatedContactEmails.length > 0
                            ? `Contatos com e-mail já cadastrado serão reaproveitados, sem duplicar: ${repeatedContactEmails.join(", ")}.`
                            : "Se algum contato da linha tiver e-mail já cadastrado nesse Prospect, ele será reaproveitado e não será duplicado."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="mx-4 mt-3 rounded border border-border bg-background px-3 py-2 text-xs text-muted">
                    {warnings.join(" ")}
                  </div>
                )}

                <form
                  id="review-import-row-form"
                  action={updateImportRowAction}
                  className="grid gap-0"
                >
                  <input type="hidden" name="rowId" value={selectedRow.id} />
                  <div className="grid gap-x-7 gap-y-3 border-b border-border px-4 py-3 lg:grid-cols-12">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted lg:col-span-12">
                      Empresa/Prospect
                    </h3>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-5">
                      <span className="text-xs font-medium">Nome Fantasia/Empresa</span>
                      <input
                        required
                        name="companyName"
                        defaultValue={reviewJson.company?.name ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">Razão Social</span>
                      <input
                        name="legalName"
                        defaultValue={legalNameValue}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-56 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">CNPJ</span>
                      <CnpjInput
                        name="document"
                        defaultValue={reviewJson.company?.document ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Fornecedor/Atividade/Marca</span>
                      <input
                        name="mainSupplier"
                        defaultValue={reviewJson.company?.mainSupplier ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Cidade</span>
                      <input
                        name="city"
                        defaultValue={reviewJson.company?.city ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-24 gap-1 text-sm lg:col-span-2">
                      <span className="text-xs font-medium">UF</span>
                      <input
                        name="state"
                        maxLength={2}
                        defaultValue={reviewJson.company?.state ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-40 gap-1 text-sm lg:col-span-2">
                      <span className="text-xs font-medium">CEP</span>
                      <input
                        name="postalCode"
                        defaultValue={reviewJson.company?.postalCode ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">Endereço</span>
                      <input
                        name="address"
                        defaultValue={reviewJson.company?.address ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-32 gap-1 text-sm lg:col-span-2">
                      <span className="text-xs font-medium">Número</span>
                      <input
                        name="addressNumber"
                        defaultValue={reviewJson.company?.addressNumber ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Complemento</span>
                      <input
                        name="addressComplement"
                        defaultValue={reviewJson.company?.addressComplement ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Bairro</span>
                      <input
                        name="district"
                        defaultValue={reviewJson.company?.district ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">Site</span>
                      <input
                        name="website"
                        defaultValue={reviewJson.company?.website ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">Segmento</span>
                      <input
                        name="segment"
                        defaultValue={reviewJson.company?.segment ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>

                  <ImportReviewContacts
                    key={selectedRow.id}
                    contacts={reviewJson.contacts ?? []}
                  />

                  <div className="grid gap-x-7 gap-y-3 px-4 py-3 lg:grid-cols-12">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted lg:col-span-12">
                      Ações e Observações
                    </h3>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-5">
                      <span className="text-xs font-medium">Título da Próxima Ação</span>
                      <input
                        name="nextActionTitle"
                        defaultValue={futureAction?.title ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-56 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Data e Hora</span>
                      <input
                        name="scheduledAt"
                        type="datetime-local"
                        defaultValue={formatDateTimeLocal(futureAction?.scheduledAt)}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-6">
                      <span className="text-xs font-medium">Descrição da Próxima Ação</span>
                      <textarea
                        name="nextActionDescription"
                        defaultValue={futureAction?.description ?? ""}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-6">
                      <span className="text-xs font-medium">Histórico Realizado</span>
                      <textarea
                        name="historyBody"
                        defaultValue={history?.body ?? ""}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-12">
                      <span className="text-xs font-medium">Observação Comercial</span>
                      <textarea
                        name="notes"
                        defaultValue={reviewJson.company?.notes ?? ""}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </form>

                <form
                  id="reprocess-import-row-contacts-form"
                  action={reprocessImportRowContactsAction}
                  className="hidden"
                >
                  <input type="hidden" name="rowId" value={selectedRow.id} />
                </form>

                <div className="sticky bottom-0 flex flex-wrap justify-start gap-2 border-t border-border bg-surface/95 px-4 py-3">
                  <button
                    form="review-import-row-form"
                    name="intent"
                    value="save"
                    disabled={isImportedRow}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Save size={14} aria-hidden />
                    Salvar Revisão
                  </button>
                  <ConfirmSubmitButton
                    formId="reprocess-import-row-contacts-form"
                    title="Reprocessar Contatos da Planilha"
                    message="O xCRM recriará a lista de contatos desta linha usando a célula original de e-mail. Alterações manuais feitas somente na lista de contatos desta revisão serão substituídas. Dados da Empresa/Prospect, ações e observações serão preservados."
                    confirmLabel="Reprocessar Contatos"
                    disabled={isImportedRow}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RefreshCw size={14} aria-hidden />
                    Reprocessar Contatos
                  </ConfirmSubmitButton>
                  <button
                    form="review-import-row-form"
                    name="intent"
                    value="approve"
                    disabled={isImportedRow}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary px-3 text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CheckCircle2 size={14} aria-hidden />
                    Aprovar Linha
                  </button>
                  <form action={importSingleRowAction} className="contents">
                    <input type="hidden" name="rowId" value={selectedRow.id} />
                    <button
                      disabled={isImportedRow}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <FileUp size={14} aria-hidden />
                      Importar Linha
                    </button>
                  </form>
                  <form action={rejectImportRowAction} className="contents">
                    <input type="hidden" name="rowId" value={selectedRow.id} />
                    <button
                      disabled={isImportedRow}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-danger px-3 text-xs font-medium text-danger disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <XCircle size={14} aria-hidden />
                      Rejeitar Linha
                    </button>
                  </form>
                </div>

                <details className="border-t border-border px-4 py-3">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Dados Originais da Planilha
                  </summary>
                  <pre className="mt-3 max-h-56 overflow-auto rounded bg-background p-3 text-xs leading-5 text-muted">
                    {getRawJson(selectedRow.rawJson)}
                  </pre>
                </details>
                </section>
              ) : (
                <section className="rounded-md border border-border bg-surface px-5 py-8 text-sm text-muted">
                  Nenhuma linha disponível para o filtro {selectedFilterLabel}.
                </section>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
