"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
};

export function PendingSubmitButton({
  children,
  pendingLabel = "Processando...",
  className,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <LoaderCircle size={15} className="animate-spin" aria-hidden />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
