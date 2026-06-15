"use client";

import { useState } from "react";

function normalizeCnpj(value: string) {
  const rawValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const base = rawValue.slice(0, 12);
  const checkDigits = rawValue.slice(12).replace(/\D/g, "").slice(0, 2);

  return `${base}${checkDigits}`;
}

function formatCnpj(value: string) {
  const normalized = normalizeCnpj(value);
  const first = normalized.slice(0, 2);
  const second = normalized.slice(2, 5);
  const third = normalized.slice(5, 8);
  const fourth = normalized.slice(8, 12);
  const fifth = normalized.slice(12, 14);

  return [
    first,
    second && `.${second}`,
    third && `.${third}`,
    fourth && `/${fourth}`,
    fifth && `-${fifth}`,
  ]
    .filter(Boolean)
    .join("");
}

type CnpjInputProps = {
  className?: string;
  defaultValue?: string | null;
  name: string;
};

export function CnpjInput({ className, defaultValue, name }: CnpjInputProps) {
  const [value, setValue] = useState(formatCnpj(defaultValue ?? ""));

  return (
    <input
      name={name}
      type="text"
      value={value}
      onChange={(event) => setValue(formatCnpj(event.target.value))}
      autoCapitalize="characters"
      autoComplete="off"
      inputMode="text"
      maxLength={18}
      placeholder="AA.AAA.AAA/AAAA-00"
      spellCheck={false}
      className={className}
    />
  );
}
