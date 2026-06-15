"use client";

import { useState } from "react";

function normalizeUppercase(value: string) {
  return value.toLocaleUpperCase("pt-BR");
}

type UppercaseInputProps = {
  autoComplete?: string;
  className?: string;
  defaultValue?: string | null;
  name: string;
  required?: boolean;
};

export function UppercaseInput({
  autoComplete,
  className,
  defaultValue,
  name,
  required,
}: UppercaseInputProps) {
  const [value, setValue] = useState(normalizeUppercase(defaultValue ?? ""));

  return (
    <input
      required={required}
      name={name}
      type="text"
      value={value}
      onChange={(event) => setValue(normalizeUppercase(event.target.value))}
      autoCapitalize="characters"
      autoComplete={autoComplete}
      spellCheck={false}
      className={className}
    />
  );
}
