"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type AccountAddPanelProps = {
  buttonLabel: string;
  children: ReactNode;
  contentId: string;
  expandedLabel: string;
};

export function AccountAddPanel({
  buttonLabel,
  children,
  contentId,
  expandedLabel,
}: AccountAddPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="px-4 py-4">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
        >
          <Plus size={16} aria-hidden />
          {expanded ? expandedLabel : buttonLabel}
          {expanded ? (
            <ChevronUp size={15} aria-hidden />
          ) : (
            <ChevronDown size={15} aria-hidden />
          )}
        </button>
      </div>
      {expanded ? <div id={contentId}>{children}</div> : null}
    </>
  );
}
