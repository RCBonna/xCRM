import {
  ArrowLeft,
  LogOut,
  PackageCheck,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import {
  setProductStatusAction,
  updateProductAction,
} from "@/app/products/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { CurrencyInput } from "@/components/currency-input";
import { TenantBrand } from "@/components/tenant-brand";
import { UppercaseInput } from "@/components/uppercase-input";
import { UserIdentityCard } from "@/components/user-identity-card";
import { getAppUser, redirectPathForTenantStatus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { proposalCurrencyFormatter } from "@/lib/proposals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

type ProductEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProductEditPage({
  params,
  searchParams,
}: ProductEditPageProps) {
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

  if (!["OWNER", "ADMIN"].includes(appUser.role)) {
    redirect("/dashboard?error=Sem%20permissao%20para%20catalogo.");
  }

  const { id } = await params;
  const feedback = await searchParams;
  const [product, unreadNotificationsCount] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id,
        tenantId: appUser.tenantId,
      },
      include: {
        proposalItems: {
          select: {
            id: true,
          },
          take: 1,
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

  if (!product) {
    notFound();
  }

  const hasProposalUsage = product.proposalItems.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Editar Produto"
            subtitle={product.name}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={appUser.name || user.email || "Usuário autenticado"}
              email={appUser.email || user.email || "E-mail não informado"}
              role={roleLabels[appUser.role] ?? appUser.role}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <AppSettingsMenu
              tenantId={appUser.tenantId}
              userId={appUser.id}
              canManageCompanySettings
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
            href="/products?tab=catalog"
            className="return-link-shimmer inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden />
            Voltar para Catálogo
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
                    product.status === "ACTIVE"
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-muted text-muted",
                  ].join(" ")}
                >
                  {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </span>
                <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                  {product.sku ?? "Sem SKU"}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Preço base atual:{" "}
                {proposalCurrencyFormatter.format(Number(product.basePrice))}
              </p>
            </div>
            <form action={setProductStatusAction}>
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="hidden"
                name="status"
                value={product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
              />
              <input
                type="hidden"
                name="returnTo"
                value={`/products/${product.id}`}
              />
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground">
                {product.status === "ACTIVE" ? (
                  <ToggleLeft size={16} aria-hidden />
                ) : (
                  <ToggleRight size={16} aria-hidden />
                )}
                {product.status === "ACTIVE" ? "Inativar" : "Ativar"}
              </button>
            </form>
          </div>

          {hasProposalUsage ? (
            <div className="border-b border-border bg-surface-muted/40 px-4 py-3 text-sm leading-6 text-muted">
              Este produto já foi usado em Propostas. Alterações feitas aqui
              afetam o Catálogo e novas Propostas; Propostas já criadas mantêm
              os valores e descrições originais.
            </div>
          ) : null}

          <form action={updateProductAction} className="grid min-w-0 gap-4 p-4">
            <input type="hidden" name="productId" value={product.id} />
            <div className="grid min-w-0 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">SKU</span>
                <UppercaseInput
                  name="sku"
                  defaultValue={product.sku}
                  maxLength={20}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Nome do Produto</span>
                <UppercaseInput
                  required
                  name="name"
                  defaultValue={product.name}
                  maxLength={90}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Unidade</span>
                <UppercaseInput
                  name="unit"
                  defaultValue={product.unit}
                  maxLength={6}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Preço Base</span>
                <CurrencyInput
                  name="basePrice"
                  defaultValue={proposalCurrencyFormatter.format(
                    Number(product.basePrice),
                  )}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Descrição</span>
              <textarea
                name="description"
                rows={5}
                defaultValue={product.description ?? ""}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Save size={16} aria-hidden />
                Salvar Produto
              </button>
              <Link
                href="/products?tab=catalog"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <PackageCheck size={18} className="text-primary" aria-hidden />
            Regra Comercial
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            O Preço Base do Catálogo é genérico para o tenant. Ajustes por
            cliente ou negociação devem ser feitos na Proposta, que guarda o
            snapshot dos itens enviados.
          </p>
        </section>
      </div>
    </main>
  );
}
