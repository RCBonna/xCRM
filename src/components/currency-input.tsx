"use client";

import { useEffect, useRef } from "react";

type CurrencyInputProps = {
  className?: string;
  id?: string;
  name: string;
  placeholder?: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function parseCurrencyValue(value: string) {
  const cleanValue = value.replace(/[^\d,.-]/g, "").trim();

  if (!cleanValue) {
    return null;
  }

  const normalizedValue = cleanValue.includes(",")
    ? cleanValue.replace(/\./g, "").replace(",", ".")
    : cleanValue.split(".").length > 2
      ? cleanValue.replace(/\./g, "")
      : cleanValue;
  const amount = Number(normalizedValue);

  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function formatCurrencyValue(value: string) {
  const amount = parseCurrencyValue(value);
  return amount === null ? "" : currencyFormatter.format(amount);
}

function formatInputValue(input: HTMLInputElement) {
  input.value = formatCurrencyValue(input.value);
}

export function CurrencyInput({
  className,
  id,
  name,
  placeholder = "R$ 0,00",
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;

    if (!input || !form) {
      return;
    }

    const inputElement = input;

    function handleSubmit() {
      formatInputValue(inputElement);
    }

    form.addEventListener("submit", handleSubmit);

    return () => {
      form.removeEventListener("submit", handleSubmit);
    };
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      className={className}
      onBlur={(event) => formatInputValue(event.currentTarget)}
      onFocus={(event) => event.currentTarget.select()}
    />
  );
}
