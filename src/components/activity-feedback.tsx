"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { undoActivityCompletionAction } from "@/app/activities/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type ActivityFeedbackProps = {
  error?: string;
  message?: string;
  undoActivityId?: string;
  undoUntil?: string;
  returnTo: string;
  className?: string;
};

export function ActivityFeedback({
  error,
  message,
  undoActivityId,
  undoUntil,
  returnTo,
  className = "",
}: ActivityFeedbackProps) {
  const [canUndo, setCanUndo] = useState(
    () => Boolean(undoActivityId && undoUntil) && Number(undoUntil) > Date.now(),
  );

  useEffect(() => {
    if (!canUndo || !undoUntil) {
      return;
    }

    const remaining = Math.max(0, Number(undoUntil) - Date.now());
    const timeout = window.setTimeout(() => setCanUndo(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [canUndo, undoUntil]);

  if (!error && !message) {
    return null;
  }

  return (
    <div
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={[
        "flex flex-col gap-2 rounded-md border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
        error ? "border-danger text-danger" : "border-border text-muted",
        className,
      ].join(" ")}
    >
      <span>{error ?? message}</span>
      {!error && canUndo && undoActivityId ? (
        <form action={undoActivityCompletionAction} className="shrink-0">
          <input type="hidden" name="activityId" value={undoActivityId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingSubmitButton
            pendingLabel="Desfazendo..."
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-wait disabled:opacity-80 sm:w-auto"
          >
            <RotateCcw size={15} aria-hidden />
            Desfazer
          </PendingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}
