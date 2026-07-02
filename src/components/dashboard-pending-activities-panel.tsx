"use client";

import { CalendarClock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { completeDashboardActivityAction } from "@/app/dashboard/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type DashboardPendingActivity = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  account: {
    id: string;
    name: string;
  } | null;
};

type DashboardPendingActivitiesPanelProps = {
  activities: DashboardPendingActivity[];
};

export function DashboardPendingActivitiesPanel({
  activities,
}: DashboardPendingActivitiesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActivities = activities.length > 0;

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock size={18} className="text-primary" aria-hidden />
            Atividades Pendentes
          </h2>
          <p className="text-sm text-muted">
            Tarefas abertas do tenant atual, incluindo ações gerais do onboarding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
            {activities.length} em exibição
          </span>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {expanded ? "Recolher" : "Expandir"}
            {expanded ? (
              <ChevronUp size={15} aria-hidden />
            ) : (
              <ChevronDown size={15} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="divide-y divide-border">
          {!hasActivities ? (
            <p className="px-4 py-4 text-sm text-muted">
              Nenhuma atividade pendente.
            </p>
          ) : (
            activities.map((activity) => (
              <article
                key={activity.id}
                className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{activity.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-muted">
                    <span>{activity.scheduledAt ?? "Sem Data e Hora"}</span>
                    {activity.account ? (
                      <Link
                        href={`/accounts/${activity.account.id}`}
                        className="rounded text-primary underline-offset-4 hover:underline"
                      >
                        {activity.account.name}
                      </Link>
                    ) : (
                      <span>Atividade Geral</span>
                    )}
                  </div>
                  {activity.description ? (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {activity.description}
                    </p>
                  ) : null}
                </div>
                <form action={completeDashboardActivityAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <PendingSubmitButton className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-wait disabled:opacity-80 lg:w-auto">
                    <CheckCircle2 size={15} aria-hidden />
                    Concluir
                  </PendingSubmitButton>
                </form>
              </article>
            ))
          )}
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-muted">
          Painel recolhido. Use Expandir para ver e concluir as atividades.
        </p>
      )}
    </section>
  );
}
