"use client";

import { Filter, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type ImportStatusFilterOption = {
  label: string;
  href: string;
  isActive: boolean;
};

type ImportStatusFilterProps = {
  label: string;
  options: ImportStatusFilterOption[];
};

export function ImportStatusFilter({ label, options }: ImportStatusFilterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "progress";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [isPending]);

  function selectFilter(href: string) {
    setIsOpen(false);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Filtrar linhas por status"
        disabled={isPending}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:cursor-progress disabled:opacity-70"
      >
        {isPending ? (
          <LoaderCircle size={14} className="animate-spin" aria-hidden />
        ) : (
          <Filter size={14} aria-hidden />
        )}
        {label}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-border bg-surface shadow-xl">
          {options.map((option) => (
            <button
              key={option.href}
              type="button"
              disabled={isPending}
              onClick={() => selectFilter(option.href)}
              className={[
                "block w-full px-3 py-2 text-left text-xs transition-colors disabled:cursor-progress",
                option.isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
