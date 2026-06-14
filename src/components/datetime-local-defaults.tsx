"use client";

import { useEffect } from "react";

function formatTodayAtNine() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T09:00`;
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

export function DateTimeLocalDefaults() {
  useEffect(() => {
    function handleInputIntent(event: Event) {
      const target = event.target;

      if (target instanceof HTMLInputElement) {
        setDefaultDateTime(target);
      }
    }

    document.addEventListener("focusin", handleInputIntent);
    document.addEventListener("pointerdown", handleInputIntent, {
      capture: true,
    });

    return () => {
      document.removeEventListener("focusin", handleInputIntent);
      document.removeEventListener("pointerdown", handleInputIntent, {
        capture: true,
      });
    };
  }, []);

  return null;
}
