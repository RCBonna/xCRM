import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CircleDollarSign,
  LogOut,
  Mail,
  MoveRight,
  Phone,
  Plus,
  Star,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  completeAccountActivityAction,
  createAccountContactAction,
  createAccountActivityAction,
  createAccountOpportunityAction,
  deleteAccountContactAction,
  moveAccountOpportunityStageAction,
  setPrimaryAccountContactAction,
  updateAccountContactAction,
  updateAccountAction,
} from "@/app/accounts/actions";
import { signOutAction } from "@/app/auth/actions";
import { AccountCompletedActivitiesPanel } from "@/components/account-completed-activities-panel";
import { AccountContactsPanel } from "@/components/account-contacts-panel";
import { AccountHistoryPanel } from "@/components/account-history-panel";
import { DirtySubmitButton } from "@/components/dirty-submit-button";
import { ThemeSelector } from "@/components/theme-selector";
import { getAppUser } from "@/lib/auth";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const accountStatusLabels: Record<string, string> = {
  PROSPECT: "Prospect",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
};

const opportunityStatusLabels: Record<string, string> = {
  OPEN: "Aberta",
  WON: "Ganha",
  LOST: "Perdida",
  ARCHIVED: "Arquivada",
};

const interactionSummaryLabels: Record<string, string> = {
  "Ação Concluída": "Ação Concluída",
  "Ação Criada": "Ação Criada",
  "Cadastro atualizado": "Dados Atualizados",
  "Contato Atualizado": "Contato Atualizado",
  "Contato Criado": "Contato Criado",
  "Contato Excluído": "Contato Excluído",
  "Contato Principal Alterado": "Contato Principal Alterado",
  "Dados Atualizados": "Dados Atualizados",
  "Oportunidade Criada": "Oportunidade Criada",
  "Oportunidade Movida": "Oportunidade Movida",
  "Prospect criado": "Prospect Criado",
  "Prospect Criado": "Prospect Criado",
};

function formatInteractionSummary(summary?: string | null) {
  if (!summary) {
    return "Interação registrada";
  }

  return interactionSummaryLabels[summary] ?? summary;
}

function canSeeTenantAccounts(role: string) {
  return ["OWNER", "ADMIN", "MANAGER"].includes(role);
}

type AccountDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AccountDetailPage({
  params,
  searchParams,
}: AccountDetailPageProps) {
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

  const { id } = await params;
  const feedback = await searchParams;
  const [account, defaultPipeline] = await Promise.all([
    prisma.account.findFirst({
      where: {
        id,
        tenantId: appUser.tenantId,
        ...(canSeeTenantAccounts(appUser.role) ? {} : { ownerUserId: appUser.id }),
      },
      include: {
        contacts: {
          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
        opportunities: {
          include: {
            contact: {
              select: {
                name: true,
              },
            },
            stage: {
              select: {
                id: true,
                name: true,
                position: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        activities: {
          orderBy: [
            {
              scheduledAt: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 30,
        },
        interactions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            occurredAt: "desc",
          },
          take: 20,
        },
      },
    }),
    prisma.pipeline.findFirst({
      where: {
        tenantId: appUser.tenantId,
        isDefault: true,
      },
      include: {
        stages: {
          orderBy: {
            position: "asc",
          },
        },
      },
    }),
  ]);

  if (!account) {
    notFound();
  }

  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();
  const primaryContact =
    account.contacts.find((contact) => contact.isPrimary) ?? account.contacts[0];
  const pendingActivities = account.activities.filter(
    (activity) => activity.status === "PENDING",
  );
  const completedActivities = account.activities
    .filter((activity) => activity.status === "COMPLETED")
    .sort(
      (first, second) =>
        (second.completedAt?.getTime() ?? 0) -
        (first.completedAt?.getTime() ?? 0),
    );
  const completedActivityItems = completedActivities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    completedAt: activity.completedAt
      ? dateTimeFormatter.format(activity.completedAt)
      : "Sem data de conclusão",
  }));
  const visibleContacts = account.contacts.slice(0, 1);
  const extraContacts = account.contacts.slice(1);
  const pipelineStages = defaultPipeline?.stages ?? [];
  const historyInteractions = account.interactions.map((interaction) => ({
    id: interaction.id,
    summary: formatInteractionSummary(interaction.summary),
    occurredAt: dateTimeFormatter.format(interaction.occurredAt),
    actor: interaction.user
      ? interaction.user.name || interaction.user.email
      : null,
    body: interaction.body,
  }));
  const renderContactEditor = (contact: (typeof account.contacts)[number]) => (
    <div key={contact.id} className="grid gap-3 px-4 py-4">
      <form action={updateAccountContactAction} className="grid gap-3">
        <input type="hidden" name="accountId" value={account.id} />
        <input type="hidden" name="contactId" value={contact.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Nome</span>
            <input
              required
              name="contactName"
              type="text"
              defaultValue={contact.name}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Função/Cargo</span>
            <input
              name="contactTitle"
              type="text"
              defaultValue={contact.title ?? ""}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">E-mail</span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={contact.email ?? ""}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Telefone</span>
            <input
              name="contactPhone"
              type="tel"
              maxLength={15}
              defaultValue={contact.phone ?? ""}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>
        <DirtySubmitButton />
      </form>
      {contact.isPrimary ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <span className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-surface-muted px-3 text-xs font-medium text-primary">
            <Star size={14} aria-hidden />
            Principal
          </span>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <form action={setPrimaryAccountContactAction}>
            <input type="hidden" name="accountId" value={account.id} />
            <input type="hidden" name="contactId" value={contact.id} />
            <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-surface-muted px-3 text-xs font-medium text-muted transition-colors hover:text-foreground">
              <Star size={14} aria-hidden />
              Tornar Principal
            </button>
          </form>
          <form action={deleteAccountContactAction}>
            <input type="hidden" name="accountId" value={account.id} />
            <input type="hidden" name="contactId" value={contact.id} />
            <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-danger px-3 text-xs font-medium text-danger transition-colors hover:bg-danger hover:text-background">
              <Trash2 size={14} aria-hidden />
              Excluir
            </button>
          </form>
        </div>
      )}
    </div>
  );
  const newContactForm = (
    <form action={createAccountContactAction} className="grid gap-3 px-4 py-4">
      <input type="hidden" name="accountId" value={account.id} />
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <UserPlus size={16} className="text-primary" aria-hidden />
        Novo Contato
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nome</span>
          <input
            required
            name="contactName"
            type="text"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Função/Cargo</span>
          <input
            name="contactTitle"
            type="text"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">E-mail</span>
          <input
            name="contactEmail"
            type="email"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Telefone</span>
          <input
            name="contactPhone"
            type="tel"
            maxLength={15}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          name="isPrimary"
          type="checkbox"
          className="h-4 w-4 rounded border-border"
        />
        Marcar como Contato Principal
      </label>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
        <Plus size={16} aria-hidden />
        Criar Contato
      </button>
    </form>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/accounts"
              className="return-link-shimmer inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} aria-hidden />
              Empresas/Prospects
            </Link>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              {account.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {accountStatusLabels[account.status]} -{" "}
              {[account.city, account.state].filter(Boolean).join(" - ") ||
                "Localização não informada"}
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
            <ThemeSelector />
            <form action={signOutAction}>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </header>

        {(feedback.error || feedback.message) && (
          <div
            className={[
              "rounded-md border px-3 py-2 text-sm",
              feedback.error
                ? "border-danger text-danger"
                : "border-border text-muted",
            ].join(" ")}
          >
            {feedback.error ?? feedback.message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form
            action={updateAccountAction}
            className="rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold">Editar Dados Básicos</h2>
              <p className="text-sm text-muted">
                Atualize as informações principais e a Observação Comercial.
              </p>
            </div>
            <div className="grid gap-4 p-4">
              <input type="hidden" name="accountId" value={account.id} />
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Empresa/Prospect</span>
                <input
                  required
                  name="accountName"
                  type="text"
                  defaultValue={account.name}
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
                    defaultValue={account.city ?? ""}
                    autoComplete="address-level2"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">UF</span>
                  <select
                    name="state"
                    defaultValue={account.state ?? ""}
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
                  defaultValue={account.website ?? ""}
                  autoComplete="url"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">Fornecedor/Atividade/Marca</span>
                  <input
                    name="mainSupplier"
                    type="text"
                    defaultValue={account.mainSupplier ?? ""}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-sm">
                  <span className="font-medium">Origem</span>
                  <input
                    name="source"
                    type="text"
                    defaultValue={account.source ?? ""}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Observação Comercial</span>
                <textarea
                  name="notes"
                  defaultValue={account.notes ?? ""}
                  rows={5}
                  className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>

              <DirtySubmitButton variant="primary" />
            </div>
          </form>

          <aside className="grid gap-6">
            <section className="rounded-md border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold">Contato Principal</h2>
              </div>
              <div className="px-4 py-4 text-sm text-muted">
                {primaryContact ? (
                  <div className="grid gap-2">
                    <p className="font-medium text-foreground">
                      {primaryContact.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={13} aria-hidden />
                        {primaryContact.title ?? "Função/Cargo não informado"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={13} aria-hidden />
                        {primaryContact.email ?? "E-mail não informado"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} aria-hidden />
                        {primaryContact.phone ?? "Telefone não informado"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p>Contato Principal ainda não informado.</p>
                )}
              </div>
            </section>

            <AccountContactsPanel
              hasContacts={account.contacts.length > 0}
              hasExtraContacts={extraContacts.length > 0}
              extraContacts={extraContacts.map(renderContactEditor)}
              newContactForm={newContactForm}
            >
              {visibleContacts.map(renderContactEditor)}
            </AccountContactsPanel>

            <section className="rounded-md border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <CircleDollarSign
                    size={18}
                    className="text-primary"
                    aria-hidden
                  />
                  Oportunidades
                </h2>
              </div>
              <div className="divide-y divide-border">
                {account.opportunities.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted">
                    Nenhuma oportunidade registrada.
                  </p>
                ) : (
                  account.opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="grid gap-3 px-4 py-4 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {opportunity.title}
                          </p>
                          <p className="text-xs leading-5 text-muted">
                            {opportunity.stage.name}
                            {opportunity.contact
                              ? ` - ${opportunity.contact.name}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted">
                          {opportunityStatusLabels[opportunity.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-muted">
                        <span>
                          {opportunity.amountEstimated
                            ? currencyFormatter.format(
                                Number(opportunity.amountEstimated),
                              )
                            : "Valor não informado"}
                        </span>
                        <span>
                          {opportunity.expectedCloseDate
                            ? dateFormatter.format(opportunity.expectedCloseDate)
                            : "Sem previsão"}
                        </span>
                      </div>

                      <form
                        action={moveAccountOpportunityStageAction}
                        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <input
                          type="hidden"
                          name="accountId"
                          value={account.id}
                        />
                        <input
                          type="hidden"
                          name="opportunityId"
                          value={opportunity.id}
                        />
                        <label className="grid min-w-0 gap-1 text-sm">
                          <span className="font-medium">Etapa</span>
                          <select
                            name="stageId"
                            defaultValue={opportunity.stage.id}
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                          >
                            {pipelineStages.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.position}. {stage.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground sm:self-end">
                          <MoveRight size={14} aria-hidden />
                          Mover
                        </button>
                      </form>
                    </div>
                  ))
                )}

                <form
                  action={createAccountOpportunityAction}
                  className="grid gap-3 px-4 py-4"
                >
                  <input type="hidden" name="accountId" value={account.id} />
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Plus size={16} className="text-primary" aria-hidden />
                    Nova Oportunidade
                  </h3>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Título</span>
                    <input
                      required
                      name="opportunityTitle"
                      type="text"
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Contato</span>
                      <select
                        name="contactId"
                        defaultValue=""
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Sem contato vinculado</option>
                        {account.contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Etapa</span>
                      <select
                        required
                        name="stageId"
                        defaultValue={pipelineStages[0]?.id ?? ""}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      >
                        {pipelineStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.position}. {stage.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">Valor Estimado</span>
                      <input
                        name="amountEstimated"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm">
                      <span className="font-medium">
                        Previsão de Fechamento
                      </span>
                      <input
                        name="expectedCloseDate"
                        type="date"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    disabled={pipelineStages.length === 0}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} aria-hidden />
                    Criar Oportunidade
                  </button>
                </form>
              </div>
            </section>

            <section className="rounded-md border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <CalendarClock size={18} className="text-primary" aria-hidden />
                  Próximas Ações
                </h2>
              </div>
              <div className="divide-y divide-border">
                <div>
                  {pendingActivities.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted">
                      Nenhuma ação pendente.
                    </p>
                  ) : (
                    pendingActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-xs leading-5 text-muted">
                            {activity.scheduledAt
                              ? dateTimeFormatter.format(activity.scheduledAt)
                              : "Sem data definida"}
                          </p>
                        </div>
                        <form action={completeAccountActivityAction}>
                          <input
                            type="hidden"
                            name="accountId"
                            value={account.id}
                          />
                          <input
                            type="hidden"
                            name="activityId"
                            value={activity.id}
                          />
                          <button
                            aria-label={`Concluir Ação ${activity.title}`}
                            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground sm:w-auto"
                          >
                            <Check size={14} aria-hidden />
                            Concluir
                          </button>
                        </form>
                      </div>
                    ))
                  )}
                </div>
                <form
                  action={createAccountActivityAction}
                  className="grid gap-3 px-4 py-4"
                >
                  <input type="hidden" name="accountId" value={account.id} />
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Nova Ação</span>
                    <input
                      required
                      name="nextActionTitle"
                      type="text"
                      placeholder="Retornar contato, agendar visita..."
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Data e Hora</span>
                    <input
                      name="nextActionScheduledAt"
                      type="datetime-local"
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                    <Plus size={16} aria-hidden />
                    Criar Ação
                  </button>
                </form>
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <AccountHistoryPanel interactions={historyInteractions} />

          <AccountCompletedActivitiesPanel activities={completedActivityItems} />
        </section>
      </div>
    </main>
  );
}
