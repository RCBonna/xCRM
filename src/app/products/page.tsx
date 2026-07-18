import {
  ArrowLeft,
  Boxes,
  BrushCleaning,
  Filter,
  LogOut,
  PackagePlus,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import {
  createProductAction,
  setProductStatusAction,
} from "@/app/products/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { CurrencyInput } from "@/components/currency-input";
import { TenantBrand } from "@/components/tenant-brand";
import { UppercaseInput } from "@/components/uppercase-input";
import { UserIdentityCard } from "@/components/user-identity-card";
import type { Prisma } from "@/generated/prisma/client";
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

const productStatusOptions = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INACTIVE", label: "Inativos" },
] as const;

function getStatusFilter(value?: string) {
  return productStatusOptions.find((option) => option.value === value)?.value;
}

type ProductsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    q?: string;
    status?: string;
    tab?: string;
    sku?: string;
    name?: string;
    unit?: string;
    basePrice?: string;
    description?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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

  const params = await searchParams;
  const activeTab = params.tab === "new" ? "new" : "catalog";
  const searchQuery = String(params.q ?? "").trim();
  const selectedStatus = getStatusFilter(params.status);
  const productFilters: Prisma.ProductWhereInput[] = [];

  if (selectedStatus) {
    productFilters.push({ status: selectedStatus });
  }

  if (searchQuery) {
    productFilters.push({
      OR: [
        { sku: { contains: searchQuery, mode: "insensitive" } },
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { unit: { contains: searchQuery, mode: "insensitive" } },
      ],
    });
  }

  const productsWhere: Prisma.ProductWhereInput = {
    tenantId: appUser.tenantId,
    ...(productFilters.length > 0 ? { AND: productFilters } : {}),
  };
  const [products, matchingCount, totalCount, activeProductsCount, unreadNotificationsCount] =
    await Promise.all([
      prisma.product.findMany({
        where: productsWhere,
        orderBy: [
          {
            status: "asc",
          },
          {
            name: "asc",
          },
        ],
        take: 80,
      }),
      prisma.product.count({
        where: productsWhere,
      }),
      prisma.product.count({
        where: {
          tenantId: appUser.tenantId,
        },
      }),
      prisma.product.count({
        where: {
          tenantId: appUser.tenantId,
          status: "ACTIVE",
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
  const hasActiveFilters = Boolean(searchQuery || selectedStatus);
  const draftProduct = {
    sku: String(params.sku ?? ""),
    name: String(params.name ?? ""),
    unit: String(params.unit ?? "UN"),
    basePrice: String(params.basePrice ?? ""),
    description: String(params.description ?? ""),
  };
  const catalogParams = new URLSearchParams();

  if (searchQuery) {
    catalogParams.set("q", searchQuery);
  }

  if (selectedStatus) {
    catalogParams.set("status", selectedStatus);
  }

  catalogParams.set("tab", "catalog");
  const newParams = new URLSearchParams(catalogParams);
  newParams.set("tab", "new");
  const catalogHref = `/products?${catalogParams.toString()}`;
  const newHref = `/products?${newParams.toString()}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <TenantBrand
            organizationName={appUser.tenant.name}
            title="Catálogo de Produtos"
            subtitle="Consulte, cadastre e mantenha Produtos e Serviços usados nas Propostas."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UserIdentityCard
              name={appUser.name || user.email || "Usuário autenticado"}
              email={appUser.email || user.email || "E-mail não informado"}
              role={roleLabels[appUser.role] ?? appUser.role}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <AppSettingsMenu
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
            href="/dashboard"
            className="return-link-shimmer inline-flex h-10 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden />
            Voltar para Dashboard
          </Link>
          <div className="md:flex md:justify-end">
            {(params.error || params.message) && (
              <div
                role={params.error ? "alert" : "status"}
                className={[
                  "w-full rounded-md border px-3 py-2 text-sm md:max-w-xl",
                  params.error
                    ? "border-danger text-danger"
                    : "border-border text-muted",
                ].join(" ")}
              >
                {params.error ?? params.message}
              </div>
            )}
          </div>
        </div>

        <nav
          aria-label="Seções do Catálogo"
          className="flex border-b border-border"
        >
          <Link
            id="products-catalog-tab"
            href={catalogHref}
            aria-current={activeTab === "catalog" ? "page" : undefined}
            className={[
              "inline-flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors",
              activeTab === "catalog"
                ? "border-primary bg-surface text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            <Boxes size={16} aria-hidden />
            Catálogo
          </Link>
          <Link
            id="products-new-tab"
            href={newHref}
            aria-current={activeTab === "new" ? "page" : undefined}
            className={[
              "inline-flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors",
              activeTab === "new"
                ? "border-primary bg-surface text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            <PackagePlus size={16} aria-hidden />
            Novo Produto
          </Link>
        </nav>

        {activeTab === "new" ? (
          <section
            id="products-new-panel"
            role="tabpanel"
            aria-labelledby="products-new-tab"
            className="mx-auto w-full max-w-3xl rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <PackagePlus size={18} className="text-primary" aria-hidden />
                Novo Produto
              </h2>
              <p className="mt-1 text-sm text-muted">
                O preço base é genérico e pode ser ajustado depois na Proposta.
              </p>
            </div>
            <form action={createProductAction} className="grid min-w-0 gap-4 p-4">
              <div className="grid min-w-0 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">SKU</span>
                  <UppercaseInput
                    name="sku"
                    defaultValue={draftProduct.sku}
                    maxLength={20}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Nome do Produto</span>
                  <UppercaseInput
                    required
                    name="name"
                    defaultValue={draftProduct.name}
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
                    defaultValue={draftProduct.unit || "UN"}
                    maxLength={6}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Preço Base</span>
                  <CurrencyInput
                    name="basePrice"
                    defaultValue={draftProduct.basePrice}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Descrição</span>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={draftProduct.description}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <PackagePlus size={16} aria-hidden />
                  Cadastrar Produto
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
        ) : (
          <section
            id="products-catalog-panel"
            role="tabpanel"
            aria-labelledby="products-catalog-tab"
            className="rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Boxes size={18} className="text-primary" aria-hidden />
                Catálogo
              </h2>
              <p className="mt-1 text-sm text-muted">
                {matchingCount} de {totalCount} produto
                {totalCount === 1 ? "" : "s"} visíve
                {totalCount === 1 ? "l" : "is"}. {activeProductsCount} ativo
                {activeProductsCount === 1 ? "" : "s"}.
              </p>
            </div>
            <form className="grid gap-3 border-b border-border px-4 py-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto_auto] lg:items-end">
              <input type="hidden" name="tab" value="catalog" />
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Buscar</span>
                <span className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    name="q"
                    type="search"
                    defaultValue={searchQuery}
                    placeholder="SKU, Produto, descrição..."
                    className="h-10 w-full rounded-md border border-border bg-background px-9 text-sm"
                  />
                </span>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Status</span>
                <select
                  name="status"
                  defaultValue={selectedStatus ?? ""}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  {productStatusOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                title="Aplicar Filtros"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Filter size={16} aria-hidden />
                Filtrar
              </button>
              <Link
                href="/products?tab=catalog"
                title="Limpar Filtros"
                className={[
                  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors",
                  hasActiveFilters
                    ? "text-foreground hover:border-primary"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                <BrushCleaning size={16} aria-hidden />
                Limpar
              </Link>
            </form>

            <div className="divide-y divide-border">
              {products.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted">
                  Nenhum Produto encontrado com os filtros atuais.
                </p>
              ) : (
                products.map((product) => {
                  const returnTo = `/products?${catalogParams.toString()}`;

                  return (
                    <div
                      key={product.id}
                      className="group relative grid gap-3 px-4 py-4 text-sm transition-colors hover:bg-surface-muted/40 focus-within:bg-surface-muted/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    >
                      <Link
                        href={`/products/${product.id}`}
                        className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary"
                        aria-label={`Editar Produto ${product.name}`}
                      />
                      <div className="pointer-events-none relative z-10 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">
                            {product.name}
                          </p>
                          <span
                            className={[
                              "rounded px-2 py-1 text-xs font-medium",
                              product.status === "ACTIVE"
                                ? "bg-primary/15 text-primary"
                                : "bg-surface-muted text-muted",
                            ].join(" ")}
                          >
                            {product.status === "ACTIVE" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {[product.sku, product.unit]
                            .filter(Boolean)
                            .join(" · ") || "Sem SKU"}
                        </p>
                        {product.description ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="relative z-10 grid gap-2 sm:grid-cols-[auto_auto] sm:items-center">
                        <p className="font-semibold">
                          {proposalCurrencyFormatter.format(
                            Number(product.basePrice),
                          )}
                        </p>
                        <form action={setProductStatusAction} className="relative z-20">
                          <input
                            type="hidden"
                            name="productId"
                            value={product.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                            }
                          />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground">
                            {product.status === "ACTIVE" ? (
                              <ToggleLeft size={15} aria-hidden />
                            ) : (
                              <ToggleRight size={15} aria-hidden />
                            )}
                            {product.status === "ACTIVE" ? "Inativar" : "Ativar"}
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
