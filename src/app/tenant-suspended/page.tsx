import { AlertTriangle, LogOut, Mail, Phone, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { TenantBrand } from "@/components/tenant-brand";
import {
  getAppUser,
  getDefaultRedirectPath,
  getPlatformAdmin,
  isTenantSuspended,
  PLATFORM_SUPPORT_EMAIL,
  PLATFORM_SUPPORT_PHONE,
} from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TenantSuspendedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const platformAdmin = await getPlatformAdmin(user);

  if (platformAdmin) {
    redirect("/platform");
  }

  const appUser = await getAppUser(user);

  if (!appUser) {
    redirect("/onboarding");
  }

  if (!isTenantSuspended(appUser)) {
    redirect(await getDefaultRedirectPath(user));
  }

  const isOwner = appUser.role === "OWNER";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-8 sm:px-6">
        <section className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <TenantBrand
              organizationName={appUser.tenant.name}
              title={
                <>
                  <AlertTriangle size={24} className="text-danger" aria-hidden />
                  Acesso Temporariamente Suspenso
                </>
              }
              subtitle="Entre em contato com o responsável pela organização ou com o suporte."
            />
          </div>

          <div className="grid gap-5 p-5">
            <div className="rounded-md border border-border bg-background px-4 py-3">
              <p className="text-sm leading-6 text-muted">
                Você está autenticado como{" "}
                <span className="font-semibold text-foreground">
                  {appUser.name}
                </span>
                .
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <UserRound size={14} aria-hidden />
                {appUser.email} - {appUser.role.toLowerCase()}
              </p>
            </div>

            {isOwner ? (
              <div className="rounded-md border border-danger px-4 py-3">
                <p className="text-sm font-semibold text-danger">
                  Sua empresa está suspensa na plataforma xCRM.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Para regularizar o acesso, entre em contato com o SAC da
                  plataforma pelos canais abaixo.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-border px-4 py-3">
                <p className="text-sm font-semibold">
                  O acesso da sua empresa está temporariamente suspenso.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Procure a gerência ou o responsável pela empresa para maiores
                  informações.
                </p>
              </div>
            )}

            <div className="grid gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-2">
              <a
                href={`tel:${PLATFORM_SUPPORT_PHONE.replace(/\D/g, "")}`}
                className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 text-sm transition-colors hover:border-primary"
              >
                <Phone size={18} className="text-primary" aria-hidden />
                {PLATFORM_SUPPORT_PHONE}
              </a>
              <a
                href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
                className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 text-sm transition-colors hover:border-primary"
              >
                <Mail size={18} className="text-primary" aria-hidden />
                {PLATFORM_SUPPORT_EMAIL}
              </a>
            </div>

            <form action={signOutAction}>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:border-primary">
                <LogOut size={16} aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
