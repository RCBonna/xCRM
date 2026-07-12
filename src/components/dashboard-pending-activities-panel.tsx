"use client";

import { CalendarClock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const nextActivity = activities[0];

  useEffect(() => {
    if (!hasActivities) {
      return;
    }

    const expandFromHash = () => {
      if (window.location.hash === "#atividades-pendentes") {
        setExpanded(true);
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>(
        'a[href="#atividades-pendentes"]',
      );

      if (anchor) {
        setExpanded(true);
      }
    };

    expandFromHash();
    window.addEventListener("hashchange", expandFromHash);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      window.removeEventListener("hashchange", expandFromHash);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [hasActivities]);

  return (
    <section
      id="atividades-pendentes"
      className="scroll-mt-6 rounded-md border border-border bg-surface"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock size={18} className="text-primary" aria-hidden />
            Atividades Pendentes
          </h2>
          <p className="text-sm text-muted">
            Tarefas abertas da organização atual, incluindo atividades gerais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
            {hasActivities
              ? `${activities.length} em exibição`
              : "Nenhuma pendência"}
          </span>
          {hasActivities ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="pending-activities-content"
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex h-11 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {expanded ? "Recolher" : "Expandir"}
              {expanded ? (
                <ChevronUp size={15} aria-hidden />
              ) : (
                <ChevronDown size={15} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div id="pending-activities-content" className="divide-y divide-border">
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-5 text-muted">
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
                    <p className="mt-1 text-sm leading-5 text-muted">
                      {activity.description}
                    </p>
                  ) : null}
                </div>
                <form action={completeDashboardActivityAction}>
                  <input type="hidden" name="activityId" value={activity.id} />
                  <PendingSubmitButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-wait disabled:opacity-80 lg:w-auto">
                    <CheckCircle2 size={15} aria-hidden />
                    Concluir
                  </PendingSubmitButton>
                </form>
              </article>
            ))
          )}
        </div>
      ) : (
        <div id="pending-activities-content" className="px-4 py-4 text-sm text-muted">
          {nextActivity ? (
            <p>
              Próxima:{" "}
              <span className="font-medium text-foreground">
                {nextActivity.title}
              </span>
              {nextActivity.scheduledAt
                ? ` - ${nextActivity.scheduledAt}`
                : " - Sem Data e Hora"}
            </p>
          ) : (
            <p>Sua equipe não possui atividades pendentes.</p>
          )}
        </div>
      )}
    </section>
  );
}
