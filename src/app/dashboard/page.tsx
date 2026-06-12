import {
  Building2,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { ThemeSelector } from "@/components/theme-selector";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nextActions = [
  "Revisar configuracoes iniciais da empresa.",
  "Importar a planilha de prospeccao.",
  "Distribuir prospects para vendedores.",
  "Comecar a registrar contatos e follow-ups.",
];

export default async function DashboardPage() {
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

  const [accountCount, contactCount, activityCount, stages] = await Promise.all([
    prisma.account.count({ where: { tenantId: appUser.tenantId } }),
    prisma.contact.count({ where: { tenantId: appUser.tenantId } }),
    prisma.activity.count({
      where: { tenantId: appUser.tenantId, status: "PENDING" },
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
  ]);

  const metrics = [
    {
      label: "Empresas/prospects",
      value: accountCount,
      detail: "registros no tenant atual",
      icon: Building2,
    },
    {
      label: "Contatos",
      value: contactCount,
      detail: "pessoas vinculadas a empresas",
      icon: UsersRound,
    },
    {
      label: "Atividades pendentes",
      value: activityCount,
      detail: "tarefas abertas para a equipe",
      icon: CalendarClock,
    },
    {
      label: "Etapas do funil",
      value: stages.length,
      detail: "pipeline comercial padrao",
      icon: ClipboardList,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Painel do xCRM
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Voce esta como {appUser.role.toLowerCase()} em um tenant
              protegido por Supabase Auth e RLS.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ThemeSelector />
            <form action={signOutAction}>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-md border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {metric.value}
                    </p>
                  </div>
                  <span className="rounded-md bg-surface-muted p-2 text-primary">
                    <Icon size={18} aria-hidden />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {metric.detail}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Funil padrao</h2>
                <p className="text-sm text-muted">
                  Etapas criadas automaticamente no onboarding.
                </p>
              </div>
              <CircleDollarSign size={20} className="text-primary" aria-hidden />
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="min-h-28 rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{stage.name}</h3>
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                      {stage.position}
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted">
                    {stage.isWon
                      ? "Etapa de ganho"
                      : stage.isLost
                        ? "Etapa de perda"
                        : "Etapa comercial ativa"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-md border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles size={18} className="text-primary" aria-hidden />
                Proximas acoes
              </h2>
              <p className="text-sm text-muted">
                Primeiros passos para transformar a base em uso real.
              </p>
            </div>
            <ol className="divide-y divide-border">
              {nextActions.map((action, index) => (
                <li key={action} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-muted text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="leading-6">{action}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </main>
  );
}
