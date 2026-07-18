import { ArrowLeft, FileText, LogOut, Send } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { createProposalAction } from "@/app/proposals/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { ProposalBuilder } from "@/components/proposal-builder";
import { TenantBrand } from "@/components/tenant-brand";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

type NewProposalPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    opportunity?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function NewProposalPage({
  params,
  searchParams,
}: NewProposalPageProps) {
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
  const opportunityId = String(feedback.opportunity ?? "").trim();

  if (!opportunityId) {
    redirect(`/accounts/${id}?error=Selecione%20uma%20Oportunidade.`);
  }

  const [accountVisibilityWhere, opportunityVisibilityWhere] = await Promise.all([
    getAccountVisibilityWhere(appUser),
    getOpportunityVisibilityWhere(appUser),
  ]);
  const [account, opportunity, products, unreadNotificationsCount] =
    await Promise.all([
      prisma.account.findFirst({
        where: {
          id,
          tenantId: appUser.tenantId,
          ...accountVisibilityWhere,
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
        },
      }),
      prisma.opportunity.findFirst({
        where: {
          id: opportunityId,
          accountId: id,
          tenantId: appUser.tenantId,
          ...opportunityVisibilityWhere,
        },
        include: {
          contact: true,
          stage: true,
        },
      }),
      prisma.product.findMany({
        where: {
          tenantId: appUser.tenantId,
          status: "ACTIVE",
        },
        orderBy: {
          name: "asc",
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

  if (!account || !opportunity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Nova Proposta"
            subtitle={`${account.name} - ${opportunity.title}`}
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

        <form action={createProposalAction} className="grid gap-6">
          <input type="hidden" name="accountId" value={account.id} />
          <input type="hidden" name="opportunityId" value={opportunity.id} />

          <section className="rounded-md border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <FileText size={18} className="text-primary" aria-hidden />
                Dados da Proposta
              </h2>
              <p className="mt-1 text-sm text-muted">
                A proposta ficará vinculada a esta Oportunidade e registrada no
                Histórico Comercial.
              </p>
            </div>
            <div className="grid gap-4 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Contato</span>
                  <select
                    name="contactId"
                    defaultValue={opportunity.contactId ?? ""}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Sem contato vinculado</option>
                    {account.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                        {contact.title ? ` - ${contact.title}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Validade</span>
                  <input
                    name="validUntil"
                    type="date"
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Introdução</span>
                <textarea
                  name="introduction"
                  rows={3}
                  placeholder="Resumo da solução proposta..."
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>
            </div>
          </section>

          <ProposalBuilder
            products={products.map((product) => ({
              id: product.id,
              sku: product.sku,
              name: product.name,
              description: product.description,
              unit: product.unit,
              basePrice: String(product.basePrice),
            }))}
          />

          <section className="rounded-md border border-border bg-surface">
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Condições de Pagamento</span>
                <textarea
                  name="paymentTerms"
                  rows={4}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Condições Comerciais</span>
                <textarea
                  name="commercialTerms"
                  rows={4}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Observações</span>
                <textarea
                  name="notes"
                  rows={4}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>
            </div>
            <div className="border-t border-border px-4 py-3">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Send size={16} aria-hidden />
                Criar Proposta
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
