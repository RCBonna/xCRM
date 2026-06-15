"use client";

import { useEffect, useRef, useState } from "react";

const minuteOptions = ["00", "15", "30", "45"];

function getTodayValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeMinute(value: string) {
  return minuteOptions.includes(value) ? value : "00";
}

function parseDateTimeValue(value?: string) {
  if (!value) {
    return {
      date: "",
      hour: "09",
      minute: "00",
    };
  }

  const [date = "", time = "09:00"] = value.split("T");
  const [hour = "09", minute = "00"] = time.split(":");

  return {
    date,
    hour: hour.padStart(2, "0").slice(0, 2),
    minute: normalizeMinute(minute.padStart(2, "0").slice(0, 2)),
  };
}

type ActionDateTimeInputProps = {
  className?: string;
  defaultValue?: string;
  name: string;
};

export function ActionDateTimeInput({
  className,
  defaultValue,
  name,
}: ActionDateTimeInputProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [initialValue] = useState(() => parseDateTimeValue(defaultValue));
  const [date, setDate] = useState(initialValue.date);
  const [hour, setHour] = useState(initialValue.hour);
  const [minute, setMinute] = useState(initialValue.minute);

  const value = date ? `${date}T${hour}:${minute}` : "";

  useEffect(() => {
    const input = hiddenInputRef.current;

    if (!input) {
      return;
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, [value]);

  return (
    <div
      className={["grid gap-2 sm:grid-cols-[1fr_5rem_5rem]", className]
        .filter(Boolean)
        .join(" ")}
    >
      <input ref={hiddenInputRef} type="hidden" name={name} value={value} />
      <input
        aria-label="Data"
        type="date"
        value={date}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        onChange={(event) => {
          setDate(event.currentTarget.value);
          setHour((currentHour) => currentHour || "09");
          setMinute((currentMinute) => currentMinute || "00");
        }}
        onFocus={() => {
          if (!date) {
            setDate(getTodayValue());
            setHour("09");
            setMinute("00");
          }
        }}
      />
      <select
        aria-label="Hora"
        value={hour}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        onChange={(event) => {
          if (!date) {
            setDate(getTodayValue());
          }

          setHour(event.currentTarget.value);
        }}
      >
        {Array.from({ length: 24 }, (_, index) => {
          const option = String(index).padStart(2, "0");

          return (
            <option key={option} value={option}>
              {option}
            </option>
          );
        })}
      </select>
      <select
        aria-label="Minuto"
        value={minute}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        onChange={(event) => {
          if (!date) {
            setDate(getTodayValue());
          }

          setMinute(event.currentTarget.value);
        }}
      >
        {minuteOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
