"use client";

import { ChevronDown, ChevronUp, History } from "lucide-react";
import { useState } from "react";

type AccountHistoryItem = {
  id: string;
  summary: string;
  occurredAt: string;
  actor?: string | null;
  body?: string | null;
};

type AccountHistoryPanelProps = {
  interactions: AccountHistoryItem[];
};

export function AccountHistoryPanel({
  interactions,
}: AccountHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExtraItems = interactions.length > 1;
  const visibleInteractions = expanded ? interactions : interactions.slice(0, 1);

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <History size={18} className="text-primary" aria-hidden />
          Histórico
        </h2>
        {hasExtraItems && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {expanded ? "Recolher" : "Ver Todos"}
            {expanded ? (
              <ChevronUp size={15} aria-hidden />
            ) : (
              <ChevronDown size={15} aria-hidden />
            )}
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {interactions.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">
            Histórico ainda não registrado.
          </p>
        ) : (
          visibleInteractions.map((interaction) => (
            <article key={interaction.id} className="px-4 py-2.5 text-sm">
              <p className="font-medium leading-5">{interaction.summary}</p>
              <p className="text-xs leading-4 text-muted">
                {interaction.occurredAt}
                {interaction.actor ? ` - ${interaction.actor}` : ""}
              </p>
              {interaction.body && (
                <p className="mt-1 text-sm leading-5 text-muted">
                  {interaction.body}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
