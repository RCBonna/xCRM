import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LogOut,
  MoveRight,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";

import { signOutAction } from "@/app/auth/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import type { Prisma } from "@/generated/prisma/client";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccountVisibilityWhere,
  getActivityVisibilityWhere,
  getOpportunityVisibilityWhere,
} from "@/lib/visibility";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

const periodOptions = [7, 30, 90] as const;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

function getPeriodDays(value?: string) {
  const parsed = Number(value);
  return periodOptions.includes(parsed as (typeof periodOptions)[number])
    ? (parsed as (typeof periodOptions)[number])
    : 30;
}

function getScopeLabel(role: string) {
  if (["OWNER", "ADMIN"].includes(role)) return "Toda a Organização";
  if (role === "MANAGER") return "Minha Equipe";
  return "Minha Carteira";
}

function getScopeSubtitle(role: string) {
  if (["OWNER", "ADMIN"].includes(role)) return "Visão da Organização";
  if (role === "MANAGER") return "Visão da Equipe";
  return "Minha Visão Comercial";
}

function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0));
}

function sumEstimatedValues(
  items: Array<{ opportunity: { amountEstimated: unknown } }>,
) {
  return items.reduce(
    (total, item) => total + Number(item.opportunity.amountEstimated ?? 0),
    0,
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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
  const periodDays = getPeriodDays(params.period);
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays + 1);
  periodStart.setHours(0, 0, 0, 0);

  const now = new Date();
  const [
    opportunityVisibilityWhere,
    accountVisibilityWhere,
    activityVisibilityWhere,
  ] =
    await Promise.all([
      getOpportunityVisibilityWhere(appUser),
      getAccountVisibilityWhere(appUser),
      getActivityVisibilityWhere(appUser),
    ]);

  const openOpportunityWhere: Prisma.OpportunityWhereInput = {
    tenantId: appUser.tenantId,
    status: "OPEN",
    ...opportunityVisibilityWhere,
  };

  const [
    stages,
    prospectCount,
    prospectsWithoutOpenOpportunity,
    openStageGroups,
    opportunitiesWithoutCloseDate,
    opportunitiesWithoutEstimatedValue,
    overdueActivityCount,
    overdueActivities,
    newProspectCount,
    createdOpportunitySummary,
    completedActivityCount,
    wonMovements,
    lostMovements,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: {
        tenantId: appUser.tenantId,
        pipeline: { isDefault: true },
      },
      orderBy: { position: "asc" },
    }),
    prisma.account.count({
      where: {
        tenantId: appUser.tenantId,
        status: "PROSPECT",
        ...accountVisibilityWhere,
      },
    }),
    prisma.account.count({
      where: {
        tenantId: appUser.tenantId,
        status: "PROSPECT",
        ...accountVisibilityWhere,
        opportunities: { none: { status: "OPEN" } },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["stageId"],
      where: openOpportunityWhere,
      _count: { _all: true },
      _sum: { amountEstimated: true },
    }),
    prisma.opportunity.count({
      where: {
        ...openOpportunityWhere,
        expectedCloseDate: null,
      },
    }),
    prisma.opportunity.count({
      where: {
        ...openOpportunityWhere,
        amountEstimated: null,
      },
    }),
    prisma.activity.count({
      where: {
        tenantId: appUser.tenantId,
        status: "PENDING",
        scheduledAt: { lt: now },
        ...activityVisibilityWhere,
      },
    }),
    prisma.activity.findMany({
      where: {
        tenantId: appUser.tenantId,
        status: "PENDING",
        scheduledAt: { lt: now },
        ...activityVisibilityWhere,
      },
      select: {
        id: true,
        title: true,
        priority: true,
        scheduledAt: true,
        account: { select: { id: true, name: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: 5,
    }),
    prisma.account.count({
      where: {
        tenantId: appUser.tenantId,
        status: "PROSPECT",
        createdAt: { gte: periodStart },
        ...accountVisibilityWhere,
      },
    }),
    prisma.opportunity.aggregate({
      where: {
        tenantId: appUser.tenantId,
        createdAt: { gte: periodStart },
        ...opportunityVisibilityWhere,
      },
      _count: { _all: true },
      _sum: { amountEstimated: true },
    }),
    prisma.activity.count({
      where: {
        tenantId: appUser.tenantId,
        status: "COMPLETED",
        completedAt: { gte: periodStart },
        ...activityVisibilityWhere,
      },
    }),
    prisma.stageMovement.findMany({
      where: {
        tenantId: appUser.tenantId,
        changedAt: { gte: periodStart },
        toStage: { isWon: true },
        opportunity: opportunityVisibilityWhere,
      },
      distinct: ["opportunityId"],
      orderBy: { changedAt: "desc" },
      select: {
        opportunity: { select: { amountEstimated: true } },
      },
    }),
    prisma.stageMovement.findMany({
      where: {
        tenantId: appUser.tenantId,
        changedAt: { gte: periodStart },
        toStage: { isLost: true },
        opportunity: opportunityVisibilityWhere,
      },
      distinct: ["opportunityId"],
      orderBy: { changedAt: "desc" },
      select: {
        opportunity: { select: { amountEstimated: true } },
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

  const stageGroupsById = new Map(
    openStageGroups.map((group) => [group.stageId, group]),
  );
  const openStageStats = stages
    .filter((stage) => !stage.isWon && !stage.isLost)
    .map((stage) => {
      const group = stageGroupsById.get(stage.id);
      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        count: group?._count._all ?? 0,
        amount: Number(group?._sum.amountEstimated ?? 0),
      };
    });
  const openOpportunityCount = openStageGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const openOpportunityAmount = openStageGroups.reduce(
    (total, group) => total + Number(group._sum.amountEstimated ?? 0),
    0,
  );
  const wonAmount = sumEstimatedValues(wonMovements);
  const lostAmount = sumEstimatedValues(lostMovements);
  const pipelineSegments = [
    ...openStageStats.map((stage) => ({
      ...stage,
      kind: "open" as const,
      periodLabel: null,
    })),
    {
      id: "won",
      name: "Ganhas",
      position: 0,
      count: wonMovements.length,
      amount: wonAmount,
      kind: "won" as const,
      periodLabel: `${periodDays} Dias`,
    },
    {
      id: "lost",
      name: "Perdidas",
      position: 0,
      count: lostMovements.length,
      amount: lostAmount,
      kind: "lost" as const,
      periodLabel: `${periodDays} Dias`,
    },
  ];

  const priority =
    overdueActivityCount > 0
      ? {
          title: `${numberFormatter.format(overdueActivityCount)} ${
            overdueActivityCount === 1
              ? "Atividade Atrasada"
              : "Atividades Atrasadas"
          }`,
          description: "Pendências com Data e Hora vencidas precisam de ação.",
          href: "/agenda?status=PENDING",
          cta: "Ver Agenda",
          tone: "warning" as const,
        }
      : opportunitiesWithoutCloseDate > 0
        ? {
            title: `${numberFormatter.format(opportunitiesWithoutCloseDate)} sem Previsão de Fechamento`,
            description:
              "Oportunidades abertas precisam de uma data para orientar o acompanhamento.",
            href: "/accounts",
            cta: "Ver Base Comercial",
            tone: "warning" as const,
          }
        : opportunitiesWithoutEstimatedValue > 0
          ? {
              title: `${numberFormatter.format(opportunitiesWithoutEstimatedValue)} sem Valor Estimado`,
              description:
                "Complete os valores para tornar o Pipeline mais confiável.",
              href: "/accounts",
              cta: "Ver Base Comercial",
              tone: "warning" as const,
            }
          : {
              title: "Operação em Dia",
              description:
                "Nenhuma atividade atrasada ou oportunidade aberta com dados críticos faltantes.",
              href: "/accounts",
              cta: "Abrir Base Comercial",
              tone: "success" as const,
            };

  const priorityIsWarning = priority.tone === "warning";
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = roleLabels[appUser.role] ?? appUser.role;
  const canOpenCompanySettings = canManageCompanySettings(appUser.role);
  const scopeLabel = getScopeLabel(appUser.role);
  const scopeSubtitle = getScopeSubtitle(appUser.role);
  const dashboardUpdatedAt = dateTimeFormatter.format(now);
  const pipelineStyle = {
    "--dashboard-stage-count": String(Math.max(pipelineSegments.length, 1)),
  } as CSSProperties;

  const movementItems = [
    {
      label: "Novos Prospects",
      value: numberFormatter.format(newProspectCount),
      icon: Building2,
      tone: "text-primary",
    },
    {
      label: "Oportunidades Criadas",
      value: numberFormatter.format(createdOpportunitySummary._count._all),
      icon: BriefcaseBusiness,
      tone: "text-primary",
    },
    {
      label: "Valor Estimado Criado",
      value: formatCurrency(createdOpportunitySummary._sum.amountEstimated),
      icon: CircleDollarSign,
      tone: "text-primary",
    },
    {
      label: "Oportunidades Ganhas",
      value: `${numberFormatter.format(wonMovements.length)} · ${formatCurrency(wonAmount)}`,
      icon: Trophy,
      tone: "text-success",
    },
    {
      label: "Oportunidades Perdidas",
      value: `${numberFormatter.format(lostMovements.length)} · ${formatCurrency(lostAmount)}`,
      icon: XCircle,
      tone: "text-danger",
    },
    {
      label: "Atividades Concluídas",
      value: numberFormatter.format(completedActivityCount),
      icon: CheckCircle2,
      tone: "text-success",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Painel do xCRM"
            subtitle={scopeSubtitle}
          />
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <UserIdentityCard
                name={userIdentity}
                email={userEmail}
                role={userRole}
                unreadNotificationsCount={unreadNotificationsCount}
              />
            </div>
            <AppSettingsMenu
              canManageCompanySettings={canOpenCompanySettings}
              canImportData={appUser.role === "OWNER"}
            />
            <form action={signOutAction}>
              <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        <section
          aria-label="Contexto do Dashboard"
          className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-3">
              <Building2 size={18} className="text-primary" aria-hidden />
              <span className="text-sm">
                <span className="block font-medium">Escopo</span>
                <span className="block text-muted">{scopeLabel}</span>
              </span>
            </div>
            <nav
              aria-label="Período dos Indicadores"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface p-1"
            >
              {periodOptions.map((option) => {
                const isActive = option === periodDays;
                return (
                  <Link
                    key={option}
                    href={`/dashboard?period=${option}`}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "inline-flex min-h-9 items-center rounded px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted hover:bg-surface-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {option} Dias
                  </Link>
                );
              })}
            </nav>
          </div>
          <p className="text-sm text-muted">Atualizado em {dashboardUpdatedAt}</p>
        </section>

        <section
          className={[
            "flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            priorityIsWarning
              ? "border-warning/70 bg-warning/5"
              : "border-success/60 bg-success/5",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={[
                "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface",
                priorityIsWarning ? "text-warning" : "text-success",
              ].join(" ")}
            >
              {priorityIsWarning ? (
                <AlertTriangle size={18} aria-hidden />
              ) : (
                <CheckCircle2 size={18} aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">Atenção Agora</p>
              <h2 className="text-base font-semibold leading-6">
                {priority.title}
              </h2>
              <p className="max-w-[70ch] text-sm leading-5 text-muted">
                {priority.description}
              </p>
            </div>
          </div>
          <Link
            href={priority.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
          >
            {priority.cta}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Target size={19} className="text-primary" aria-hidden />
                <h2 className="text-base font-semibold">
                  Pipeline de Oportunidades
                </h2>
              </div>
              <p className="mt-1 max-w-[65ch] text-sm leading-5 text-muted">
                Quantidade e Valor Estimado das Oportunidades abertas no seu
                escopo.
              </p>
            </div>
            <Link
              href="/accounts"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-surface-muted lg:self-auto"
            >
              Ver Base Comercial
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          <div className="grid divide-y divide-border border-b border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <div className="px-4 py-3">
              <p className="text-sm text-muted">Prospects Ativos</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {numberFormatter.format(prospectCount)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-muted">
                Prospects sem Oportunidade Aberta
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {numberFormatter.format(prospectsWithoutOpenOpportunity)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-muted">Oportunidades Abertas</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {numberFormatter.format(openOpportunityCount)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-muted">
                Valor Estimado em Andamento
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-primary">
                {formatCurrency(openOpportunityAmount)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {numberFormatter.format(
                  Math.max(
                    openOpportunityCount - opportunitiesWithoutEstimatedValue,
                    0,
                  ),
                )}{" "}
                de {numberFormatter.format(openOpportunityCount)} com valor
              </p>
            </div>
          </div>

          <div className="grid items-start gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_9.5rem]">
            {pipelineSegments.length > 2 ? (
              <ol
                className="dashboard-pipeline-strip"
                style={pipelineStyle}
                aria-label="Distribuição do Pipeline por Etapa"
              >
                {pipelineSegments.map((segment, index) => {
                  const share =
                    segment.kind === "open" && openOpportunityAmount > 0
                      ? Math.round((segment.amount / openOpportunityAmount) * 100)
                      : null;
                  const toneClass =
                    segment.kind === "won"
                      ? "border-success text-success"
                      : segment.kind === "lost"
                        ? "border-danger text-danger"
                        : "border-primary text-foreground";
                  const filterParams = new URLSearchParams({
                    pipeline:
                      segment.kind === "open"
                        ? `stage:${segment.id}`
                        : segment.kind,
                  });

                  if (segment.kind !== "open") {
                    filterParams.set("period", String(periodDays));
                  }

                  const segmentHref =
                    segment.count > 0
                      ? `/accounts?${filterParams.toString()}#base-comercial`
                      : null;
                  const segmentAriaLabel =
                    segment.kind === "open"
                      ? `Ver Empresas/Prospects com Oportunidades na Etapa ${segment.name}`
                      : `Ver Empresas/Prospects com Oportunidades ${segment.name} nos Últimos ${periodDays} Dias`;
                  const segmentContent = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="whitespace-nowrap text-sm font-medium">
                            {segment.name}
                          </p>
                        </div>
                        {index < pipelineSegments.length - 1 ? (
                          <MoveRight
                            size={16}
                            className="hidden shrink-0 text-muted 2xl:block"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <p className="mt-4 font-mono text-3xl font-semibold tabular-nums leading-none">
                        {numberFormatter.format(segment.count)}
                      </p>
                      <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                        {formatCurrency(segment.amount)}
                      </p>
                      {share !== null ? (
                        <p className="mt-2 text-sm text-muted">
                          {share}% do valor aberto
                        </p>
                      ) : segment.periodLabel ? (
                        <p className="mt-2 whitespace-nowrap text-sm text-muted">
                          Últimos {segment.periodLabel}
                        </p>
                      ) : null}
                    </>
                  );

                  return (
                    <li
                      key={segment.id}
                      className={`relative min-h-32 border-t-2 bg-surface-muted ${toneClass}`}
                    >
                      {segmentHref ? (
                        <Link
                          href={segmentHref}
                          aria-label={segmentAriaLabel}
                          className="block min-h-32 px-3 py-3 transition-colors hover:bg-background hover:ring-1 hover:ring-inset hover:ring-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                        >
                          {segmentContent}
                        </Link>
                      ) : (
                        <div className="min-h-32 px-3 py-3">
                          {segmentContent}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="flex min-h-40 items-center justify-center border border-dashed border-border px-4 text-center text-sm text-muted">
                O Funil Padrão ainda não possui etapas comerciais abertas.
              </div>
            )}

            <aside className="min-h-32 w-full max-w-44 border border-dashed border-border bg-background xl:max-w-none">
              {prospectsWithoutOpenOpportunity > 0 ? (
                <Link
                  href="/accounts?pipeline=outside#base-comercial"
                  aria-label="Ver Prospects Fora do Pipeline na Base Comercial"
                  className="block min-h-32 p-3 transition-colors hover:bg-surface-muted hover:ring-1 hover:ring-inset hover:ring-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  <h3 className="whitespace-nowrap text-sm font-medium text-foreground">
                    Fora do Pipeline
                  </h3>
                  <p className="mt-4 font-mono text-3xl font-semibold tabular-nums leading-none">
                    {numberFormatter.format(prospectsWithoutOpenOpportunity)}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Sem Oportunidade aberta
                  </p>
                </Link>
              ) : (
                <div className="min-h-32 p-3">
                  <h3 className="whitespace-nowrap text-sm font-medium text-foreground">
                    Fora do Pipeline
                  </h3>
                  <p className="mt-4 font-mono text-3xl font-semibold tabular-nums leading-none">
                    {numberFormatter.format(prospectsWithoutOpenOpportunity)}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Sem Oportunidade aberta
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock3 size={18} className="text-warning" aria-hidden />
                <h2 className="text-base font-semibold">
                  Atividades que Exigem Atenção
                </h2>
              </div>
              <Link
                href="/agenda?status=PENDING"
                className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-primary"
              >
                Ver Agenda
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            {overdueActivities.length > 0 ? (
              <ul className="divide-y divide-border">
                {overdueActivities.map((activity) => {
                  const ownerLabel = activity.owner.name || activity.owner.email;
                  const priorityLabel =
                    activity.priority >= 3
                      ? "Alta"
                      : activity.priority === 2
                        ? "Média"
                        : "Baixa";
                  return (
                    <li key={activity.id}>
                      <Link
                        href={
                          activity.account
                            ? `/accounts/${activity.account.id}`
                            : "/agenda?status=PENDING"
                        }
                        className="grid min-h-16 gap-2 px-4 py-3 transition-colors hover:bg-surface-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {activity.title}
                          </span>
                          <span className="block truncate text-sm text-muted">
                            {activity.account?.name ?? "Atividade Geral"} · {ownerLabel}
                          </span>
                        </span>
                        <span className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium text-danger">
                            {activity.scheduledAt
                              ? dateFormatter.format(activity.scheduledAt)
                              : "Sem Data"}
                          </span>
                          <span className="rounded bg-surface-muted px-2 py-1 text-muted">
                            {priorityLabel}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 size={24} className="text-success" aria-hidden />
                <p className="text-sm font-medium">Nenhuma Atividade Atrasada</p>
                <p className="max-w-[55ch] text-sm leading-5 text-muted">
                  As pendências agendadas no seu escopo estão dentro do prazo.
                </p>
              </div>
            )}

            {overdueActivityCount > overdueActivities.length ? (
              <div className="border-t border-border px-4 py-3 text-sm text-muted">
                Mais {numberFormatter.format(
                  overdueActivityCount - overdueActivities.length,
                )}{" "}
                atividades atrasadas estão disponíveis na Agenda.
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">
                  Movimentação nos Últimos {periodDays} Dias
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Eventos ocorridos dentro do período selecionado.
                </p>
              </div>
            </div>
            <dl className="divide-y divide-border">
              {movementItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex min-h-14 items-center justify-between gap-4 px-4 py-3"
                  >
                    <dt className="flex min-w-0 items-center gap-3 text-sm">
                      <Icon
                        size={18}
                        className={`shrink-0 ${item.tone}`}
                        aria-hidden
                      />
                      <span>{item.label}</span>
                    </dt>
                    <dd
                      className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${item.tone}`}
                    >
                      {item.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        <p className="text-sm text-muted">
          Valores exibidos são estimativas comerciais registradas nas
          Oportunidades; não representam faturamento realizado.
        </p>
      </div>
    </main>
  );
}
