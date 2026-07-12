"use client";

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type AccountSectionPanelProps = {
  actionContent?: ReactNode;
  children: ReactNode;
  count?: number;
  defaultExpanded?: boolean;
  emptyContent?: ReactNode;
  icon: "contacts" | "opportunities" | "actions";
  id: string;
  title: string;
};

const icons = {
  contacts: UserRound,
  opportunities: CircleDollarSign,
  actions: CalendarClock,
};

function formatCount(count: number | undefined, title: string) {
  if (typeof count !== "number") {
    return "Expandir";
  }

  if (title === "Próximas Ações") {
    return `Ver ${count} ${count === 1 ? "Ação" : "Ações"}`;
  }

  const singularTitle = title.endsWith("s") ? title.slice(0, -1) : title;

  return `Ver ${count} ${count === 1 ? singularTitle : title}`;
}

export function AccountSectionPanel({
  actionContent,
  children,
  count,
  defaultExpanded = false,
  emptyContent,
  icon,
  id,
  title,
}: AccountSectionPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = `${id}-content`;
  const Icon = icons[icon];

  useEffect(() => {
    function expandFromHashChange() {
      if (window.location.hash === `#${id}`) {
        setExpanded(true);
      }
    }

    function expandFromAnchorClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(`a[href="#${id}"]`)) {
        setExpanded(true);
      }
    }

    window.addEventListener("hashchange", expandFromHashChange);
    document.addEventListener("click", expandFromAnchorClick);

    return () => {
      window.removeEventListener("hashchange", expandFromHashChange);
      document.removeEventListener("click", expandFromAnchorClick);
    };
  }, [id]);

  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-md border border-border bg-surface"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon size={18} className="text-primary" aria-hidden />
          {title}
        </h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {expanded ? "Recolher" : formatCount(count, title)}
          {expanded ? (
            <ChevronUp size={15} aria-hidden />
          ) : (
            <ChevronDown size={15} aria-hidden />
          )}
        </button>
      </div>
      {expanded ? (
        <div id={contentId} className="divide-y divide-border">
          {children}
        </div>
      ) : (
        <div id={contentId}>{emptyContent}</div>
      )}
      {actionContent}
    </section>
  );
}
