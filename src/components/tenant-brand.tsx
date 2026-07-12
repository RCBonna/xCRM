import Image from "next/image";
import type { ReactNode } from "react";

type TenantBrandProps = {
  organizationName: string;
  subtitle?: ReactNode;
  title: ReactNode;
};

export function TenantBrand({
  organizationName,
  subtitle,
  title,
}: TenantBrandProps) {
  return (
    <div className="flex items-center gap-4">
      <Image
        src="/brand/scientiam-mark.jpg"
        alt="Logo Scientiam"
        width={96}
        height={96}
        className="h-20 w-20 shrink-0 rounded-md object-contain sm:h-24 sm:w-24"
        priority
      />
      <div className="min-w-0">
        <p className="truncate text-base font-semibold uppercase leading-5 tracking-[0.12em] text-muted">
          {organizationName}
        </p>
        <h1 className="mt-0.5 flex min-w-0 items-center gap-2 text-2xl font-semibold leading-7 tracking-normal">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
