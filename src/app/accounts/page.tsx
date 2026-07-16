import {
  BrushCleaning,
  Building2,
  CalendarClock,
  Filter,
  History,
  LogOut,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAccountAction } from "@/app/accounts/actions";
import { signOutAction } from "@/app/auth/actions";
import { ActionDateTimeInput } from "@/components/action-date-time-input";
import {
  AccountCreateActions,
  AccountsTabsNavigation,
} from "@/components/accounts-tabs";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { TenantBrand } from "@/components/tenant-brand";
import { UppercaseInput } from "@/components/uppercase-input";
import { UserIdentityCard } from "@/components/user-identity-card";
import type { Prisma } from "@/generated/prisma/client";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccountVisibilityWhere,
  getOpportunityVisibilityWhere,
} from "@/lib/visibility";

const accountStatusOptions = [
  { value: "", label: "Todos" },
  { value: "PROSPECT", label: "Prospects" },
  { value: "CUSTOMER", label: "Clientes" },
  { value: "LOST", label: "Perdidos" },
  { value: "ARCHIVED", label: "Arquivados" },
] as const;

const accountStatusLabels: Record<string, string> = {
  PROSPECT: "Prospect",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
};

const dashboardPeriodOptions = [7, 30, 90] as const;

type PipelineStageOption = {
  id: string;
  name: string;
};

type PipelineFilter =
  | {
      type: "stage";
      stage: PipelineStageOption;
      value: string;
    }
  | {
      type: "won" | "lost" | "outside";
      value: string;
    };

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const interactionSummaryLabels: Record<string, string> = {
  "Cadastro atualizado": "Dados Atualizados",
  "Prospect criado": "Prospect Criado",
};

function formatInteractionSummary(summary?: string | null) {
  if (!summary) {
    return "Histórico ainda não registrado";
  }

  return interactionSummaryLabels[summary] ?? summary;
}

function getStatusFilter(value?: string) {
  return accountStatusOptions.find((option) => option.value === value)?.value;
}

function getPeriodDays(value?: string) {
  const parsed = Number(value);
  return dashboardPeriodOptions.includes(
    parsed as (typeof dashboardPeriodOptions)[number],
  )
    ? (parsed as (typeof dashboardPeriodOptions)[number])
    : 30;
}

function getPipelineFilter(
  value: string | undefined,
  stages: PipelineStageOption[],
): PipelineFilter | null {
  const normalizedValue = String(value ?? "").trim();

  if (normalizedValue.startsWith("stage:")) {
    const stageId = normalizedValue.slice("stage:".length);
    const stage = stages.find((item) => item.id === stageId);

    if (stage) {
      return {
        type: "stage",
        stage,
        value: normalizedValue,
      };
    }
  }

  if (["won", "lost", "outside"].includes(normalizedValue)) {
    return {
      type: normalizedValue as "won" | "lost" | "outside",
      value: normalizedValue,
    };
  }

  return null;
}

function getPipelineFilterLabel(
  filter: PipelineFilter,
  periodDays: number,
) {
  if (filter.type === "stage") {
    return `Etapa: ${filter.stage.name}`;
  }

  if (filter.type === "won") {
    return `Ganhas nos Últimos ${periodDays} Dias`;
  }

  if (filter.type === "lost") {
    return `Perdidas nos Últimos ${periodDays} Dias`;
  }

  return "Fora do Pipeline";
}

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

type AccountsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    q?: string;
    status?: string;
    pipeline?: string;
    period?: string;
    tab?: string;
  }>;
};

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
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

  const params = await searchParams;
  const searchQuery = String(params.q ?? "").trim();
  const selectedStatus = getStatusFilter(params.status);
  const periodDays = getPeriodDays(params.period);
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays + 1);
  periodStart.setHours(0, 0, 0, 0);

  const [visibilityWhere, opportunityVisibilityWhere, pipelineStages] =
    await Promise.all([
      getAccountVisibilityWhere(appUser),
      getOpportunityVisibilityWhere(appUser),
      prisma.pipelineStage.findMany({
        where: {
          tenantId: appUser.tenantId,
          pipeline: { isDefault: true },
          isWon: false,
          isLost: false,
        },
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const selectedPipeline = getPipelineFilter(params.pipeline, pipelineStages);
  const accountFilters: Prisma.AccountWhereInput[] = [visibilityWhere];

  if (selectedStatus) {
    accountFilters.push({ status: selectedStatus });
  }

  if (selectedPipeline?.type === "stage") {
    accountFilters.push({
      opportunities: {
        some: {
          tenantId: appUser.tenantId,
          status: "OPEN",
          stageId: selectedPipeline.stage.id,
          ...opportunityVisibilityWhere,
        },
      },
    });
  } else if (
    selectedPipeline?.type === "won" ||
    selectedPipeline?.type === "lost"
  ) {
    accountFilters.push({
      opportunities: {
        some: {
          tenantId: appUser.tenantId,
          ...opportunityVisibilityWhere,
          stageMovements: {
            some: {
              tenantId: appUser.tenantId,
              changedAt: { gte: periodStart },
              toStage:
                selectedPipeline.type === "won"
                  ? { isWon: true }
                  : { isLost: true },
            },
          },
        },
      },
    });
  } else if (selectedPipeline?.type === "outside") {
    accountFilters.push({
      status: "PROSPECT",
      opportunities: {
        none: {
          status: "OPEN",
        },
      },
    });
  }

  if (searchQuery) {
    accountFilters.push({
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { city: { contains: searchQuery, mode: "insensitive" } },
        { state: { contains: searchQuery, mode: "insensitive" } },
        { website: { contains: searchQuery, mode: "insensitive" } },
        { mainSupplier: { contains: searchQuery, mode: "insensitive" } },
        { source: { contains: searchQuery, mode: "insensitive" } },
        {
          contacts: {
            some: {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { email: { contains: searchQuery, mode: "insensitive" } },
                { phone: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  const accountsWhere: Prisma.AccountWhereInput = {
    tenantId: appUser.tenantId,
    AND: accountFilters,
  };
  const [
    accounts,
    matchingCount,
    visibleTotalCount,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.account.findMany({
      where: accountsWhere,
      include: {
        contacts: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
        activities: {
          where: {
            status: "PENDING",
          },
          orderBy: [
            {
              scheduledAt: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
          take: 1,
        },
        interactions: {
          orderBy: {
            occurredAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
    prisma.account.count({
      where: accountsWhere,
    }),
    prisma.account.count({
      where: {
        tenantId: appUser.tenantId,
        ...visibilityWhere,
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
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();
  const hasActiveFilters = Boolean(
    searchQuery || selectedStatus || selectedPipeline,
  );
  const pipelineFilterLabel = selectedPipeline
    ? getPipelineFilterLabel(selectedPipeline, periodDays)
    : null;
  const activeTab = params.tab === "new" ? "new" : "base";
  const preservedParams = new URLSearchParams();

  if (searchQuery) {
    preservedParams.set("q", searchQuery);
  }

  if (selectedStatus) {
    preservedParams.set("status", selectedStatus);
  }

  if (selectedPipeline) {
    preservedParams.set("pipeline", selectedPipeline.value);

    if (
      selectedPipeline.type === "won" ||
      selectedPipeline.type === "lost"
    ) {
      preservedParams.set("period", String(periodDays));
    }
  }

  const baseTabParams = new URLSearchParams(preservedParams);
  baseTabParams.set("tab", "base");
  const newTabParams = new URLSearchParams(preservedParams);
  newTabParams.set("tab", "new");
  const baseTabHref = `/accounts?${baseTabParams.toString()}`;
  const newTabHref = `/accounts?${newTabParams.toString()}`;
  const canOpenCompanySettings = canManageCompanySettings(appUser.role);
  const canImportData = appUser.role === "OWNER";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Empresas/Prospects"
            subtitle="Consulte a Base Comercial ou cadastre uma nova Empresa/Prospect quando necessário."
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
              className="inline-flex h-12 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
            >
              Dashboard
            </Link>
            <AppSettingsMenu
              canManageCompanySettings={canOpenCompanySettings}
              canImportData={canImportData}
            />
            <form action={signOutAction}>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        <AccountsTabsNavigation
          activeTab={activeTab}
          baseHref={baseTabHref}
          newHref={newTabHref}
        />

        {activeTab === "new" ? (
          <section
            id="new-accounts-panel"
            role="tabpanel"
            aria-labelledby="new-accounts-tab"
          >
            <div className="mx-auto w-full max-w-5xl rounded-md border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Plus size={18} className="text-primary" aria-hidden />
                Nova Empresa/Prospect
              </h2>
              <p className="text-sm text-muted">
                Comece pelo nome da empresa. O Contato Principal é opcional.
              </p>
            </div>

            {(params.error || params.message) && (
              <div
                className={[
                  "mx-4 mt-4 rounded-md border px-3 py-2 text-sm",
                  params.error
                    ? "border-danger text-danger"
                    : "border-border text-muted",
                ].join(" ")}
              >
                {params.error ?? params.message}
              </div>
            )}

            <form
              id="new-account-form"
              action={createAccountAction}
              className="grid gap-5 p-5"
            >
              <input type="hidden" name="returnTo" value={newTabHref} />
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Empresa/Prospect</span>
                <UppercaseInput
                  required
                  name="accountName"
                  autoComplete="organization"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem]">
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">Cidade</span>
                  <input
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">UF</span>
                  <select
                    name="state"
                    defaultValue=""
                    autoComplete="address-level1"
                    className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm uppercase"
                  >
                    <option value="">UF</option>
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Site</span>
                <input
                  name="website"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">Fornecedor/Atividade/Marca</span>
                  <input
                    name="mainSupplier"
                    type="text"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">Origem</span>
                  <input
                    name="source"
                    type="text"
                    placeholder="Planilha, indicação, site..."
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>

              <div className="rounded-md border border-border bg-background p-3">
                <h3 className="text-sm font-semibold">Contato Principal</h3>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Nome</span>
                      <input
                        name="contactName"
                        type="text"
                        autoComplete="name"
                        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Função/Cargo (Opcional)</span>
                      <input
                        name="contactTitle"
                        type="text"
                        autoComplete="organization-title"
                        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">E-mail</span>
                      <input
                        name="contactEmail"
                        type="email"
                        autoComplete="email"
                        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Telefone</span>
                      <input
                        name="contactPhone"
                        type="tel"
                        maxLength={15}
                        autoComplete="tel"
                        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-3">
                <h3 className="text-sm font-semibold">Próxima Ação</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Ação</span>
                    <input
                      name="nextActionTitle"
                      type="text"
                      placeholder="Retornar contato, agendar visita..."
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Data e Hora</span>
                    <ActionDateTimeInput
                      name="nextActionScheduledAt"
                      className="[&_input]:bg-surface [&_select]:bg-surface"
                    />
                  </label>
                </div>
              </div>

              <AccountCreateActions baseHref={baseTabHref} />
            </form>
          </div>

          </section>
        ) : (
          <section
            id="base-accounts-panel"
            role="tabpanel"
            aria-labelledby="base-accounts-tab"
          >
            <div
              id="base-comercial"
              className="scroll-mt-4 rounded-md border border-border bg-surface"
            >
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Base Comercial</h2>
                  <p className="text-sm text-muted">
                    {matchingCount} de {visibleTotalCount} registros visíveis.
                  </p>
                </div>
                <Building2 size={20} className="text-primary" aria-hidden />
              </div>

              <form
                className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_13rem_auto_auto]"
                method="get"
              >
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Buscar</span>
                  <span className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                    <input
                      name="q"
                      type="search"
                      defaultValue={searchQuery}
                      placeholder="Empresa, cidade, contato..."
                      className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                    />
                  </span>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Status</span>
                  <select
                    name="status"
                    defaultValue={selectedStatus ?? ""}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    {accountStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Funil</span>
                  <select
                    name="pipeline"
                    defaultValue={selectedPipeline?.value ?? ""}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Todo o Funil</option>
                    {pipelineStages.map((stage) => (
                      <option key={stage.id} value={`stage:${stage.id}`}>
                        Etapa: {stage.name}
                      </option>
                    ))}
                    <option value="won">Ganhas no Período</option>
                    <option value="lost">Perdidas no Período</option>
                    <option value="outside">Fora do Pipeline</option>
                  </select>
                </label>
                {selectedPipeline?.type === "won" ||
                selectedPipeline?.type === "lost" ? (
                  <input type="hidden" name="period" value={periodDays} />
                ) : null}
                <button
                  title="Aplicar Filtros"
                  aria-label="Aplicar Filtros"
                  className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  <Filter size={16} aria-hidden />
                  Filtrar
                </button>
                <Link
                  href="/accounts"
                  title="Limpar Filtros"
                  aria-label="Limpar Filtros"
                  className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md border border-border px-4 text-sm font-medium"
                >
                  <BrushCleaning size={16} aria-hidden />
                  Limpar
                </Link>
              </form>
            </div>

            {selectedPipeline && pipelineFilterLabel ? (
              <div className="border-b border-border bg-surface-muted px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  Filtro do Funil: {pipelineFilterLabel}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {selectedPipeline.type === "outside"
                    ? "Exibindo Prospects visíveis sem Oportunidade aberta."
                    : "O Dashboard conta Oportunidades; esta lista agrupa as Empresas/Prospects visíveis vinculadas a elas."}
                </p>
              </div>
            ) : null}

            {accounts.length === 0 ? (
              <div className="px-4 py-10 text-sm text-muted">
                {hasActiveFilters
                  ? "Nenhuma empresa/prospect encontrada com os filtros atuais."
                  : "Nenhuma empresa/prospect cadastrada ainda."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {accounts.map((account) => {
                  const primaryContact = account.contacts[0];
                  const nextActivity = account.activities[0];
                  const lastInteraction = account.interactions[0];
                  const nextActivityText = nextActivity
                    ? [
                        nextActivity.title,
                        nextActivity.scheduledAt
                          ? dateTimeFormatter.format(nextActivity.scheduledAt)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" - ")
                    : "Sem Próxima Ação agendada";

                  return (
                    <Link
                      key={account.id}
                      href={`/accounts/${account.id}`}
                      className="group grid cursor-pointer gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary md:grid-cols-[1.4fr_1fr]"
                      aria-label={`Editar Empresa/Prospect ${account.name}`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                            {account.name}
                          </h3>
                          <span className="rounded bg-surface-muted px-2 py-1 text-xs font-medium text-muted">
                            {accountStatusLabels[account.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {[account.city, account.state]
                            .filter(Boolean)
                            .join(" - ") || "Localização não informada"}
                        </p>
                        <p className="text-xs leading-5 text-muted">
                          {account.website ?? "Site não informado"}
                        </p>
                        <div className="mt-3 grid gap-2 text-xs leading-5 text-muted">
                          <p className="flex items-center gap-2">
                            <History
                              size={14}
                              className="text-primary"
                              aria-hidden
                            />
                            Último Histórico:{" "}
                            {formatInteractionSummary(lastInteraction?.summary)}
                          </p>
                          <p className="flex items-center gap-2">
                            <CalendarClock
                              size={14}
                              className="text-primary"
                              aria-hidden
                            />
                            {nextActivityText}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-background p-3 text-xs leading-5 text-muted">
                        <div className="flex items-center gap-2 text-foreground">
                          <UserRound size={14} aria-hidden />
                          <span className="font-medium">
                            {primaryContact?.name ?? "Contato não informado"}
                          </span>
                        </div>
                        <p className="mt-1">
                          {primaryContact?.email ?? "E-mail não informado"}
                        </p>
                        <p>{primaryContact?.phone ?? "Telefone não informado"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
