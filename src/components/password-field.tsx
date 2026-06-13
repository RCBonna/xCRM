"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: string;
  name: string;
  minLength?: number;
};

export function PasswordField({
  autoComplete,
  name,
  minLength = 8,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        required
        minLength={minLength}
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        className="h-10 w-full rounded-md border border-border bg-background px-3 pr-11 text-sm"
      />
      <button
        type="button"
        title={isVisible ? "Ocultar senha" : "Mostrar senha"}
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded text-muted"
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
