"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ListFilter,
  Save,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  completeAgendaActivityAction,
  updateAgendaActivityAction,
} from "@/app/agenda/actions";

type AgendaActivity = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: number;
  status: string;
  scheduledAt: string | null;
  account: { id: string; name: string } | null;
  owner: { name: string | null; email: string };
};

type AgendaCalendarProps = {
  activities: AgendaActivity[];
  rangeStart: string;
  rangeEnd: string;
  view: "day" | "week" | "month" | "list";
  returnTo: string;
};

const viewLabels = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  list: "Lista",
};

const typeLabels: Record<string, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visita",
  MEETING: "Reunião",
  TASK: "Tarefa",
  FOLLOW_UP: "Follow-up",
  INTERNAL_TASK: "Tarefa Interna",
};

const priorityLabels: Record<number, string> = {
  1: "Alta",
  2: "Média",
  3: "Baixa",
};

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function atLocalMidnight(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(first: string | Date | null, second: Date) {
  if (!first) return false;
  const date = atLocalMidnight(first);
  return date.getTime() === second.getTime();
}

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function initials(name: string | null, email: string) {
  const source = name || email;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function priorityClass(priority: number) {
  if (priority === 1) return "bg-danger";
  if (priority === 2) return "bg-warning";
  return "bg-muted";
}

function ActivityCard({
  activity,
  selected,
  onSelect,
}: {
  activity: AgendaActivity;
  selected: boolean;
  onSelect: () => void;
}) {
  const ownerName = activity.owner.name || activity.owner.email;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "w-full rounded-md border border-border bg-surface px-2 py-2 text-left text-sm transition-colors hover:bg-surface-muted",
        selected ? "border-primary bg-surface-muted" : "",
      ].join(" ")}
    >
      <span className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityClass(activity.priority)}`} aria-label={`Prioridade ${priorityLabels[activity.priority]}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">{activity.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {activity.account?.name ?? "Atividade Geral"}
          </span>
          {activity.scheduledAt ? (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Clock3 size={12} aria-hidden />
              {timeFormatter.format(new Date(activity.scheduledAt))}
            </span>
          ) : null}
        </span>
        <span className="group relative shrink-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-label={`Responsável: ${ownerName}`}>
            {initials(activity.owner.name, activity.owner.email)}
          </span>
          <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-max max-w-52 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground shadow-lg group-hover:block group-focus-within:block">
            {ownerName}
          </span>
        </span>
      </span>
    </button>
  );
}

