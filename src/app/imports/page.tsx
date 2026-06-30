import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  LogOut,
  Save,
  Trash2,
  Upload,
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
  startImportBatchAction,
  updateImportRowAction,
} from "@/app/imports/actions";
import { signOutAction } from "@/app/auth/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { CnpjInput } from "@/components/cnpj-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ImportStatusFilter } from "@/components/import-status-filter";
import { UserIdentityCard } from "@/components/user-identity-card";
import type { JobStatus } from "@/generated/prisma/client";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { getImportSettings } from "@/lib/imports/settings";
import { listImportFiles } from "@/lib/imports/spreadsheet";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ImportsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    row?: string;
    status?: string;
  }>;
};

type ReviewRowJson = {
  company?: {
    name?: string | null;
    legalName?: string | null;
    document?: string | null;
    city?: string | null;
    state?: string | null;
    address?: string | null;
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
    settings,
    files,
    activeImport,
    activeTeamsWithLeader,
    unreadNotificationsCount,
  ] = await Promise.all([
    getImportSettings(),
    listImportFiles(),
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
  const filteredRows =
    activeImport?.rows.filter(
      (row) => currentStatusFilter === "ALL" || row.status === currentStatusFilter,
    ) ?? [];
  const visibleRows = filteredRows;
  const nextReviewRow = visibleRows.find((row) =>
    ["REVIEWING", "APPROVED"].includes(row.status),
  );
  const selectedRow =
    visibleRows.find((row) => row.id === params.row) ??
    nextReviewRow ??
    visibleRows[0] ??
    null;
  const reviewJson = getReviewJson(selectedRow?.normalizedJson);
  const primaryContact = reviewJson.contacts?.[0];
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
    href: filter.value === "ALL" ? "/imports" : `/imports?status=${filter.value}`,
    isActive: currentStatusFilter === filter.value,
  }));
  const isImportedRow = selectedRow?.status === "IMPORTED";
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Importação Temporária
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Revise e corrija cada linha antes de enviar para a base definitiva.
            </p>
          </div>
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

        <section className="rounded-md border border-border bg-surface">
          <div className="grid gap-0 divide-y divide-border lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(8rem,0.45fr))] lg:divide-x lg:divide-y-0">
            <div className="min-w-0 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Origem da Carga
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {activeImport?.fileName ?? "Nenhuma carga ativa"}
              </p>
              <p className="mt-1 truncate text-xs text-muted">
                {settings.spreadsheetImportPath}
              </p>
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

        {!activeImport && (
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Iniciar Carga Temporária</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Somente o Owner pode iniciar a carga. Enquanto uma carga estiver
                  em andamento, outra importação fica bloqueada.
                </p>
              </div>
              <FileSpreadsheet size={22} className="text-primary" aria-hidden />
            </div>

            <form action={startImportBatchAction} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Arquivo da Pasta Parametrizada</span>
                <select
                  required
                  name="fileName"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione um arquivo
                  </option>
                  {files.map((file) => (
                    <option key={file.fileName} value={file.fileName}>
                      {file.fileName}
                    </option>
                  ))}
                </select>
              </label>
              <button className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Upload size={16} aria-hidden />
                Carregar
              </button>
            </form>
          </section>
        )}

        {activeImport && (
          <section className="grid gap-5 lg:grid-cols-[20rem_1fr]">
            <aside className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {activeImport.fileName}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {pendingRows} pendentes na fila
                    </p>
                  </div>
                  <span className="rounded bg-surface-muted px-2 py-1 text-xs text-primary">
                    {activeImport.totalRows}
                  </span>
                </div>
                <form
                  id="discard-import-batch-form"
                  action={discardImportBatchAction}
                  className="hidden"
                >
                  <input type="hidden" name="batchId" value={activeImport.id} />
                </form>
                <form
                  id="import-approved-rows-form"
                  action={importApprovedRowsAction}
                  className="hidden"
                >
                  <input type="hidden" name="batchId" value={activeImport.id} />
                </form>
                <div className="mt-3 flex items-center justify-between gap-3">
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
                      <p className="mt-1 text-[11px] leading-4 text-muted">
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
                    Nenhuma linha encontrada para o filtro {selectedFilterLabel}.
                  </div>
                )}
                {visibleRows.map((row) => {
                  const rowJson = getReviewJson(row.normalizedJson);
                  const isSelected = row.id === selectedRow?.id;
                  const rowHref =
                    currentStatusFilter === "ALL"
                      ? `/imports?row=${row.id}`
                      : `/imports?status=${currentStatusFilter}&row=${row.id}`;

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
                        <span className="rounded bg-background px-2 py-0.5 text-[10px] text-muted">
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
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      Linha {selectedRow.rowNumber} · {statusLabels[selectedRow.status]}
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
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">Endereço</span>
                      <input
                        name="address"
                        defaultValue={reviewJson.company?.address ?? ""}
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

                  <div className="grid gap-x-7 gap-y-3 border-b border-border px-4 py-3 lg:grid-cols-12">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted lg:col-span-12">
                      Contato Principal
                    </h3>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Contato Principal</span>
                      <input
                        name="contactName"
                        defaultValue={primaryContact?.name ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-3">
                      <span className="text-xs font-medium">Cargo do Contato</span>
                      <input
                        name="contactRole"
                        defaultValue={primaryContact?.role ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm lg:col-span-4">
                      <span className="text-xs font-medium">E-mail do Contato</span>
                      <input
                        name="contactEmail"
                        type="email"
                        defaultValue={primaryContact?.email ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid w-full max-w-56 gap-1 text-sm lg:col-span-2">
                      <span className="text-xs font-medium">Telefone do Contato</span>
                      <input
                        name="contactPhone"
                        defaultValue={primaryContact?.phone ?? ""}
                        className="h-9 w-full rounded border border-border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>

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
