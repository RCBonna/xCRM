"use client";

import { ChevronDown, ChevronRight, History } from "lucide-react";
import { useState } from "react";

type TeamAuditLog = {
  id: string;
  summary: string;
  details: string | null;
  occurredAt: string;
  userName: string | null;
};

type TeamAuditLogPanelProps = {
  logs: TeamAuditLog[];
};

export function TeamAuditLogPanel({ logs }: TeamAuditLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ToggleIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <section className="rounded-md border border-border bg-surface">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-muted"
      >
        <span className="flex items-center gap-2 text-base font-semibold">
          <History size={18} className="text-primary" aria-hidden />
          Log de Equipes e Usuários
        </span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {logs.length} registro(s)
          <ToggleIcon size={16} aria-hidden />
        </span>
      </button>

      {isOpen ? (
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              Nenhum registro administrativo encontrado.
            </p>
          ) : (
            logs.map((log) => (
              <article key={log.id} className="grid gap-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{log.summary}</p>
                  <span className="text-xs text-muted">
                    {log.occurredAt}
                    {log.userName ? ` - ${log.userName}` : ""}
                  </span>
                </div>
                {log.details ? (
                  <p className="leading-6 text-muted">{log.details}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
