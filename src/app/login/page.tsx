import { redirect } from "next/navigation";

import { LoginAccessTabs } from "@/components/login-access-tabs";
import { LoginInfoPanel } from "@/components/login-info-panel";
import { getDefaultRedirectPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    tab?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(await getDefaultRedirectPath(user));
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="flex min-h-[32rem] flex-col justify-between rounded-md border border-border bg-surface p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              xCRM
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">
              Entre para organizar sua operação comercial
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Acesso inicial com Supabase Auth. Depois do cadastro, o primeiro
              usuário cria a empresa e assume o perfil owner do tenant.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-md bg-surface-muted p-3">
              Multiempresa com isolamento por tenant.
            </div>
            <div className="rounded-md bg-surface-muted p-3">
              Funil Padrão criado no onboarding.
            </div>
            <div className="rounded-md bg-surface-muted p-3">
              RLS ativo nas tabelas operacionais.
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <LoginInfoPanel error={params.error} message={params.message} />
          <LoginAccessTabs initialTab={params.tab} />
        </section>
      </div>
    </main>
  );
}
