import { ArrowLeft, Download, FileCheck2, LogOut, Send } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { publishProposalAction } from "@/app/proposals/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatProposalNumber,
  proposalCurrencyFormatter,
  proposalDateFormatter,
  proposalStatusLabels,
  proposalStatusTone,
} from "@/lib/proposals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccountVisibilityWhere,
  getOpportunityVisibilityWhere,
} from "@/lib/visibility";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

type ProposalPageProps = {
  params: Promise<{
    id: string;
    proposalId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProposalPage({
  params,
  searchParams,
}: ProposalPageProps) {
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

  const { id, proposalId } = await params;
  const feedback = await searchParams;
  const [accountVisibilityWhere, opportunityVisibilityWhere] = await Promise.all([
    getAccountVisibilityWhere(appUser),
    getOpportunityVisibilityWhere(appUser),
  ]);
  const [account, proposal, unreadNotificationsCount] = await Promise.all([
    prisma.account.findFirst({
      where: {
        id,
        tenantId: appUser.tenantId,
        ...accountVisibilityWhere,
      },
    }),
    prisma.proposal.findFirst({
      where: {
        id: proposalId,
        accountId: id,
        tenantId: appUser.tenantId,
        opportunity: {
          ...opportunityVisibilityWhere,
        },
      },
      include: {
        account: true,
        contact: true,
        items: {
          orderBy: {
            position: "asc",
          },
        },
        opportunity: {
          include: {
            stage: true,
          },
        },
        owner: true,
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

  if (!account || !proposal) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title={formatProposalNumber(proposal.number, proposal.version)}
            subtitle={`${account.name} - ${proposal.opportunity.title}`}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={appUser.name || user.email || "Usuário autenticado"}
              email={appUser.email || user.email || "E-mail não informado"}
              role={roleLabels[appUser.role] ?? appUser.role}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <AppSettingsMenu
              canManageCompanySettings={["OWNER", "ADMIN"].includes(appUser.role)}
              canImportData={appUser.role === "OWNER"}
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
            href={`/accounts/${account.id}#oportunidades`}
            className="return-link-shimmer inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden />
            Voltar para Oportunidades
          </Link>
          <div className="md:flex md:justify-end">
            {(feedback.error || feedback.message) && (
              <div
                role={feedback.error ? "alert" : "status"}
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
          <div className="grid gap-4 border-b border-border px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded px-2.5 py-1 text-xs font-semibold",
                    proposalStatusTone[proposal.status],
                  ].join(" ")}
                >
                  {proposalStatusLabels[proposal.status]}
                </span>
                <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                  {proposal.opportunity.stage.name}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                {proposal.opportunity.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Criada em {proposalDateFormatter.format(proposal.issuedAt)}
                {proposal.validUntil
                  ? ` · Validade até ${proposalDateFormatter.format(
                      proposal.validUntil,
                    )}`
                  : ""}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={`/api/proposals/${proposal.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                <Download size={16} aria-hidden />
                Baixar PDF
              </a>
              <form action={publishProposalAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <button
                  disabled={proposal.status !== "DRAFT"}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {proposal.status === "DRAFT" ? (
                    <Send size={16} aria-hidden />
                  ) : (
                    <FileCheck2 size={16} aria-hidden />
                  )}
                  {proposal.status === "DRAFT" ? "Publicar" : "Publicada"}
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted">Empresa/Prospect</p>
              <p className="mt-1 text-sm font-semibold">{proposal.account.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Contato</p>
              <p className="mt-1 text-sm font-semibold">
                {proposal.contact?.name ?? "Sem contato vinculado"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Responsável</p>
              <p className="mt-1 text-sm font-semibold">
                {proposal.owner?.name ?? "Responsável não informado"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold">Itens</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Un.</th>
                  <th className="px-4 py-3 text-right font-medium">Qtde.</th>
                  <th className="px-4 py-3 text-right font-medium">Unitário</th>
                  <th className="px-4 py-3 text-right font-medium">Desconto</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposal.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium">{item.snapshotName}</p>
                      {item.snapshotDescription ? (
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {item.snapshotDescription}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-muted">
                      {item.snapshotUnit}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {Number(item.quantity).toLocaleString("pt-BR", {
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {proposalCurrencyFormatter.format(Number(item.unitPrice))}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-medium text-danger">
                      {proposalCurrencyFormatter.format(Number(item.discount))}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-semibold">
                      {proposalCurrencyFormatter.format(Number(item.lineTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 rounded-md border border-border bg-surface p-4">
            <h2 className="text-base font-semibold">Condições</h2>
            <div className="mt-4 grid min-w-0 gap-4 text-sm leading-6 text-muted">
              {proposal.introduction ? (
                <p className="whitespace-pre-wrap break-words">
                  {proposal.introduction}
                </p>
              ) : null}
              {proposal.paymentTerms ? (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    Condições de Pagamento
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {proposal.paymentTerms}
                  </p>
                </div>
              ) : null}
              {proposal.commercialTerms ? (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    Condições Comerciais
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {proposal.commercialTerms}
                  </p>
                </div>
              ) : null}
              {proposal.notes ? (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Observações</p>
                  <p className="whitespace-pre-wrap break-words">
                    {proposal.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="rounded-md border border-border bg-surface p-4">
            <h2 className="text-base font-semibold">Totais</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium">
                  {proposalCurrencyFormatter.format(Number(proposal.subtotal))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Desconto</dt>
                <dd className="font-medium text-danger">
                  {proposalCurrencyFormatter.format(Number(proposal.discount))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Frete</dt>
                <dd className="font-medium">
                  {proposalCurrencyFormatter.format(Number(proposal.freight))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Acréscimos</dt>
                <dd className="font-medium">
                  {proposalCurrencyFormatter.format(Number(proposal.additions))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="text-lg font-semibold text-primary">
                  {proposalCurrencyFormatter.format(Number(proposal.total))}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
