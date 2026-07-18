import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  FileText,
  LogOut,
  Mail,
  MoveRight,
  Phone,
  Plus,
  Star,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  completeAccountActivityAction,
  createAccountContactAction,
  createAccountActivityAction,
  createAccountOpportunityAction,
  deleteAccountActivityAction,
  deleteAccountContactAction,
  moveAccountOpportunityStageAction,
  setPrimaryAccountContactAction,
  updateAccountContactAction,
  updateAccountActivityAction,
  updateAccountAction,
} from "@/app/accounts/actions";
import { signOutAction } from "@/app/auth/actions";
import { ActionDateTimeInput } from "@/components/action-date-time-input";
import { AccountAddPanel } from "@/components/account-add-panel";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { AccountCompletedActivitiesPanel } from "@/components/account-completed-activities-panel";
import { AccountContactsPanel } from "@/components/account-contacts-panel";
import { AccountCustomerDataPanel } from "@/components/account-customer-data-panel";
import { AccountHistoryPanel } from "@/components/account-history-panel";
import { AccountSectionPanel } from "@/components/account-section-panel";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CurrencyInput } from "@/components/currency-input";
import { DirtySubmitButton } from "@/components/dirty-submit-button";
import { TenantBrand } from "@/components/tenant-brand";
import { UppercaseInput } from "@/components/uppercase-input";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import {
  formatProposalNumber,
  proposalStatusLabels,
} from "@/lib/proposals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccountVisibilityWhere,
  getActivityVisibilityWhere,
} from "@/lib/visibility";

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

function formatDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
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
  "Proposta Criada": "Proposta Criada",
  "Proposta Publicada": "Proposta Publicada",
  "Prospect criado": "Prospect Criado",
  "Prospect Criado": "Prospect Criado",
};

