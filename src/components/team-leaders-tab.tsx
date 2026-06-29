"use client";

import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { assignTeamManagerAction } from "@/app/settings/team/actions";

type TeamLeaderTeam = {
  id: string;
  name: string;
  status: string;
  managerUserId: string | null;
  managerName: string | null;
  memberCount: number;
  activeMemberCount: number;
};

type TeamLeaderManager = {
  id: string;
  name: string;
};

type TeamLeadersTabProps = {
  teams: TeamLeaderTeam[];
  managers: TeamLeaderManager[];
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  ARCHIVED: "Arquivada",
};

const inputClass =
  "h-10 rounded-md border border-border bg-background px-3 text-sm";

const emptyLeaderForm = {
  teamId: "",
  teamName: "",
  managerUserId: "",
};

export function TeamLeadersTab({ teams, managers }: TeamLeadersTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [formState, setFormState] = useState(emptyLeaderForm);
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [selectedTeamId, teams],
  );
  const hasSelection = Boolean(selectedTeamId);

  function selectTeam(team: TeamLeaderTeam) {
    setSelectedTeamId(team.id);
    setFormState({
      teamId: team.id,
      teamName: team.name,
      managerUserId: team.managerUserId ?? "",
    });
  }

  function clearForm() {
    setSelectedTeamId("");
    setFormState(emptyLeaderForm);
  }

  return (
    <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <form action={assignTeamManagerAction} className="grid content-start gap-3">
        <input type="hidden" name="teamId" value={formState.teamId} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck size={18} className="text-primary" aria-hidden />
              Líder da Equipe
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {hasSelection
                ? "Altere o líder da equipe selecionada."
                : "Selecione uma equipe na lista para alterar o líder."}
            </p>
          </div>
          {hasSelection ? (
            <button
              type="button"
              onClick={clearForm}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <RotateCcw size={14} aria-hidden />
              Limpar
            </button>
          ) : null}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Equipe</span>
          <input
            readOnly
            value={formState.teamName}
            placeholder="Selecione uma equipe"
            className={`${inputClass} text-muted`}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Líder</span>
          <select
            name="managerUserId"
            disabled={!hasSelection}
            value={formState.managerUserId}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                managerUserId: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="">Sem líder</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!hasSelection}
          className={[
            "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
            hasSelection
              ? "bg-primary text-primary-foreground"
              : "cursor-not-allowed border border-border text-muted",
          ].join(" ")}
        >
          <Save size={15} aria-hidden />
          Salvar Líder
        </button>
      </form>

      <div className="rounded-md border border-border">
        <div className="border-b border-border px-3 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck size={18} className="text-primary" aria-hidden />
            Equipes Ativas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Selecione uma equipe para carregar o líder no formulário.
          </p>
        </div>
        <div className="divide-y divide-border">
          {teams.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              Nenhuma equipe ativa disponível.
            </p>
          ) : (
            teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => selectTeam(team)}
                  className={[
                    "grid w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-muted md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_5rem] md:items-center",
                    isSelected ? "bg-surface-muted" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{team.name}</p>
                    <p className="text-xs text-muted md:hidden">
                      {team.activeMemberCount}/{team.memberCount} ativo(s)
                    </p>
                  </div>
                  <p className="truncate text-xs leading-5 text-muted">
                    Líder: {team.managerName ?? "Sem líder"}
                  </p>
                  <p className="hidden text-xs text-muted md:block">
                    {team.activeMemberCount}/{team.memberCount} ativo(s)
                  </p>
                  <span className="w-fit rounded bg-surface-muted px-2 py-1 text-xs text-muted md:justify-self-end">
                    {statusLabels[team.status]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
