"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Prisma, UserRole } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamTab = "users" | "teams" | "leaders" | "members";
type UserFormStatus = "ACTIVE" | "INACTIVE";
type TeamFormStatus = "ACTIVE" | "INACTIVE";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

function normalizeUserStatus(value: FormDataEntryValue | null): UserFormStatus {
  return normalizeText(value) === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function normalizeTeamStatus(value: FormDataEntryValue | null): TeamFormStatus {
  return normalizeText(value) === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function teamPath(tab: TeamTab, type: "message" | "error", message: string) {
  return `/settings/team?tab=${tab}&${type}=${encodeMessage(message)}`;
}

function canManageTeamSettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

async function requireTeamSettingsUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser = await getAppUser(user);

  if (!appUser) {
    redirect("/onboarding");
  }

  if (!canManageTeamSettings(appUser.role)) {
    redirect(
      `/dashboard?error=${encodeMessage(
        "Você não tem permissão para gerenciar Equipes e Usuários.",
      )}`,
    );
  }

  return appUser;
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  tenantId: string,
  userId: string,
  summary: string,
  body: string,
) {
  await tx.interaction.create({
    data: {
      tenantId,
      userId,
      channel: "MANUAL_NOTE",
      direction: "INTERNAL",
      summary,
      body,
    },
  });
}

export async function createTeamAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const name = normalizeText(formData.get("teamName"));
  const status = normalizeTeamStatus(formData.get("status"));

  if (name.length < 2) {
    redirect(
      teamPath(
        "teams",
        "error",
        "Informe o Nome da Equipe com pelo menos 2 caracteres.",
      ),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.team.create({
        data: {
          tenantId: appUser.tenantId,
          name,
          status,
        },
      });

      await writeAudit(
        tx,
        appUser.tenantId,
        appUser.id,
        "Equipe Criada",
        `Equipe criada: ${name} com status ${
          status === "ACTIVE" ? "Ativo" : "Inativo"
        }.`,
      );
    });
  } catch {
    redirect(teamPath("teams", "error", "Já existe uma equipe com este nome."));
  }

  revalidatePath("/settings/team");
  redirect(teamPath("teams", "message", "Equipe criada."));
}

export async function updateTeamAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const teamId = normalizeText(formData.get("teamId"));
  const name = normalizeText(formData.get("teamName"));
  const status = normalizeTeamStatus(formData.get("status"));

  if (!teamId || name.length < 2) {
    redirect(
      teamPath(
        "teams",
        "error",
        "Informe uma Equipe e um Nome da Equipe válidos.",
      ),
    );
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId: appUser.tenantId,
    },
    select: {
      id: true,
      name: true,
      manager: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!team) {
    redirect(teamPath("teams", "error", "Equipe não encontrada neste tenant."));
  }

  const hasActiveManager = team.manager?.status === "ACTIVE";
  const activeMembers = team.members.filter(
    (member) => member.user.status === "ACTIVE",
  );

  if (status === "INACTIVE" && (hasActiveManager || activeMembers.length > 0)) {
    redirect(
      teamPath(
        "teams",
        "error",
        "Para inativar a Equipe, remova ou inative todos os Usuários ativos e retire o Líder ativo.",
      ),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: {
          id: team.id,
        },
        data: {
          name,
          status,
        },
      });

      await writeAudit(
        tx,
        appUser.tenantId,
        appUser.id,
        "Equipe Atualizada",
        `Equipe alterada de ${team.name} para ${name} com status ${
          status === "ACTIVE" ? "Ativo" : "Inativo"
        }.`,
      );
    });
  } catch {
    redirect(teamPath("teams", "error", "Já existe uma equipe com este nome."));
  }

  revalidatePath("/settings/team");
  redirect(teamPath("teams", "message", "Equipe atualizada."));
}

