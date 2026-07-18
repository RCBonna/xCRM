"use client";

import { useState } from "react";

function normalizeUppercase(value: string) {
  return value.toLocaleUpperCase("pt-BR");
}

type UppercaseInputProps = {
  autoComplete?: string;
  className?: string;
  defaultValue?: string | null;
  maxLength?: number;
  name: string;
  required?: boolean;
};

export function UppercaseInput({
  autoComplete,
  className,
  defaultValue,
  maxLength,
  name,
  required,
}: UppercaseInputProps) {
  const [value, setValue] = useState(normalizeUppercase(defaultValue ?? ""));

  return (
    <input
      required={required}
      name={name}
      type="text"
      maxLength={maxLength}
      value={value}
      onChange={(event) => setValue(normalizeUppercase(event.target.value))}
      autoCapitalize="characters"
      autoComplete={autoComplete}
      spellCheck={false}
      className={className}
    />
  );
}
