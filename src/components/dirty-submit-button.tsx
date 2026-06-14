"use client";

import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function getFormSnapshot(form: HTMLFormElement) {
  const formData = new FormData(form);
  const entries = Array.from(formData.entries()).map(([key, value]) => [
    key,
    String(value),
  ]);

  return JSON.stringify(entries.sort(([first], [second]) => first.localeCompare(second)));
}

type DirtySubmitButtonProps = {
  label?: string;
  variant?: "primary" | "secondary";
};

export function DirtySubmitButton({
  label = "Salvar Alterações",
  variant = "secondary",
}: DirtySubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialSnapshotRef = useRef("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    const form = button?.form;

    if (!form) {
      return;
    }

    const formElement = form;

    function updateDirtyState() {
      setIsDirty(getFormSnapshot(formElement) !== initialSnapshotRef.current);
    }

    initialSnapshotRef.current = getFormSnapshot(formElement);
    updateDirtyState();

    formElement.addEventListener("input", updateDirtyState);
    formElement.addEventListener("change", updateDirtyState);
    formElement.addEventListener("reset", updateDirtyState);

    return () => {
      formElement.removeEventListener("input", updateDirtyState);
      formElement.removeEventListener("change", updateDirtyState);
      formElement.removeEventListener("reset", updateDirtyState);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      disabled={!isDirty}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary"
          ? "h-10 bg-primary px-4 text-sm text-primary-foreground"
          : "h-9 border border-border px-3 text-xs text-muted enabled:hover:border-primary enabled:hover:text-foreground",
      ].join(" ")}
    >
      <Save size={variant === "primary" ? 16 : 14} aria-hidden />
      {label}
    </button>
  );
}
