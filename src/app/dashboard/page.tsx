import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Settings,
  Sparkles,
  Upload,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { DashboardPendingActivitiesPanel } from "@/components/dashboard-pending-activities-panel";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActivityVisibilityWhere } from "@/lib/visibility";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
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
  const activityVisibilityWhere = await getActivityVisibilityWhere(appUser);
  const [
    accountCount,
    contactCount,
    activityCount,
    stages,
    pendingActivities,
    unreadNotificationsCount,
  ] = await Promise.all([
    prisma.account.count({ where: { tenantId: appUser.tenantId } }),
    prisma.contact.count({ where: { tenantId: appUser.tenantId } }),
    prisma.activity.count({
      where: {
        tenantId: appUser.tenantId,
        status: "PENDING",
        ...activityVisibilityWhere,
      },
    }),
    prisma.pipelineStage.findMany({
      where: {
        tenantId: appUser.tenantId,
        pipeline: {
          isDefault: true,
        },
      },
      orderBy: {
        position: "asc",
      },
    }),
    prisma.activity.findMany({
      where: {
        tenantId: appUser.tenantId,
        status: "PENDING",
        ...activityVisibilityWhere,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          scheduledAt: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      take: 8,
    }),
    prisma.notification.count({
      where: {
        tenantId: appUser.tenantId,
        recipientUserId: appUser.id,
        readAt: null,
      },
    }),
  ]);

  const metrics = [
    {
      key: "accounts",
      label: (
        <>
          Empresas/<wbr />Prospects
        </>
      ),
      value: accountCount,
      detail: "registros da organização atual",
      icon: Building2,
    },
    {
      key: "contacts",
      label: "Contatos",
      value: contactCount,
      detail: "pessoas vinculadas a empresas",
      icon: UsersRound,
    },
    {
      key: "activities",
      label: "Atividades Pendentes",
      value: activityCount,
      detail: "tarefas abertas no seu escopo",
      icon: CalendarClock,
      attention: activityCount > 0,
    },
    {
      key: "stages",
      label: "Etapas do Funil",
      value: stages.length,
      detail: "etapas do funil comercial",
      icon: ClipboardList,
    },
  ];
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = roleLabels[appUser.role] ?? appUser.role;
  const canOpenCompanySettings = canManageCompanySettings(appUser.role);
  const canImportData = appUser.role === "OWNER";
  const quickActions = [
    {
      label: "Base Comercial",
      description: "Empresas, prospects e contatos",
      href: "/accounts",
      icon: Building2,
      visible: true,
    },
    {
      label: "Importação de Dados",
      description: "Planilhas e revisão de registros",
      href: "/imports",
      icon: Upload,
      visible: canImportData,
    },
    {
      label: "Equipes e Usuários",
      description: "Líderes, vendedores e vínculos",
      href: "/settings/team",
      icon: UsersRound,
      visible: canOpenCompanySettings,
    },
    {
      label: "Configurações da Empresa",
      description: "Dados institucionais da organização",
      href: "/settings/company",
      icon: Settings,
      visible: canOpenCompanySettings,
    },
  ].filter((action) => action.visible);
  const pendingActivityItems = pendingActivities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    scheduledAt: activity.scheduledAt
      ? dateTimeFormatter.format(activity.scheduledAt)
      : null,
    account: activity.account,
  }));
  const nextPendingActivity = pendingActivityItems[0];
  const priorityAction =
    activityCount > 0
      ? {
          label: "Atenção Agora",
          title: "Concluir Atividades Pendentes",
          description: nextPendingActivity
            ? `${nextPendingActivity.title} ${
                nextPendingActivity.scheduledAt
                  ? `- ${nextPendingActivity.scheduledAt}`
                  : "- Sem Data e Hora"
              }`
            : `${activityCount} ${pluralize(
                activityCount,
                "atividade aberta",
                "atividades abertas",
              )} para a equipe.`,
          href: "/agenda",
          cta: "Ver Atividades",
          icon: CalendarClock,
        }
      : accountCount === 0
        ? {
            label: "Primeiro Passo",
            title: "Montar Base Comercial",
            description:
              "Cadastre a primeira Empresa/Prospect para iniciar o acompanhamento comercial.",
            href: "/accounts",
            cta: "Cadastrar Empresa/Prospect",
            icon: Building2,
          }
        : contactCount === 0
          ? {
              label: "Completar Cadastro",
              title: "Adicionar Contatos",
              description:
                "A base já tem Empresas/Prospects. Inclua contatos para registrar follow-ups.",
              href: "/accounts",
              cta: "Abrir Base Comercial",
              icon: UsersRound,
            }
          : canImportData
            ? {
                label: "Crescer Base",
                title: "Importar Novos Prospects",
                description:
                  "Use a importação para revisar planilhas e encaminhar prospects para a equipe.",
                href: "/imports",
                cta: "Abrir Importação",
                icon: Upload,
              }
            : {
                label: "Operação em Dia",
                title: "Acompanhar Base Comercial",
                description:
                  "Revise Empresas/Prospects, oportunidades e próximos follow-ups.",
                href: "/accounts",
                cta: "Abrir Base Comercial",
                icon: CheckCircle2,
              };
  const PriorityIcon = priorityAction.icon;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Painel do xCRM"
            subtitle={`Acesso como ${userRole} na organização ${appUser.tenant.name}.`}
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
              canImportData={canImportData}
            />
            <form action={signOutAction}>
              <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        {(params.error || params.message) && (
          <div
            role={params.error ? "alert" : "status"}
            aria-live={params.error ? "assertive" : "polite"}
            className={[
              "rounded-md border px-3 py-2 text-sm",
              params.error
                ? "border-danger text-danger"
                : "border-border text-muted",
            ].join(" ")}
          >
            {params.error ?? params.message}
          </div>
        )}

        <section className="rounded-md border border-border bg-surface">
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-surface-muted text-primary">
                  <PriorityIcon size={18} aria-hidden />
                </span>
                <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-semibold text-primary">
                  {priorityAction.label}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                {priorityAction.title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                {priorityAction.description}
              </p>
            </div>
            <Link
              href={priorityAction.href}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {priorityAction.cta}
            </Link>
          </div>
          <div className="grid border-t border-border sm:grid-cols-3">
            <div className="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-xs font-medium text-muted">
                Atividades Pendentes
              </p>
              <p className="mt-1 text-xl font-semibold">{activityCount}</p>
            </div>
            <div className="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-xs font-medium text-muted">
                Empresas/Prospects
              </p>
              <p className="mt-1 text-xl font-semibold">{accountCount}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted">
                Contatos Vinculados
              </p>
              <p className="mt-1 text-xl font-semibold">{contactCount}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.key}
                className={[
                  "flex min-h-[10.5rem] flex-col rounded-md border bg-surface p-4 sm:min-h-[11.5rem] xl:min-h-[13.25rem] xl:p-5",
                  metric.attention
                    ? "border-primary"
                    : "border-border",
                ].join(" ")}
              >
                <div className="flex items-center gap-3 xl:gap-4">
                  <span
                    className={[
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border xl:h-12 xl:w-12",
                      metric.attention
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/50 bg-surface-muted text-primary",
                    ].join(" ")}
                  >
                    <Icon size={23} strokeWidth={1.9} aria-hidden />
                  </span>
                  <p
                    className={[
                      "min-w-0 text-sm font-semibold leading-6 xl:text-base",
                      metric.attention ? "text-foreground" : "text-foreground",
                    ].join(" ")}
                  >
                    {metric.label}
                  </p>
                </div>
                <div className="mt-4 border-t border-border xl:mt-5" />
                <div className="flex flex-1 flex-col items-start justify-end pt-5 xl:pt-7">
                  <p className="font-mono text-5xl font-semibold tabular-nums leading-none tracking-normal xl:text-6xl">
                    {metric.value}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted xl:mt-6 xl:text-base">
                    {metric.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Funil Padrão</h2>
                <p className="text-sm text-muted">
                  Etapas criadas automaticamente na configuração inicial.
                </p>
              </div>
              <CircleDollarSign size={20} className="text-primary" aria-hidden />
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3 p-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="min-h-28 rounded-md border border-border bg-background p-3"
                >
                  <div className="grid gap-3">
                    <h3
                      aria-label={`Etapa ${stage.position}: ${stage.name}`}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-muted text-xs font-semibold text-muted">
                        {stage.position}
                      </span>
                      {stage.name}
                    </h3>
                    <p className="text-xs leading-5 text-muted">
                      {stage.isWon
                        ? "Etapa de ganho"
                        : stage.isLost
                          ? "Etapa de perda"
                          : "Etapa comercial ativa"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <nav
            aria-labelledby="dashboard-quick-actions-title"
            className="rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2
                id="dashboard-quick-actions-title"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Sparkles size={18} className="text-primary" aria-hidden />
                Acessos Rápidos
              </h2>
              <p className="text-sm text-muted">
                Rotas essenciais para administrar a operação.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="group flex min-h-14 items-center gap-3 px-4 py-2.5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                        <ActionIcon size={17} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-5 group-hover:text-primary">
                          {action.label}
                        </span>
                        <span className="block text-xs leading-5 text-muted">
                          {action.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </section>

        <DashboardPendingActivitiesPanel activities={pendingActivityItems} />
      </div>
    </main>
  );
}
