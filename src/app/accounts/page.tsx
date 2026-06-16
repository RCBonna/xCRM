import {
  Building2,
  CalendarClock,
  Filter,
  History,
  LogOut,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAccountAction } from "@/app/accounts/actions";
import { signOutAction } from "@/app/auth/actions";
import { ActionDateTimeInput } from "@/components/action-date-time-input";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { UppercaseInput } from "@/components/uppercase-input";
import type { Prisma } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/auth";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function canSeeTenantAccounts(role: string) {
  return ["OWNER", "ADMIN", "MANAGER"].includes(role);
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

  const params = await searchParams;
  const searchQuery = String(params.q ?? "").trim();
  const selectedStatus = getStatusFilter(params.status);
  const roleCanSeeTenantAccounts = canSeeTenantAccounts(appUser.role);
  const visibilityWhere: Prisma.AccountWhereInput = roleCanSeeTenantAccounts
    ? {}
    : { ownerUserId: appUser.id };
  const accountsWhere: Prisma.AccountWhereInput = {
    tenantId: appUser.tenantId,
    ...visibilityWhere,
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(searchQuery
      ? {
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
        }
      : {}),
  };
  const [accounts, matchingCount, visibleTotalCount] = await Promise.all([
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
  ]);
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();
  const hasActiveFilters = Boolean(searchQuery || selectedStatus);
  const canOpenCompanySettings = canManageCompanySettings(appUser.role);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Empresas/Prospects
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Cadastre a Base Comercial inicial e registre um Contato Principal
              quando ele já estiver disponível.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-12 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                <UserRound size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium leading-4">
                  {userIdentity}
                </p>
                <p className="truncate text-[11px] leading-4 text-muted">
                  {userEmail} - {userRole}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
            >
              Dashboard
            </Link>
            <AppSettingsMenu
              canManageCompanySettings={canOpenCompanySettings}
            />
            <form action={signOutAction}>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="rounded-md border border-border bg-surface">
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

            <form action={createAccountAction} className="grid gap-4 p-4">
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
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Nome</span>
                    <input
                      name="contactName"
                      type="text"
                      autoComplete="name"
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
                    />
                  </label>
                  <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_10rem]">
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
                <div className="mt-3 grid gap-3">
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

              <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                Cadastrar Empresa/Prospect
              </button>
            </form>
          </div>

          <div className="rounded-md border border-border bg-surface">
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
                className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem_auto_auto]"
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
                <button className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Filter size={16} aria-hidden />
                  Filtrar
                </button>
                {hasActiveFilters && (
                  <Link
                    href="/accounts"
                    className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md border border-border px-4 text-sm font-medium"
                  >
                    <X size={16} aria-hidden />
                    Limpar
                  </Link>
                )}
              </form>
            </div>

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
                    <article
                      key={account.id}
                      className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="hover:text-primary"
                            >
                              {account.name}
                            </Link>
                          </h3>
                          <span className="rounded bg-surface-muted px-2 py-1 text-[11px] font-medium text-muted">
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
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
