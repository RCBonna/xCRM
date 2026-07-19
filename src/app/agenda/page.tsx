import { CalendarDays, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { ActivityStatus, Prisma } from "@/generated/prisma/client";

import { signOutAction } from "@/app/auth/actions";
import { AgendaCalendar } from "@/components/agenda-calendar";
import { ActivityFeedback } from "@/components/activity-feedback";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getActivityVisibilityWhere,
  getVisibleWorkOwnerIds,
} from "@/lib/visibility";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

const viewLabels = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  list: "Lista",
} as const;

type AgendaPageProps = {
  searchParams: Promise<{
    date?: string;
    view?: string;
    status?: string;
    assignee?: string;
    error?: string;
    message?: string;
    undoActivityId?: string;
    undoUntil?: string;
  }>;
};

function atLocalMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value?: string) {
  if (!value) return atLocalMidnight(new Date());
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? atLocalMidnight(new Date()) : atLocalMidnight(date);
}

function startOfWeek(date: Date) {
  const result = atLocalMidnight(date);
  const weekday = result.getDay() || 7;
  result.setDate(result.getDate() - weekday + 1);
  return result;
}

function formatQueryDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function rangeFor(view: keyof typeof viewLabels, anchorDate: Date) {
  if (view === "day") return { start: anchorDate, end: anchorDate };
  if (view === "month") {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    return { start, end };
  }
  const start = startOfWeek(anchorDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function buildHref({ date, view, status, assignee }: { date: Date; view: keyof typeof viewLabels; status: string; assignee?: string }) {
  const params = new URLSearchParams({ date: formatQueryDate(date), view, status });
  if (assignee) params.set("assignee", assignee);
  return `/agenda?${params.toString()}`;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appUser = await getAppUser(user);
  if (!appUser) redirect("/onboarding");

  const suspendedRedirectPath = redirectPathForTenantStatus(appUser);
  if (suspendedRedirectPath) redirect(suspendedRedirectPath);

  const params = await searchParams;
  const view = Object.hasOwn(viewLabels, params.view ?? "") ? (params.view as keyof typeof viewLabels) : "week";
  const status: ActivityStatus | "ALL" = ["PENDING", "COMPLETED", "ALL"].includes(params.status ?? "")
    ? (params.status as ActivityStatus | "ALL")
    : "PENDING";
  const anchorDate = parseDate(params.date);
  const range = rangeFor(view, anchorDate);
  const nextAnchor = new Date(range.end);
  nextAnchor.setDate(nextAnchor.getDate() + 1);
  const previousAnchor = new Date(range.start);
  previousAnchor.setDate(previousAnchor.getDate() - 1);
  const [activityVisibilityWhere, visibleOwnerIds] = await Promise.all([
    getActivityVisibilityWhere(appUser),
    getVisibleWorkOwnerIds(appUser),
  ]);
  const assignee = params.assignee || undefined;
  const activityWhere: Prisma.ActivityWhereInput = {
    tenantId: appUser.tenantId,
    ...activityVisibilityWhere,
    ...(assignee ? { ownerUserId: assignee } : {}),
    ...(status === "ALL" ? {} : { status }),
    OR: [
      { scheduledAt: { gte: range.start, lte: new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate(), 23, 59, 59) } },
      ...(status === "PENDING" ? [{ scheduledAt: null }, { scheduledAt: { lt: range.start } }] : []),
    ],
  };

  const [activities, visibleUsers, unreadNotificationsCount] = await Promise.all([
    prisma.activity.findMany({
      where: activityWhere,
      include: {
        account: { select: { id: true, name: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: 180,
    }),
    prisma.user.findMany({
      where: {
        tenantId: appUser.tenantId,
        status: "ACTIVE",
        ...(visibleOwnerIds ? { id: { in: visibleOwnerIds } } : {}),
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.notification.count({
      where: { tenantId: appUser.tenantId, recipientUserId: appUser.id, readAt: null },
    }),
  ]);

  const returnTo = buildHref({ date: anchorDate, view, status, assignee });
  const roleLabel = roleLabels[appUser.role] ?? appUser.role;
  const currentRangeLabel = new Intl.DateTimeFormat("pt-BR", view === "month" ? { month: "long", year: "numeric" } : { day: "2-digit", month: "short", year: "numeric" }).format(range.start);
  const canManageCompanySettings = ["OWNER", "ADMIN"].includes(appUser.role);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand organizationName={appUser.tenant.name} title="Agenda de Atividades" subtitle={`Planejamento comercial no escopo de ${roleLabel.toLocaleLowerCase("pt-BR")}.`} />
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="col-span-2 min-w-0 sm:col-span-1"><UserIdentityCard name={appUser.name || user.email || "Usuário autenticado"} email={appUser.email || user.email || "E-mail não informado"} role={roleLabel} unreadNotificationsCount={unreadNotificationsCount} /></div>
            <AppSettingsMenu canManageCompanySettings={canManageCompanySettings} canImportData={appUser.role === "OWNER"} />
            <form action={signOutAction}><button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium"><LogOut size={16} aria-hidden />Sair</button></form>
          </div>
        </header>

        <ActivityFeedback
          key={params.undoActivityId ?? "agenda-feedback"}
          error={params.error}
          message={params.message}
          undoActivityId={params.undoActivityId}
          undoUntil={params.undoUntil}
          returnTo={returnTo}
        />

        <section className="rounded-md border border-border bg-surface">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><CalendarDays size={20} className="text-primary" aria-hidden /><h1 className="text-xl font-semibold">Agenda de Atividades</h1></div>
              <p className="mt-1 text-sm text-muted">Acompanhe, ajuste e conclua as atividades permitidas para o seu perfil.</p>
            </div>
            <form className="flex flex-wrap items-end gap-2" method="get">
              <label className="grid gap-1 text-xs font-medium text-muted"><span>Data de Referência</span><input type="date" name="date" defaultValue={formatQueryDate(anchorDate)} className="h-10 rounded-md border border-border px-3 text-sm text-foreground" /></label>
              <label className="grid gap-1 text-xs font-medium text-muted"><span>Responsável</span><select name="assignee" defaultValue={assignee ?? ""} className="h-10 min-w-40 rounded-md border border-border px-3 text-sm text-foreground"><option value="">Todo o Meu Escopo</option>{visibleUsers.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-medium text-muted"><span>Status</span><select name="status" defaultValue={status} className="h-10 rounded-md border border-border px-3 text-sm text-foreground"><option value="PENDING">Pendentes</option><option value="COMPLETED">Concluídas</option><option value="ALL">Todos</option></select></label>
              <input type="hidden" name="view" value={view} /><button type="submit" className="inline-flex h-10 items-center justify-center rounded-md border border-primary px-3 text-sm font-semibold text-primary">Filtrar</button>
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <Link href={buildHref({ date: previousAnchor, view, status, assignee })} aria-label="Período Anterior" title="Período Anterior" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted"><ChevronLeft size={17} aria-hidden /></Link>
            <span className="min-w-40 text-sm font-semibold capitalize">{currentRangeLabel}</span>
            <Link href={buildHref({ date: new Date(), view, status, assignee })} className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-muted">Hoje</Link>
            <Link href={buildHref({ date: nextAnchor, view, status, assignee })} aria-label="Próximo Período" title="Próximo Período" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted"><ChevronRight size={17} aria-hidden /></Link>
            <nav aria-label="Visão da Agenda" className="ml-auto flex rounded-md border border-border p-1">{Object.entries(viewLabels).map(([value, label]) => <Link key={value} href={buildHref({ date: anchorDate, view: value as keyof typeof viewLabels, status, assignee })} aria-current={value === view ? "page" : undefined} className={`inline-flex h-8 items-center rounded px-3 text-sm font-medium ${value === view ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}>{label}</Link>)}</nav>
          </div>
        </section>

        <AgendaCalendar activities={activities.map((activity) => ({ ...activity, scheduledAt: activity.scheduledAt?.toISOString() ?? null }))} rangeStart={range.start.toISOString()} rangeEnd={range.end.toISOString()} view={view} returnTo={returnTo} />
      </div>
    </main>
  );
}
