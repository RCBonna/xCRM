import { APP_VERSION } from "@/lib/app-version";

export function VersionBanner() {
  return (
    <div className="border-b border-border bg-surface-muted px-4 py-1 text-center text-xs text-muted">
      Versao: {APP_VERSION}
    </div>
  );
}
