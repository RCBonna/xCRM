import {
  Building2,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ThemeSelector } from "@/components/theme-selector";

const metrics = [
  {
    label: "Prospects na base",
    value: "379",
    detail: "linhas detectadas para saneamento",
    icon: Building2,
  },
  {
    label: "Contatos identificados",
    value: "349",
    detail: "vindos da planilha inicial",
    icon: UsersRound,
  },
  {
    label: "Follow-ups claros",
    value: "21",
    detail: "precisam virar tarefas",
    icon: CalendarClock,
  },
  {
    label: "Etapas do MVP",
    value: "6",
    detail: "issues epicas abertas",
    icon: ClipboardList,
  },
];

const stages = [
  { name: "Visitantes", count: 98 },
  { name: "Contatos", count: 111 },
  { name: "Qualificacao", count: 64 },
  { name: "Oportunidades", count: 38 },
  { name: "Proposta", count: 17 },
  { name: "Clientes", count: 9 },
];

const nextActions = [
  "Conectar Supabase e preparar variaveis de ambiente.",
  "Validar o schema Prisma multi tenant.",
  "Definir primeira migration com RLS documentado.",
  "Criar fluxo de autenticacao com tenant ativo.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">
              Fundacao do MVP
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              xCRM operacional
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Base inicial para o CRM SaaS multiempresa: Supabase, Prisma, PWA,
              funil comercial, importacao e IA assistiva.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ThemeSelector />
            <a
              href="https://github.com/RCBonna/xCRM/issues"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <ClipboardList size={16} aria-hidden />
              Issues
            </a>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-md border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {metric.value}
                    </p>
                  </div>
                  <span className="rounded-md bg-surface-muted p-2 text-primary">
                    <Icon size={18} aria-hidden />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {metric.detail}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Funil previsto</h2>
                <p className="text-sm text-muted">
                  Distribuicao ilustrativa para validar layout e densidade.
                </p>
              </div>
              <CircleDollarSign size={20} className="text-primary" aria-hidden />
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
              {stages.map((stage) => (
                <div
                  key={stage.name}
                  className="min-h-32 rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{stage.name}</h3>
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                      {stage.count}
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded bg-surface-muted">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${Math.min(stage.count, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-md border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles size={18} className="text-primary" aria-hidden />
                Proximas fundacoes
              </h2>
              <p className="text-sm text-muted">
                Primeiras tarefas tecnicas antes das telas finais.
              </p>
            </div>
            <ol className="divide-y divide-border">
              {nextActions.map((action, index) => (
                <li key={action} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-muted text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="leading-6">{action}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </main>
  );
}
