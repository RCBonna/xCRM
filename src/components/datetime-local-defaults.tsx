"use client";

import { useEffect } from "react";

const DATE_TIME_STEP_MINUTES = 15;

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatTodayAtNine() {
  const now = new Date();
  now.setHours(9, 0, 0, 0);

  return formatDateTimeLocal(now);
}

function setDefaultDateTime(input: HTMLInputElement) {
  if (
    input.type !== "datetime-local" ||
    input.value ||
    input.disabled ||
    input.readOnly
  ) {
    return;
  }

  input.value = formatTodayAtNine();
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function normalizeDateTimeStep(input: HTMLInputElement) {
  if (
    input.type !== "datetime-local" ||
    !input.value ||
    input.disabled ||
    input.readOnly
  ) {
    return;
  }

  const date = new Date(input.value);

  if (Number.isNaN(date.getTime())) {
    return;
  }

  const roundedMinutes =
    Math.round(date.getMinutes() / DATE_TIME_STEP_MINUTES) *
    DATE_TIME_STEP_MINUTES;

  date.setSeconds(0, 0);

  if (roundedMinutes === 60) {
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
  } else {
    date.setMinutes(roundedMinutes);
  }

  const nextValue = formatDateTimeLocal(date);

  if (input.value === nextValue) {
    return;
  }

  input.value = nextValue;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function DateTimeLocalDefaults() {
  useEffect(() => {
    function handleInputIntent(event: Event) {
      const target = event.target;

      if (target instanceof HTMLInputElement) {
        setDefaultDateTime(target);
      }
    }

    function handleInputCommit(event: Event) {
      const target = event.target;

      if (target instanceof HTMLInputElement) {
        normalizeDateTimeStep(target);
      }
    }

    document.addEventListener("focusin", handleInputIntent);
    document.addEventListener("pointerdown", handleInputIntent, {
      capture: true,
    });
    document.addEventListener("change", handleInputCommit);
    document.addEventListener("focusout", handleInputCommit);

    return () => {
      document.removeEventListener("focusin", handleInputIntent);
      document.removeEventListener("pointerdown", handleInputIntent, {
        capture: true,
      });
      document.removeEventListener("change", handleInputCommit);
      document.removeEventListener("focusout", handleInputCommit);
    };
  }, []);

  return null;
}