export function AgendaCalendar({
  activities,
  rangeStart,
  rangeEnd,
  view,
  returnTo,
}: AgendaCalendarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedActivity = activities.find((activity) => activity.id === selectedId) ?? null;
  const days = useMemo(() => {
    const result: Date[] = [];
    const cursor = atLocalMidnight(rangeStart);
    const finalDay = atLocalMidnight(rangeEnd);
    while (cursor <= finalDay) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);
  const scheduledActivities = activities.filter((activity) => activity.scheduledAt);
  const unscheduledActivities = activities.filter(
    (activity) => activity.status === "PENDING" && !activity.scheduledAt,
  );
  const overdueActivities = activities.filter((activity) => {
    if (activity.status !== "PENDING" || !activity.scheduledAt) return false;
    return atLocalMidnight(activity.scheduledAt) < atLocalMidnight(new Date());
  });

  function renderWeek() {
    return (
      <div className="overflow-x-auto">
        <div className="grid min-w-[54rem] grid-cols-7 divide-x divide-border border-b border-border">
          {days.map((day) => {
            const dayActivities = scheduledActivities.filter((activity) => sameDay(activity.scheduledAt, day));
            return (
              <section key={day.toISOString()} className="min-h-[27rem] p-2">
                <h3 className="border-b border-border pb-2 text-center text-xs font-semibold text-muted">
                  {dayFormatter.format(day)}
                </h3>
                <div className="mt-2 grid gap-2">
                  {dayActivities.length ? dayActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />
                  )) : <p className="px-1 py-3 text-center text-xs text-muted">Sem atividades</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  function renderDay() {
    const day = days[0];
    const dayActivities = scheduledActivities.filter((activity) => sameDay(activity.scheduledAt, day));
    return (
      <section className="p-4">
        <h3 className="text-sm font-semibold capitalize">{dayFormatter.format(day)}</h3>
        <div className="mt-4 grid gap-2">
          {dayActivities.length ? dayActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />
          )) : <p className="text-sm text-muted">Nenhuma atividade agendada neste dia.</p>}
        </div>
      </section>
    );
  }

  function renderMonth() {
    return (
      <div className="overflow-x-auto">
        <div className="grid min-w-[48rem] grid-cols-7 divide-x divide-y divide-border">
          {days.map((day) => {
            const dayActivities = scheduledActivities.filter((activity) => sameDay(activity.scheduledAt, day));
            return (
              <section key={day.toISOString()} className="min-h-32 p-2">
                <h3 className="text-xs font-semibold text-muted">{day.getDate()}</h3>
                <div className="mt-2 grid gap-1">
                  {dayActivities.slice(0, 3).map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />
                  ))}
                  {dayActivities.length > 3 ? <p className="text-xs text-muted">+{dayActivities.length - 3} atividades</p> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  function renderList() {
    const groups = new Map<string, AgendaActivity[]>();
    scheduledActivities.forEach((activity) => {
      const key = atLocalMidnight(activity.scheduledAt as string).toISOString();
      groups.set(key, [...(groups.get(key) ?? []), activity]);
    });
    return (
      <div className="divide-y divide-border">
        {Array.from(groups.entries()).map(([key, items]) => (
          <section key={key} className="p-4">
            <h3 className="text-sm font-semibold capitalize">{dayFormatter.format(new Date(key))}</h3>
            <div className="mt-3 grid gap-2">
              {items.map((activity) => <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />)}
            </div>
          </section>
        ))}
        {groups.size === 0 ? <p className="p-4 text-sm text-muted">Nenhuma atividade agendada neste período.</p> : null}
      </div>
    );
  }

  const content = view === "week" ? renderWeek() : view === "day" ? renderDay() : view === "month" ? renderMonth() : renderList();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <CalendarDays size={18} className="text-primary" aria-hidden />
          <h2 className="text-base font-semibold">{viewLabels[view]}</h2>
          <span className="ml-auto text-sm text-muted">{scheduledActivities.length} em exibição</span>
        </div>
        {content}
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><ListFilter size={16} className="text-primary" aria-hidden />Sem Agendamento</h2>
            <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">{unscheduledActivities.length}</span>
          </div>
          <div className="grid gap-2 p-3">
            {unscheduledActivities.length ? unscheduledActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />) : <p className="text-sm text-muted">Nenhuma pendência sem Data e Hora.</p>}
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><CircleAlert size={16} className="text-danger" aria-hidden />Atrasadas</h2>
            <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">{overdueActivities.length}</span>
          </div>
          <div className="grid gap-2 p-3">
            {overdueActivities.length ? overdueActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} selected={activity.id === selectedId} onSelect={() => setSelectedId(activity.id)} />) : <p className="text-sm text-muted">Nenhuma atividade atrasada.</p>}
          </div>
        </section>

        {selectedActivity ? (
          <section className="rounded-md border border-primary bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><UserRound size={16} className="text-primary" aria-hidden />Editar Atividade</h2>
            </div>
            <form action={updateAgendaActivityAction} className="grid gap-3 p-4">
              <input type="hidden" name="activityId" value={selectedActivity.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="grid gap-1 text-sm font-medium"><span>Título</span><input name="title" defaultValue={selectedActivity.title} className="h-10 rounded-md border border-border px-3 text-sm" required /></label>
              <label className="grid gap-1 text-sm font-medium"><span>Tipo</span><select name="type" defaultValue={selectedActivity.type} className="h-10 rounded-md border border-border px-3 text-sm">{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-medium"><span>Data e Hora</span><input name="scheduledAt" type="datetime-local" defaultValue={formatDateTimeLocal(selectedActivity.scheduledAt)} className="h-10 rounded-md border border-border px-3 text-sm" /></label>
              <label className="grid gap-1 text-sm font-medium"><span>Prioridade</span><select name="priority" defaultValue={selectedActivity.priority} className="h-10 rounded-md border border-border px-3 text-sm">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-medium"><span>Descrição</span><textarea name="description" defaultValue={selectedActivity.description ?? ""} className="min-h-20 rounded-md border border-border px-3 py-2 text-sm" /></label>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Save size={15} aria-hidden />Salvar Atividade</button>
            </form>
            {selectedActivity.status === "PENDING" ? <form action={completeAgendaActivityAction} className="border-t border-border p-4"><input type="hidden" name="activityId" value={selectedActivity.id} /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary px-3 text-sm font-semibold text-primary"><CheckCircle2 size={15} aria-hidden />Concluir Atividade</button></form> : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
