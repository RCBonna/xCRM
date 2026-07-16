"use client";

import { BrushCleaning, Plus, Save, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createTeamUserAction,
  updateTeamUserAction,
} from "@/app/settings/team/actions";

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  canEdit: boolean;
};

type TeamUsersTabProps = {
  users: TeamUser[];
};

const roleLabels: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Admin",
  MANAGER: "Líder",
  SELLER: "Vendedor",
  ASSISTANT: "Assistente",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
};

const inputClass =
  "h-10 rounded-md border border-border bg-background px-3 text-sm";

const emptyUser = {
  id: "",
  name: "",
  email: "",
  role: "SELLER",
  status: "ACTIVE",
};

export function TeamUsersTab({ users }: TeamUsersTabProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formState, setFormState] = useState(emptyUser);
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users],
  );
  const isEditing = Boolean(selectedUserId);

  function selectUser(user: TeamUser) {
    if (!user.canEdit) {
      return;
    }

    setSelectedUserId(user.id);
    setFormState({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  }

  function clearForm() {
    setSelectedUserId("");
    setFormState(emptyUser);
  }

  return (
    <div className="grid gap-6 p-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <form
        action={isEditing ? updateTeamUserAction : createTeamUserAction}
        className="grid content-start gap-3"
      >
        <input type="hidden" name="userId" value={formState.id} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Plus size={18} className="text-primary" aria-hidden />
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isEditing
                ? "Altere os dados selecionados e salve."
                : "Cadastre o usuário e defina seu status operacional."}
            </p>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={clearForm}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
            >
              <BrushCleaning size={14} aria-hidden />
              Limpar
            </button>
          ) : null}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Nome</span>
          <input
            name="userName"
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
          <span className="font-medium">E-mail</span>
          <input
            name="userEmail"
            required
            type="email"
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Perfil</span>
          <select
            name="role"
            value={formState.role}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="SELLER">Vendedor</option>
            <option value="MANAGER">Líder</option>
            <option value="ASSISTANT">Assistente</option>
          </select>
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
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </label>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          {isEditing ? <Save size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          {isEditing ? "Salvar Usuário" : "Criar Usuário"}
        </button>
      </form>

      <div className="rounded-md border border-border">
        <div className="border-b border-border px-3 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserRound size={18} className="text-primary" aria-hidden />
            Usuários
          </h2>
          <p className="mt-1 text-sm text-muted">
            Selecione um usuário para carregar os dados no cadastro.
          </p>
        </div>
        <div className="divide-y divide-border">
          {users.map((user) => {
            const isSelected = selectedUser?.id === user.id;

            return (
              <button
                key={user.id}
                type="button"
                disabled={!user.canEdit}
                onClick={() => selectUser(user)}
                className={[
                  "grid w-full gap-2 px-3 py-3 text-left transition-colors",
                  user.canEdit
                    ? "hover:bg-surface-muted"
                    : "cursor-not-allowed opacity-75",
                  isSelected ? "bg-surface-muted" : "",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs leading-5 text-muted">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                      {roleLabels[user.role]}
                    </span>
                    <span className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                      {statusLabels[user.status]}
                    </span>
                  </div>
                </div>
                {!user.canEdit ? (
                  <p className="text-xs text-muted">
                    Owner/Admin não são alterados neste fluxo.
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
