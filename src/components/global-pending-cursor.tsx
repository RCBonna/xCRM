"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const pendingAttribute = "data-app-pending";
const fallbackTimeoutMs = 30000;

function shouldIgnoreModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function GlobalPendingCursor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    function clearPending() {
      root.removeAttribute(pendingAttribute);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function startPending() {
      root.setAttribute(pendingAttribute, "true");

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(clearPending, fallbackTimeoutMs);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || shouldIgnoreModifiedClick(event)) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (link.target || link.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(link.href, window.location.href);

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const sameLocation =
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search &&
        nextUrl.hash === window.location.hash;

      if (sameLocation) {
        return;
      }

      startPending();
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) {
        return;
      }

      const form = event.target;

      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (form.dataset.noGlobalPending === "true") {
        return;
      }

      startPending();
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", clearPending);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", clearPending);
      clearPending();
    };
  }, []);

  useEffect(() => {
    document.documentElement.removeAttribute(pendingAttribute);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  return null;
}
