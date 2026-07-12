"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { useState } from "react";

type CompletedActivityItem = {
  id: string;
  title: string;
  completedAt: string;
};

type AccountCompletedActivitiesPanelProps = {
  activities: CompletedActivityItem[];
};

export function AccountCompletedActivitiesPanel({
  activities,
}: AccountCompletedActivitiesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExtraItems = activities.length > 1;
  const visibleActivities = expanded ? activities : activities.slice(0, 1);
  const contentId = "account-completed-activities-content";

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CheckCircle2 size={18} className="text-primary" aria-hidden />
          Ações Concluídas
        </h2>
        {hasExtraItems && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {expanded ? "Recolher" : "Ver Todas"}
            {expanded ? (
              <ChevronUp size={15} aria-hidden />
            ) : (
              <ChevronDown size={15} aria-hidden />
            )}
          </button>
        )}
      </div>
      <div id={contentId} className="divide-y divide-border">
        {activities.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">
            Nenhuma ação concluída.
          </p>
        ) : (
          visibleActivities.map((activity) => (
            <div key={activity.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{activity.title}</p>
              <p className="flex items-center gap-2 text-xs leading-5 text-muted">
                <Clock3 size={13} aria-hidden />
                {activity.completedAt}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
