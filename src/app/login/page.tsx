import { redirect } from "next/navigation";

import { signInAction, signUpAction } from "@/app/auth/actions";
import { getDefaultRedirectPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
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
              Entre para organizar sua operacao comercial
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Acesso inicial com Supabase Auth. Depois do cadastro, o primeiro
              usuario cria a empresa e assume o perfil owner do tenant.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-md bg-surface-muted p-3">
              Multiempresa com isolamento por tenant.
            </div>
            <div className="rounded-md bg-surface-muted p-3">
              Funil padrao criado no onboarding.
            </div>
            <div className="rounded-md bg-surface-muted p-3">
              RLS ativo nas tabelas operacionais.
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {(params.error || params.message) && (
            <div
              className={[
                "rounded-md border px-4 py-3 text-sm",
                params.error
                  ? "border-danger text-danger"
                  : "border-border text-muted",
              ].join(" ")}
            >
              {params.error ?? params.message}
            </div>
          )}

          <div className="rounded-md border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Entrar</h2>
            <form action={signInAction} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">E-mail</span>
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Senha</span>
                <input
                  required
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <button className="mt-2 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                Entrar
              </button>
            </form>
          </div>

          <div className="rounded-md border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Criar acesso</h2>
            <form action={signUpAction} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Nome</span>
                <input
                  required
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">E-mail</span>
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Senha</span>
                <input
                  required
                  minLength={6}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <button className="mt-2 h-10 rounded-md border border-border px-4 text-sm font-medium">
                Criar acesso
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
