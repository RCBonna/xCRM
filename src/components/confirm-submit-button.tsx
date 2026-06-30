"use client";

import { useState } from "react";

type ConfirmSubmitButtonProps = {
  formId: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  className?: string;
  confirmClassName?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export function ConfirmSubmitButton({
  formId,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  className,
  confirmClassName = "inline-flex h-10 items-center justify-center rounded-md bg-danger px-4 text-sm font-medium text-background",
  disabled = false,
  children,
}: ConfirmSubmitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-xl shadow-black/30">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                form={formId}
                className={confirmClassName}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
