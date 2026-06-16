import { ArrowLeft, Building2, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { updateCompanySettingsAction } from "@/app/settings/company/actions";
import { AppSettingsMenu } from "@/components/app-settings-menu";
import { CnpjInput } from "@/components/cnpj-input";
import { UppercaseInput } from "@/components/uppercase-input";
import { getAppUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

type CompanySettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function CompanySettingsPage({
  searchParams,
}: CompanySettingsPageProps) {
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

  if (!canManageCompanySettings(appUser.role)) {
    redirect("/dashboard?error=Sem%20permissao%20para%20configuracoes.");
  }

  const params = await searchParams;
  const userIdentity = appUser.name || user.email || "Usuário autenticado";
  const userEmail = appUser.email || user.email || "E-mail não informado";
  const userRole = appUser.role.toLowerCase();
  const inputClass =
    "h-10 rounded-md border border-border bg-background px-3 text-sm";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              {appUser.tenant.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Configurações da Empresa
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Atualize os dados do tenant usados no cabeçalho, permissões e
              visão administrativa do xCRM.
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
            <AppSettingsMenu
              canManageCompanySettings={canManageCompanySettings(appUser.role)}
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <form
            action={updateCompanySettingsAction}
            className="rounded-md border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Building2 size={18} className="text-primary" aria-hidden />
                Dados da Empresa
              </h2>
              <p className="mt-1 text-sm text-muted">
                Informações institucionais do tenant atual.
              </p>
            </div>
            <div className="grid gap-4 p-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Nome da Empresa</span>
                <UppercaseInput
                  required
                  name="companyName"
                  autoComplete="organization"
                  defaultValue={appUser.tenant.name}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Razão Social</span>
                <UppercaseInput
                  name="legalName"
                  autoComplete="organization"
                  defaultValue={appUser.tenant.legalName}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">CNPJ</span>
                  <CnpjInput
                    name="document"
                    defaultValue={appUser.tenant.document}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Segmento</span>
                  <input
                    name="segment"
                    type="text"
                    defaultValue={appUser.tenant.segment ?? ""}
                    placeholder="Ex.: Revenda de motos elétricas"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="font-medium">Plano</span>
                <input
                  name="plan"
                  type="text"
                  defaultValue={appUser.tenant.plan ?? ""}
                  placeholder="trial, comercial, enterprise..."
                  className={inputClass}
                />
              </label>

              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                <Save size={16} aria-hidden />
                Salvar Alterações
              </button>
            </div>
          </form>

          <aside className="rounded-md border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck size={18} className="text-primary" aria-hidden />
                Controle do Owner
              </h2>
            </div>
            <div className="grid gap-3 p-4 text-sm leading-6 text-muted">
              <p>
                Esta tela fica restrita a Owner e Admin. Alterações importantes
                são registradas no Histórico do tenant para auditoria.
              </p>
              <p>
                O Nome da Empresa alimenta o cabeçalho das telas autenticadas e
                ajuda a separar visualmente cada operação no modelo multiempresa.
              </p>
              <p>
                Segmento e plano começam como dados administrativos e serão
                usados depois em preferências, dashboards e regras comerciais.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
