"use client";

import { AlertTriangle, History, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  useEffect(() => {
    console.error("Falha ao carregar o Dashboard Principal", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <section
          className="rounded-md border border-danger bg-surface"
          aria-labelledby="dashboard-error-title"
        >
          <div className="flex items-start gap-3 border-b border-border p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-danger">
              <AlertTriangle size={21} aria-hidden />
            </span>
            <div>
              <h1
                id="dashboard-error-title"
                className="text-xl font-semibold leading-7"
              >
                Não Foi Possível Carregar o Dashboard
              </h1>
              <p className="mt-1 max-w-[65ch] text-sm leading-6 text-muted">
                Os dados comerciais não foram alterados. Tente carregar
                novamente ou use o Dashboard Anterior enquanto verificamos a
                consulta.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary-action-border bg-primary-action-bg px-4 text-sm font-medium text-primary-action-foreground transition-colors hover:bg-primary-action-bg-hover"
            >
              <RefreshCw size={17} aria-hidden />
              Tentar Novamente
            </button>
            <Link
              href="/dashboard-anterior"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <History size={17} aria-hidden />
              Abrir Dashboard Anterior
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
