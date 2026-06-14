import { redirect } from "next/navigation";

import { createTenantAction } from "@/app/auth/actions";
import { getAppUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser = await getAppUser(user);

  if (appUser) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const suggestedName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";
  const sessionName = suggestedName || user.email || "Usuario autenticado";
  const sessionEmail = user.email ?? "E-mail não informado";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-md border border-border bg-surface p-6">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
            Primeiro Tenant
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">
            Crie a empresa inicial do xCRM
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Esta etapa cria o tenant, vincula seu login como owner, cria o
            funil comercial padrão e adiciona uma primeira tarefa interna.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface p-5">
          {params.error && (
            <div className="mb-4 rounded-md border border-danger px-4 py-3 text-sm text-danger">
              {params.error}
            </div>
          )}
          <h2 className="text-lg font-semibold">Dados Iniciais</h2>
          <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-md bg-surface-muted px-3 py-2 text-xs text-muted">
            <span className="shrink-0 font-medium">Sessão atual</span>
            <span className="min-w-0 truncate text-right">
              {sessionName}
              {sessionEmail !== sessionName && (
                <span className="text-muted"> - {sessionEmail}</span>
              )}
            </span>
          </div>
          <form action={createTenantAction} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Nome da Empresa</span>
              <input
                required
                name="companyName"
                type="text"
                autoComplete="organization"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Seu Nome</span>
              <input
                required
                name="userName"
                type="text"
                autoComplete="name"
                defaultValue={suggestedName}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <button className="mt-2 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              Criar Empresa e Continuar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