export async function inactivateTeamAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const teamId = normalizeText(formData.get("teamId"));

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId: appUser.tenantId,
    },
    include: {
      manager: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!team) {
    redirect(teamPath("teams", "error", "Equipe não encontrada neste tenant."));
  }

  const hasActiveManager = team.manager?.status === "ACTIVE";
  const activeMembers = team.members.filter(
    (member) => member.user.status === "ACTIVE",
  );

  if (hasActiveManager || activeMembers.length > 0) {
    redirect(
      teamPath(
        "teams",
        "error",
        "Para inativar a Equipe, remova ou inative todos os Usuários ativos e retire o Líder ativo.",
      ),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: {
        id: team.id,
      },
      data: {
        status: "INACTIVE",
      },
    });

    await writeAudit(
      tx,
      appUser.tenantId,
      appUser.id,
      "Equipe Inativada",
      `Equipe inativada: ${team.name}.`,
    );
  });

  revalidatePath("/settings/team");
  redirect(teamPath("teams", "message", "Equipe inativada."));
}

export async function createTeamUserAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const name = normalizeText(formData.get("userName"));
  const email = normalizeEmail(formData.get("userEmail"));
  const role = normalizeText(formData.get("role")) as UserRole;
  const status = normalizeUserStatus(formData.get("status"));

  if (name.length < 2 || !email.includes("@")) {
    redirect(
      teamPath(
        "users",
        "error",
        "Informe Nome e E-mail válidos para o usuário.",
      ),
    );
  }

  if (!["MANAGER", "SELLER", "ASSISTANT"].includes(role)) {
    redirect(
      teamPath(
        "users",
        "error",
        "Perfil permitido: Líder, Vendedor ou Assistente.",
      ),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          tenantId: appUser.tenantId,
          name,
          email,
          role,
          status,
        },
      });

      await writeAudit(
        tx,
        appUser.tenantId,
        appUser.id,
        "Usuário Convidado",
        `Usuário cadastrado: ${name} (${email}) como ${
          role === "MANAGER"
            ? "Líder"
            : role === "ASSISTANT"
              ? "Assistente"
              : "Vendedor"
        } com status ${status === "ACTIVE" ? "Ativo" : "Inativo"}.`,
      );
    });
  } catch {
    redirect(
      teamPath("users", "error", "Já existe um usuário com este e-mail."),
    );
  }

  revalidatePath("/settings/team");
  redirect(
    teamPath(
      "users",
      "message",
      "Usuário cadastrado. Envio real de convite por e-mail será ativado em um próximo corte.",
    ),
  );
}

export async function updateTeamUserAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const userId = normalizeText(formData.get("userId"));
  const name = normalizeText(formData.get("userName"));
  const email = normalizeEmail(formData.get("userEmail"));
  const role = normalizeText(formData.get("role")) as UserRole;
  const status = normalizeUserStatus(formData.get("status"));

  if (!userId || name.length < 2 || !email.includes("@")) {
    redirect(
      teamPath(
        "users",
        "error",
        "Informe Usuário, Nome e E-mail válidos para alterar.",
      ),
    );
  }

  if (!["MANAGER", "SELLER", "ASSISTANT"].includes(role)) {
    redirect(
      teamPath(
        "users",
        "error",
        "Perfil permitido neste cadastro: Líder, Vendedor ou Assistente.",
      ),
    );
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: appUser.tenantId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!targetUser) {
    redirect(teamPath("users", "error", "Usuário não encontrado neste tenant."));
  }

  if (["OWNER", "ADMIN"].includes(targetUser.role)) {
    redirect(
      teamPath(
        "users",
        "error",
        "Owner e Admin não podem ser alterados por este fluxo.",
      ),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: targetUser.id,
        },
        data: {
          name,
          email,
          role,
          status,
        },
      });

      await writeAudit(
        tx,
        appUser.tenantId,
        appUser.id,
        "Usuário Atualizado",
        `Usuário atualizado: ${targetUser.name} para ${name} com status ${
          status === "ACTIVE" ? "Ativo" : "Inativo"
        }.`,
      );
    });
  } catch {
    redirect(
      teamPath("users", "error", "Já existe um usuário com este e-mail."),
    );
  }

  revalidatePath("/settings/team");
  redirect(teamPath("users", "message", "Usuário atualizado."));
}

