import {
  Bell,
  Building2,
  CheckCircle2,
  LogOut,
  PauseCircle,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  markPlatformNotificationsReadAction,
  reactivateTenantAction,
  suspendTenantAction,
} from "@/app/platform/actions";
import { signOutAction } from "@/app/auth/actions";
import { getPlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
};

const statusClasses: Record<string, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  INACTIVE: "bg-surface-muted text-muted",
  SUSPENDED: "bg-danger/10 text-danger",
  ARCHIVED: "bg-surface-muted text-muted",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type PlatformPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function PlatformPage({ searchParams }: PlatformPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const platformAdmin = await getPlatformAdmin(user);

  if (!platformAdmin) {
    redirect("/dashboard?error=Sem%20permissao%20para%20plataforma.");
  }

  const params = await searchParams;
  const [tenants, notifications, unreadCount] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        users: {
          where: {
            role: "OWNER",
          },
          take: 1,
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            users: true,
            accounts: true,
            contacts: true,
          },
        },
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.notification.findMany({
      where: {
        recipientPlatformAdminId: platformAdmin.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
    prisma.notification.count({
      where: {
        recipientPlatformAdminId: platformAdmin.id,
        readAt: null,
      },
    }),
  ]);
  const activeTenantCount = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;
  const suspendedTenantCount = tenants.filter(
    (tenant) => tenant.status === "SUSPENDED",
  ).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              Platform Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Administração da Plataforma xCRM
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Gerencie tenants, suspensão de acesso e notificações da plataforma.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm">
              <Bell size={17} className="text-primary" aria-hidden />
              Notificações
              {unreadCount > 0 ? (
                <span className="ml-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </div>
            <form action={signOutAction}>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        {(params.error || params.message) && (
          <div
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-md border border-border bg-surface">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Building2 size={18} className="text-primary" aria-hidden />
                  Clientes xCRM
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Acompanhe cada tenant e controle suspensões da plataforma.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="rounded bg-surface-muted px-3 py-2 text-center text-muted">
                  <strong className="block text-sm text-foreground">
                    {tenants.length}
                  </strong>
                  total
                </span>
                <span className="rounded bg-primary/10 px-3 py-2 text-center text-primary">
                  <strong className="block text-sm">{activeTenantCount}</strong>
                  ativos
                </span>
                <span className="rounded bg-danger/10 px-3 py-2 text-center text-danger">
                  <strong className="block text-sm">
                    {suspendedTenantCount}
                  </strong>
                  suspensos
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {tenants.map((tenant) => {
                const owner = tenant.users[0];

                return (
                  <article
                    key={tenant.id}
                    className="grid gap-4 px-4 py-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.9fr)_minmax(17rem,0.7fr)] 2xl:items-center"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 text-sm font-semibold">
                          {tenant.name}
                        </p>
                        <span
                          className={[
                            "rounded px-2 py-1 text-xs font-medium",
                            statusClasses[tenant.status] ??
                              "bg-surface-muted text-muted",
                          ].join(" ")}
                        >
                          {statusLabels[tenant.status]}
                        </span>
                      </div>
                      <div className="grid gap-1 text-xs leading-5 text-muted">
                        <p className="flex min-w-0 items-center gap-2">
                          <UsersRound
                            size={14}
                            className="shrink-0"
                            aria-hidden
                          />
                          <span className="truncate">
                            Owner: {owner?.name ?? "Sem owner"}
                          </span>
                        </p>
                        {owner?.email ? (
                          <p className="truncate pl-5">{owner.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border border-border bg-background px-3 py-2">
                        <p className="text-lg font-semibold leading-none">
                          {tenant._count.users}
                        </p>
                        <p className="mt-1 text-xs text-muted">Usuários</p>
                      </div>
                      <div className="rounded-md border border-border bg-background px-3 py-2">
                        <p className="text-lg font-semibold leading-none">
                          {tenant._count.accounts}
                        </p>
                        <p className="mt-1 text-xs text-muted">Prospects</p>
                      </div>
                      <div className="rounded-md border border-border bg-background px-3 py-2">
                        <p className="text-lg font-semibold leading-none">
                          {tenant._count.contacts}
                        </p>
                        <p className="mt-1 text-xs text-muted">Contatos</p>
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      {tenant.status === "SUSPENDED" ? (
                        <form action={reactivateTenantAction}>
                          <input
                            type="hidden"
                            name="tenantId"
                            value={tenant.id}
                          />
                          <p className="mb-2 text-xs leading-5 text-muted">
                            Tenant bloqueado para uso operacional.
                          </p>
                          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                            <CheckCircle2 size={15} aria-hidden />
                            Reativar Tenant
                          </button>
                        </form>
                      ) : (
                        <form
                          action={suspendTenantAction}
                          className="grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="tenantId"
                            value={tenant.id}
                          />
                          <label className="grid gap-1 text-xs font-medium text-muted">
                            Motivo da Suspensão
                            <input
                              name="reason"
                              placeholder="Opcional"
                              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
                            />
                          </label>
                          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger px-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-background">
                            <PauseCircle size={15} aria-hidden />
                            Suspender Tenant
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bell size={18} className="text-primary" aria-hidden />
                Mensagens
              </h2>
              {unreadCount > 0 ? (
                <form action={markPlatformNotificationsReadAction}>
                  <button className="rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-primary hover:text-foreground">
                    Marcar Lidas
                  </button>
                </form>
              ) : null}
            </div>
            <div className="divide-y divide-border">
              {notifications.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">
                  Nenhuma notificação.
                </p>
              ) : (
                notifications.map((notification) => (
                  <article key={notification.id} className="grid gap-1 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>
                      {!notification.readAt ? (
                        <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          nova
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">
                      {dateTimeFormatter.format(notification.createdAt)}
                    </p>
                    {notification.body ? (
                      <p className="text-sm leading-6 text-muted">
                        {notification.body}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
