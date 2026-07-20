import { Bell, Building2, LogOut } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { markPlatformNotificationsReadAction } from "@/app/platform/actions";
import { PlatformTenantManagement } from "@/components/platform-tenant-management";
import { ThemeScope } from "@/components/theme-scope";
import { getPlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type PlatformPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function PlatformPage({ searchParams }: PlatformPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const platformAdmin = await getPlatformAdmin(user);
  if (!platformAdmin) redirect("/dashboard?error=Sem%20permissao%20para%20plataforma.");

  const params = await searchParams;
  const [tenants, notifications, unreadCount] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        users: { where: { role: "OWNER" }, take: 1, orderBy: { createdAt: "asc" } },
        statusEvents: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { changedByPlatformAdmin: { select: { name: true } } },
        },
        _count: { select: { users: true, accounts: true, contacts: true, activities: true, imports: true } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.notification.findMany({
      where: { recipientPlatformAdminId: platformAdmin.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notification.count({
      where: { recipientPlatformAdminId: platformAdmin.id, readAt: null },
    }),
  ]);

  const activeTenantCount = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const suspendedTenantCount = tenants.filter((tenant) => tenant.status === "SUSPENDED").length;
  const tenantItems = tenants.map((tenant) => {
    const event = tenant.statusEvents[0];
    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      owner: tenant.users[0]
        ? {
            name: tenant.users[0].name,
            email: tenant.users[0].email,
            phone: tenant.users[0].phone,
          }
        : null,
      counts: tenant._count,
      lastStatusEvent: event ? {
        status: event.status,
        reason: event.reason,
        createdAt: event.createdAt.toISOString(),
        changedBy: event.changedByPlatformAdmin.name,
      } : null,
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ThemeScope />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/brand/scientiam-mark.jpg" alt="Logo Scientiam" width={96} height={96} className="h-20 w-20 shrink-0 rounded-md object-contain sm:h-24 sm:w-24" priority />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">Platform Admin</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Administração da Plataforma xCRM</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Gerencie organizações, acesso e operações sensíveis da plataforma.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm">
              <Bell size={17} className="text-primary" aria-hidden /> Notificações
              {unreadCount > 0 ? <span className="ml-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{unreadCount}</span> : null}
            </div>
            <form action={signOutAction}><button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium"><LogOut size={16} aria-hidden />Sair</button></form>
          </div>
        </header>

        {(params.error || params.message) ? <div className={`rounded-md border px-3 py-2 text-sm ${params.error ? "border-danger text-danger" : "border-border text-muted"}`}>{params.error ?? params.message}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-md border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="flex items-center gap-2 text-base font-semibold"><Building2 size={18} className="text-primary" aria-hidden />Organizações</h2><p className="mt-1 text-xs text-muted">Selecione uma organização para consultar acesso, auditoria e zona de risco.</p></div>
              <div className="flex gap-2 text-xs"><span className="rounded bg-surface-muted px-3 py-2 text-center text-muted"><strong className="block text-sm text-foreground">{tenants.length}</strong>Total</span><span className="rounded bg-primary/10 px-3 py-2 text-center text-primary"><strong className="block text-sm">{activeTenantCount}</strong>Ativos</span><span className="rounded bg-danger/10 px-3 py-2 text-center text-danger"><strong className="block text-sm">{suspendedTenantCount}</strong>Suspensos</span></div>
            </div>
            <PlatformTenantManagement tenants={tenantItems} />
          </div>

          <aside className="h-fit rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="flex items-center gap-2 text-base font-semibold"><Bell size={18} className="text-primary" aria-hidden />Mensagens</h2>{unreadCount > 0 ? <form action={markPlatformNotificationsReadAction}><button className="rounded border border-border px-2 py-1 text-xs text-muted">Marcar Lidas</button></form> : null}</div>
            <div className="divide-y divide-border">{notifications.length === 0 ? <p className="px-4 py-4 text-sm text-muted">Nenhuma notificação.</p> : notifications.map((notification) => <article key={notification.id} className="grid gap-1 px-4 py-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{notification.title}</p>{!notification.readAt ? <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Nova</span> : null}</div><p className="text-xs text-muted">{dateTimeFormatter.format(notification.createdAt)}</p>{notification.body ? <p className="text-sm leading-6 text-muted">{notification.body}</p> : null}</article>)}</div>
          </aside>
        </section>
      </div>
    </main>
  );
}