export async function inactivateTeamUserAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const userId = normalizeText(formData.get("userId"));

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: appUser.tenantId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!targetUser) {
    redirect(teamPath("users", "error", "Usuário não encontrado neste tenant."));
  }

  if (targetUser.id === appUser.id || ["OWNER", "ADMIN"].includes(targetUser.role)) {
    redirect(
      teamPath(
        "users",
        "error",
        "Este usuário não pode ser inativado por este fluxo.",
      ),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        status: "INACTIVE",
      },
    });

    await writeAudit(
      tx,
      appUser.tenantId,
      appUser.id,
      "Usuário Inativado",
      `Usuário inativado: ${targetUser.name}.`,
    );
  });

  revalidatePath("/settings/team");
  redirect(teamPath("users", "message", "Usuário inativado."));
}

export async function assignTeamManagerAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const teamId = normalizeText(formData.get("teamId"));
  const managerUserId = normalizeText(formData.get("managerUserId")) || null;

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId: appUser.tenantId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!team) {
    redirect(
      teamPath("leaders", "error", "Equipe ativa não encontrada neste tenant."),
    );
  }

  let managerName = "Sem líder";

  if (managerUserId) {
    const manager = await prisma.user.findFirst({
      where: {
        id: managerUserId,
        tenantId: appUser.tenantId,
        role: "MANAGER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!manager) {
      redirect(
        teamPath(
          "leaders",
          "error",
          "Líder ativo selecionado não encontrado neste tenant.",
        ),
      );
    }

    managerName = manager.name;
  }

  await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: {
        id: team.id,
      },
      data: {
        managerUserId,
      },
    });

    await writeAudit(
      tx,
      appUser.tenantId,
      appUser.id,
      "Líder da Equipe Alterado",
      `Equipe ${team.name} agora está com líder: ${managerName}.`,
    );
  });

  revalidatePath("/settings/team");
  redirect(teamPath("leaders", "message", "Líder da Equipe atualizado."));
}

export async function assignTeamMemberAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const teamId = normalizeText(formData.get("teamId"));
  const userId = normalizeText(formData.get("userId"));

  if (!teamId || !userId) {
    redirect(
      teamPath("members", "error", "Informe Equipe e Usuário para vincular."),
    );
  }

  const [team, targetUser] = await Promise.all([
    prisma.team.findFirst({
      where: {
        id: teamId,
        tenantId: appUser.tenantId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: appUser.tenantId,
        role: {
          in: ["MANAGER", "SELLER", "ASSISTANT"],
        },
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!team || !targetUser) {
    redirect(
      teamPath(
        "members",
        "error",
        "Equipe ativa ou Usuário permitido não encontrado neste tenant.",
      ),
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          tenantId: appUser.tenantId,
          teamId: team.id,
          userId: targetUser.id,
        },
      });

      await writeAudit(
        tx,
        appUser.tenantId,
        appUser.id,
        "Usuário Vinculado",
        `${targetUser.name} vinculado à equipe ${team.name}.`,
      );
    });
  } catch {
    redirect(
      teamPath("members", "error", "Usuário já está vinculado a esta equipe."),
    );
  }

  revalidatePath("/settings/team");
  redirect(teamPath("members", "message", "Usuário vinculado."));
}

export async function removeTeamMemberAction(formData: FormData) {
  const appUser = await requireTeamSettingsUser();
  const membershipId = normalizeText(formData.get("membershipId"));

  const membership = await prisma.teamMember.findFirst({
    where: {
      id: membershipId,
      tenantId: appUser.tenantId,
    },
    include: {
      team: true,
      user: true,
    },
  });

  if (!membership) {
    redirect(teamPath("members", "error", "Vínculo não encontrado."));
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.delete({
      where: {
        id: membership.id,
      },
    });

    await writeAudit(
      tx,
      appUser.tenantId,
      appUser.id,
      "Usuário Removido da Equipe",
      `${membership.user.name} removido da equipe ${membership.team.name}.`,
    );
  });

  revalidatePath("/settings/team");
  redirect(teamPath("members", "message", "Usuário removido da Equipe."));
}
