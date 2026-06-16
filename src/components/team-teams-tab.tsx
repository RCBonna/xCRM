"use client";

import { Plus, RotateCcw, Save, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createTeamAction,
  updateTeamAction,
} from "@/app/settings/team/actions";

type Team = {
  id: string;
  name: string;
  status: string;
  managerName: string | null;
  memberCount: number;
  activeMemberCount: number;
};

type TeamTeamsTabProps = {
  teams: Team[];
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
};

const inputClass =
  "h-10 rounded-md border border-border bg-background px-3 text-sm";

const emptyTeam = {
  id: "",
  name: "",
  status: "ACTIVE",
};

export function TeamTeamsTab({ teams }: TeamTeamsTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [formState, setFormState] = useState(emptyTeam);
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [selectedTeamId, teams],
  );
  const isEditing = Boolean(selectedTeamId);

  function selectTeam(team: Team) {
    setSelectedTeamId(team.id);
    setFormState({
      id: team.id,
      name: team.name,
      status: team.status,
    });
  }

  function clearForm() {
    setSelectedTeamId("");
    setFormState(emptyTeam);
  }

  return (
    <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <form
        action={isEditing ? updateTeamAction : createTeamAction}
        className="grid content-start gap-3"
      >
        <input type="hidden" name="teamId" value={formState.id} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Plus size={18} className="text-primary" aria-hidden />
              {isEditing ? "Editar Equipe" : "Nova Equipe"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isEditing
                ? "Altere os dados selecionados e salve."
                : "Cadastre a equipe e defina seu status operacional."}
            </p>
          </div>
          {isEditing ? (
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
          <span className="font-medium">Nome da Equipe</span>
          <input
            name="teamName"
            required
            value={formState.name}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            value={formState.status}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </select>
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          {isEditing ? <Save size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          {isEditing ? "Salvar Equipe" : "Criar Equipe"}
        </button>
      </form>

      <div className="rounded-md border border-border">
        <div className="border-b border-border px-3 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UsersRound size={18} className="text-primary" aria-hidden />
            Equipes Cadastradas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Selecione uma Equipe para carregar os dados no cadastro.
          </p>
        </div>
        <div className="divide-y divide-border">
          {teams.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              Nenhuma Equipe cadastrada.
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
                    "grid w-full gap-2 px-3 py-3 text-left transition-colors hover:bg-surface-muted",
                    isSelected ? "bg-surface-muted" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {team.name}
                      </p>
                      <p className="truncate text-xs leading-5 text-muted">
                        Líder: {team.managerName ?? "Sem líder definido"}
                      </p>
                    </div>
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                      {statusLabels[team.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {team.activeMemberCount}/{team.memberCount} ativo(s)
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
