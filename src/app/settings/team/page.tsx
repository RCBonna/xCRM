import {
  ArrowLeft,
  LogOut,
  Plus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  assignTeamMemberAction,
  removeTeamMemberAction,
} from "@/app/settings/team/actions";
import { signOutAction } from "@/app/auth/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { TeamAuditLogPanel } from "@/components/team-audit-log-panel";
import { TeamLeadersTab } from "@/components/team-leaders-tab";
import { TeamTeamsTab } from "@/components/team-teams-tab";
import { TeamUsersTab } from "@/components/team-users-tab";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamTab = "users" | "teams" | "leaders" | "members";

const tabs: Array<{ value: TeamTab; label: string }> = [
  { value: "users", label: "Cadastro de Usuários" },
  { value: "teams", label: "Cadastro de Equipes" },
  { value: "leaders", label: "Líder da Equipe" },
  { value: "members", label: "Usuários da Equipe" },
];

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type TeamSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    tab?: string;
  }>;
};

function canManageTeamSettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

function getCurrentTab(tab?: string): TeamTab {
  return tabs.some((item) => item.value === tab) ? (tab as TeamTab) : "users";
}

export default async function TeamSettingsPage({
  searchParams,
}: TeamSettingsPageProps) {
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

  if (!canManageTeamSettings(appUser.role)) {
    redirect("/dashboard?error=Sem%20permissao%20para%20equipes.");
  }

  const params = await searchParams;
  const currentTab = getCurrentTab(params.tab);
  const [users, teams, auditLogs, unreadNotificationsCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId: appUser.tenantId,
      },
      include: {
        teamMemberships: {
          include: {
            team: true,
          },
        },
        managedTeams: true,
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.team.findMany({
      where: {
        tenantId: appUser.tenantId,
      },
      include: {
        manager: true,
        members: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
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
    prisma.interaction.findMany({
      where: {
        tenantId: appUser.tenantId,
        accountId: null,
        contactId: null,
        opportunityId: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        occurredAt: "desc",
      },
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

  const activeTeams = teams.filter((team) => team.status === "ACTIVE");
  const managers = users.filter(
    (item) => item.role === "MANAGER" && item.status === "ACTIVE",
  );
  const assignableUsers = users.filter((item) =>
    ["MANAGER", "SELLER", "ASSISTANT"].includes(item.role),
  );
  const editableUserIds = new Set(
    users
      .filter((item) => !["OWNER", "ADMIN"].includes(item.role))
      .map((item) => item.id),
  );
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();
  const canImportData = appUser.role === "OWNER";
  const inputClass =
    "h-10 rounded-md border border-border bg-background px-3 text-sm";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Equipes e Usuários
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Organize líderes, vendedores e vínculos de equipe para controlar
              carteira, ações e oportunidades por nível operacional.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={userIdentity}
              email={userEmail}
              role={userRole}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <AppSettingsMenu
              canManageCompanySettings
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

        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <Link
            href="/dashboard"
            className="return-link-shimmer inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden />
            Voltar para Dashboard
          </Link>
          <div className="md:justify-self-end">
            {params.error ? (
              <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
                {params.error}
              </p>
            ) : null}
            {params.message ? (
              <p className="rounded-md border border-border px-3 py-2 text-sm text-muted">
                {params.message}
              </p>
            ) : null}
          </div>
        </div>

        <section className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <UsersRound size={18} className="text-primary" aria-hidden />
              Equipes
            </h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma equipe cadastrada.</p>
            ) : (
              teams.map((team) => {
                const activeMembers = team.members.filter(
                  (member) => member.user.status === "ACTIVE",
                );

                return (
                  <article
                    key={team.id}
                    className="min-h-32 rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {team.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          Líder: {team.manager?.name ?? "Sem líder definido"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                          {statusLabels[team.status]}
                        </span>
                        <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                          {activeMembers.length}/{team.members.length} ativo(s)
                        </span>
                      </div>
                    </div>
                    {team.members.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {team.members.map((member) => (
                          <span
                            key={member.id}
                            className="rounded border border-border px-2 py-1 text-xs text-muted"
                          >
                            {member.user.name} · {statusLabels[member.user.status]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted">
                        Sem usuários vinculados.
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface">
          <div className="flex flex-col border-b border-border md:flex-row">
            {tabs.map((tab) => {
              const isActive = tab.value === currentTab;

              return (
                <Link
                  key={tab.value}
                  href={`/settings/team?tab=${tab.value}`}
                  className={[
                    "flex min-h-12 flex-1 items-center justify-center border-b-2 px-3 text-center text-sm font-medium transition-colors md:border-b-0 md:border-t-2",
                    isActive
                      ? "border-primary bg-surface-muted text-foreground"
                      : "border-transparent text-muted hover:bg-surface-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {currentTab === "users" ? (
            <TeamUsersTab
              users={users.map((tenantUser) => ({
                id: tenantUser.id,
                name: tenantUser.name,
                email: tenantUser.email,
                role: tenantUser.role,
                status: tenantUser.status,
                canEdit: editableUserIds.has(tenantUser.id),
              }))}
            />
          ) : null}

          {currentTab === "teams" ? (
            <TeamTeamsTab
              teams={teams.map((team) => {
                const activeMemberCount = team.members.filter(
                  (member) => member.user.status === "ACTIVE",
                ).length;

                return {
                  id: team.id,
                  name: team.name,
                  status: team.status,
                  managerName: team.manager?.name ?? null,
                  memberCount: team.members.length,
                  activeMemberCount,
                };
              })}
            />
          ) : null}

          {currentTab === "leaders" ? (
            <TeamLeadersTab
              teams={activeTeams.map((team) => {
                const activeMemberCount = team.members.filter(
                  (member) => member.user.status === "ACTIVE",
                ).length;

                return {
                  id: team.id,
                  name: team.name,
                  status: team.status,
                  managerUserId: team.managerUserId,
                  managerName: team.manager?.name ?? null,
                  memberCount: team.members.length,
                  activeMemberCount,
                };
              })}
              managers={managers.map((manager) => ({
                id: manager.id,
                name: manager.name,
              }))}
            />
          ) : null}

          {currentTab === "members" ? (
            <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <form action={assignTeamMemberAction} className="grid gap-3 content-start">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Plus size={18} className="text-primary" aria-hidden />
                  Vincular Usuário
                </h2>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Equipe</span>
                  <select name="teamId" required className={inputClass}>
                    <option value="">Selecione</option>
                    {activeTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Usuário</span>
                  <select name="userId" required className={inputClass}>
                    <option value="">Selecione</option>
                    {assignableUsers.map((tenantUser) => (
                      <option key={tenantUser.id} value={tenantUser.id}>
                        {tenantUser.name} - {statusLabels[tenantUser.status]}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Vincular Usuário
                </button>
              </form>

              <div className="divide-y divide-border rounded-md border border-border">
                {teams.map((team) => (
                  <article key={team.id} className="grid gap-3 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{team.name}</p>
                        <p className="text-xs leading-5 text-muted">
                          {statusLabels[team.status]}
                        </p>
                      </div>
                      <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                        {team.members.length} vínculo(s)
                      </span>
                    </div>
                    {team.members.length > 0 ? (
                      <div className="grid gap-2">
                        {team.members.map((member) => (
                          <form
                            key={member.id}
                            action={removeTeamMemberAction}
                            className="grid gap-2 rounded-md border border-border p-2 md:grid-cols-[minmax(0,1fr)_auto]"
                          >
                            <input
                              type="hidden"
                              name="membershipId"
                              value={member.id}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {member.user.name}
                              </p>
                              <p className="text-xs leading-5 text-muted">
                                {roleLabels[member.user.role]} ·{" "}
                                {statusLabels[member.user.status]}
                              </p>
                            </div>
                            <button className="inline-flex h-9 items-center justify-center rounded-md border border-danger px-3 text-xs font-medium text-danger">
                              Remover Vínculo
                            </button>
                          </form>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">
                        Nenhum usuário vinculado.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <TeamAuditLogPanel
          logs={auditLogs.map((log) => ({
            id: log.id,
            summary: log.summary ?? "Registro Administrativo",
            details: log.body,
            occurredAt: dateTimeFormatter.format(log.occurredAt),
            userName: log.user?.name ?? null,
          }))}
        />
      </div>
    </main>
  );
}
