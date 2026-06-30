import { UserRound } from "lucide-react";

type UserIdentityCardProps = {
  name: string;
  email: string;
  role: string;
  unreadNotificationsCount?: number;
};

export function UserIdentityCard({
  name,
  email,
  role,
  unreadNotificationsCount = 0,
}: UserIdentityCardProps) {
  const badgeLabel =
    unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);

  return (
    <div className="relative flex h-12 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
        <UserRound size={16} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium leading-4">{name}</p>
        <p className="truncate text-[11px] leading-4 text-muted">
          {email} - {role}
        </p>
      </div>
      {unreadNotificationsCount > 0 ? (
        <span
          aria-label={`${unreadNotificationsCount} notificações não lidas`}
          className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full border border-background bg-danger px-1.5 text-[10px] font-semibold leading-none text-background shadow-sm"
        >
          {badgeLabel}
        </span>
      ) : null}
    </div>
  );
}