function formatInteractionSummary(summary?: string | null) {
  if (!summary) {
    return "Interação registrada";
  }

  return interactionSummaryLabels[summary] ?? summary;
}

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
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

  const suspendedRedirectPath = redirectPathForTenantStatus(appUser);

  if (suspendedRedirectPath) {
    redirect(suspendedRedirectPath);
  }

  const { id } = await params;
  const feedback = await searchParams;
  const [visibilityWhere, activityVisibilityWhere] = await Promise.all([
    getAccountVisibilityWhere(appUser),
    getActivityVisibilityWhere(appUser),
  ]);
  const [account, defaultPipeline, unreadNotificationsCount] = await Promise.all([
    prisma.account.findFirst({
      where: {
        id,
        tenantId: appUser.tenantId,
        ...visibilityWhere,
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
            proposals: {
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                number: true,
                version: true,
                status: true,
                total: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        activities: {
          where: activityVisibilityWhere,
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
    prisma.notification.count({
      where: {
        tenantId: appUser.tenantId,
        recipientUserId: appUser.id,
        readAt: null,
      },
    }),
  ]);

  if (!account) {
    notFound();
  }

  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = roleLabels[appUser.role] ?? appUser.role;
  const canOpenCompanySettings = canManageCompanySettings(appUser.role);
  const canImportData = appUser.role === "OWNER";
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
  const nextPendingActivity = pendingActivities[0];
  const nextActionLabel = nextPendingActivity
    ? nextPendingActivity.scheduledAt
      ? dateTimeFormatter.format(nextPendingActivity.scheduledAt)
      : "Sem Data e Hora"
    : "Nenhuma Ação Pendente";
  const primaryContactLabel = primaryContact
    ? primaryContact.name
    : "Contato Principal não informado";
  const primaryContactDetails = primaryContact
    ? [
        {
          icon: BriefcaseBusiness,
          label: primaryContact.title ?? "Função/Cargo não informado",
        },
        {
          icon: Mail,
          label: primaryContact.email ?? "E-mail não informado",
        },
        {
          icon: Phone,
          label: primaryContact.phone ?? "Telefone não informado",
        },
      ]
    : [];
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
  const renderContactEditor = (contact: (typeof account.contacts)[number]) => {
    const deleteContactFormId = `delete-contact-${contact.id}`;

    return (
    <div key={contact.id} className="grid gap-3 px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {contact.isPrimary ? (
              <Star size={15} className="text-primary" aria-hidden />
            ) : (
              <UserPlus size={15} className="text-primary" aria-hidden />
            )}
            {contact.isPrimary ? "Contato Principal" : "Contato"}
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted">
            {contact.isPrimary
              ? "Pessoa de referência para este Prospect."
              : "Contato vinculado a este Prospect."}
          </p>
        </div>
        {contact.isPrimary ? (
          <span className="inline-flex h-8 w-fit items-center gap-2 rounded-md bg-surface-muted px-3 text-xs font-medium text-primary">
            <Star size={13} aria-hidden />
            Principal
          </span>
        ) : null}
      </div>
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
        <DirtySubmitButton label="Salvar Contato" />
      </form>
      {contact.isPrimary ? (
        null
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <form action={setPrimaryAccountContactAction}>
            <input type="hidden" name="accountId" value={account.id} />
            <input type="hidden" name="contactId" value={contact.id} />
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-surface-muted px-3 text-sm font-medium text-muted transition-colors hover:text-foreground">
              <Star size={14} aria-hidden />
              Tornar Principal
            </button>
          </form>
          <form id={deleteContactFormId} action={deleteAccountContactAction}>
            <input type="hidden" name="accountId" value={account.id} />
            <input type="hidden" name="contactId" value={contact.id} />
            <ConfirmSubmitButton
              formId={deleteContactFormId}
              title="Excluir Contato"
              message={`Deseja excluir ${contact.name}? Esta ação remove o contato deste Prospect e não pode ser desfeita.`}
              confirmLabel="Excluir Contato"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-danger px-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-background"
            >
              <Trash2 size={14} aria-hidden />
              Excluir
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
    );
  };
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
          <TenantBrand
            organizationName={appUser.tenant.name}
            title={account.name}
            subtitle={`${accountStatusLabels[account.status]} - ${
              [account.city, account.state].filter(Boolean).join(" - ") ||
              "Localização não informada"
            }`}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={userIdentity}
              email={userEmail}
              role={userRole}
              unreadNotificationsCount={unreadNotificationsCount}
            />
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

        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <Link
            href="/accounts"
            className="return-link-shimmer inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden />
            Voltar para Empresas/Prospects
          </Link>

          <div className="md:flex md:justify-end">
            {(feedback.error || feedback.message) && (
              <div
                role={feedback.error ? "alert" : "status"}
                aria-live={feedback.error ? "assertive" : "polite"}
                className={[
                  "w-full rounded-md border px-3 py-2 text-sm md:max-w-xl",
                  feedback.error
                    ? "border-danger text-danger"
                    : "border-border text-muted",
                ].join(" ")}
              >
                {feedback.error ?? feedback.message}
              </div>
            )}
          </div>
        </div>

        <section className="rounded-md border border-border bg-surface">
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-semibold text-primary">
                  {accountStatusLabels[account.status]}
                </span>
                <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                  {account.city || account.state
                    ? [account.city, account.state].filter(Boolean).join(" - ")
                    : "Localização não informada"}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                Próxima decisão comercial
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                {nextPendingActivity
                  ? `${nextPendingActivity.title} - ${nextActionLabel}`
                  : `Sem ação pendente. Contato de referência: ${primaryContactLabel}.`}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80">
              <Link
                href={nextPendingActivity ? "#proximas-acoes" : "#contatos"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <CalendarClock size={16} aria-hidden />
                {nextPendingActivity ? "Ver Próxima Ação" : "Criar Ação"}
              </Link>
              <Link
                href="#contatos"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                <UserPlus size={16} aria-hidden />
                Gerenciar Contatos
              </Link>
            </div>
          </div>
          <div className="grid border-t border-border sm:grid-cols-3">
            <div className="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-xs font-medium text-muted">Contato Principal</p>
              <p className="mt-1 truncate text-sm font-semibold">
                {primaryContactLabel}
              </p>
              {primaryContactDetails.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-muted">
                  {primaryContactDetails.map((detail) => {
                    const DetailIcon = detail.icon;

                    return (
                      <span
                        key={detail.label}
                        className="inline-flex min-w-0 items-center gap-1.5"
                      >
                        <DetailIcon size={13} aria-hidden />
                        <span className="truncate">{detail.label}</span>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-xs font-medium text-muted">Ações Pendentes</p>
              <p className="mt-1 text-sm font-semibold">
                {pendingActivities.length}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted">Oportunidades</p>
              <p className="mt-1 text-sm font-semibold">
                {account.opportunities.length}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
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
                <span className="font-medium">Nome Fantasia/Empresa</span>
                <UppercaseInput
                  required
                  name="accountName"
                  defaultValue={account.name}
                  autoComplete="organization"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>

              <AccountCustomerDataPanel
                legalName={account.legalName}
                document={account.document}
                postalCode={account.postalCode}
                address={account.address}
                addressNumber={account.addressNumber}
                addressComplement={account.addressComplement}
                district={account.district}
              />

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

              <DirtySubmitButton label="Salvar Dados Básicos" variant="primary" />
            </div>
          </form>

          <aside className="grid gap-6">
            <AccountContactsPanel
              contactCount={account.contacts.length}
              hasContacts={account.contacts.length > 0}
              newContactForm={newContactForm}
            >
              {account.contacts.map(renderContactEditor)}
            </AccountContactsPanel>

            <AccountSectionPanel
              id="oportunidades"
              title="Oportunidades"
              icon="opportunities"
              count={account.opportunities.length}
              emptyContent={
                <p className="px-4 py-4 text-sm text-muted">
                  {account.opportunities.length > 0
                    ? `${account.opportunities.length} oportunidade${
                        account.opportunities.length === 1 ? "" : "s"
                      } cadastrada${
                        account.opportunities.length === 1 ? "" : "s"
                      }. Use Ver Oportunidades para editar.`
                    : "Nenhuma oportunidade registrada."}
                </p>
              }
              actionContent={
                <AccountAddPanel
                  buttonLabel="Adicionar Oportunidade"
                  expandedLabel="Recolher Oportunidade"
                  contentId="account-new-opportunity-form"
                >
                  <form
                    action={createAccountOpportunityAction}
                    className="grid gap-3 border-t border-border px-4 py-4"
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
                        <CurrencyInput
                          name="amountEstimated"
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
                      Salvar Oportunidade
                    </button>
                  </form>
                </AccountAddPanel>
              }
            >
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

                      <div className="grid gap-2 rounded-md border border-border bg-background p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="flex items-center gap-2 text-xs font-semibold">
                              <FileText
                                size={14}
                                className="text-primary"
                                aria-hidden
                              />
                              Propostas
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {opportunity.proposals.length === 0
                                ? "Nenhuma Proposta criada para esta Oportunidade."
                                : `${opportunity.proposals.length} proposta${
                                    opportunity.proposals.length === 1 ? "" : "s"
                                  } vinculada${
                                    opportunity.proposals.length === 1 ? "" : "s"
                                  }.`}
                            </p>
                          </div>
                          <Link
                            href={`/accounts/${account.id}/proposals/new?opportunity=${opportunity.id}`}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
                          >
                            <Plus size={14} aria-hidden />
                            Criar Proposta
                          </Link>
                        </div>
                        {opportunity.proposals.length > 0 ? (
                          <div className="grid gap-2">
                            {opportunity.proposals.map((proposal) => (
                              <Link
                                key={proposal.id}
                                href={`/accounts/${account.id}/proposals/${proposal.id}`}
                                className="grid gap-1 rounded border border-border bg-surface px-3 py-2 text-xs transition-colors hover:border-primary"
                              >
                                <span className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold">
                                    {formatProposalNumber(
                                      proposal.number,
                                      proposal.version,
                                    )}
                                  </span>
                                  <span className="text-muted">
                                    {proposalStatusLabels[proposal.status]}
                                  </span>
                                </span>
                                <span className="text-muted">
                                  {currencyFormatter.format(
                                    Number(proposal.total),
                                  )}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : null}
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
            </AccountSectionPanel>

            <AccountSectionPanel
              id="proximas-acoes"
              title="Próximas Ações"
              icon="actions"
              count={pendingActivities.length}
              emptyContent={
                <p className="px-4 py-4 text-sm text-muted">
                  {pendingActivities.length > 0
                    ? `${pendingActivities.length} ação pendente${
                        pendingActivities.length === 1 ? "" : "s"
                      }. Use Ver Ações para editar.`
                    : "Nenhuma ação pendente."}
                </p>
              }
              actionContent={
                <AccountAddPanel
                  buttonLabel="Adicionar Ação"
                  expandedLabel="Recolher Ação"
                  contentId="account-new-action-form"
                >
                  <form
                    action={createAccountActivityAction}
                    className="grid gap-3 border-t border-border px-4 py-4"
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
                      <ActionDateTimeInput name="nextActionScheduledAt" />
                    </label>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                      <Plus size={16} aria-hidden />
                      Salvar Ação
                    </button>
                  </form>
                </AccountAddPanel>
              }
            >
                <div>
                  {pendingActivities.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted">
                      Nenhuma ação pendente.
                    </p>
                  ) : (
                    pendingActivities.map((activity) => {
                      const deleteActivityFormId = `delete-activity-${activity.id}`;

                      return (
                      <div key={activity.id} className="grid gap-3 px-4 py-4 text-sm">
                        <form
                          action={updateAccountActivityAction}
                          className="grid gap-3"
                        >
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
                          <label className="grid gap-1">
                            <span className="font-medium">Ação Pendente</span>
                            <input
                              required
                              name="activityTitle"
                              type="text"
                              defaultValue={activity.title}
                              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <label className="grid gap-1">
                              <span className="font-medium">Data e Hora</span>
                              <ActionDateTimeInput
                                name="activityScheduledAt"
                                defaultValue={formatDateTimeLocalValue(
                                  activity.scheduledAt,
                                )}
                              />
                            </label>
                            <DirtySubmitButton label="Salvar Ação" />
                          </div>
                        </form>
                        <div className="grid gap-2 sm:grid-cols-2">
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
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
                            >
                              <Check size={14} aria-hidden />
                              Concluir
                            </button>
                          </form>
                          <form
                            id={deleteActivityFormId}
                            action={deleteAccountActivityAction}
                          >
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
                            <ConfirmSubmitButton
                              formId={deleteActivityFormId}
                              title="Excluir Ação"
                              message={`Deseja excluir a ação "${activity.title}"? Esta remoção não pode ser desfeita.`}
                              confirmLabel="Excluir Ação"
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-danger px-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-danger-foreground"
                            >
                              <Trash2 size={14} aria-hidden />
                              Excluir
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
            </AccountSectionPanel>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AccountHistoryPanel interactions={historyInteractions} />

          <AccountCompletedActivitiesPanel activities={completedActivityItems} />
        </section>
      </div>
    </main>
  );
}
