"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const platformAdmin = await getPlatformAdmin(user);

  if (!platformAdmin) {
    redirect("/dashboard?error=Sem%20permissao%20para%20plataforma.");
  }

  return platformAdmin;
}

export async function suspendTenantAction(formData: FormData) {
  const platformAdmin = await requirePlatformAdmin();
  const tenantId = normalizeText(formData.get("tenantId"));
  const reason = normalizeText(formData.get("reason"));

  if (!tenantId) {
    redirect("/platform?error=Tenant%20nao%20informado.");
  }

  if (!reason) {
    redirect("/platform?error=Informe%20o%20motivo%20da%20suspensao.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!tenant) {
    redirect("/platform?error=Tenant%20nao%20encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: {
        id: tenant.id,
      },
      data: {
        status: "SUSPENDED",
      },
    });

    await tx.tenantStatusEvent.create({
      data: {
        tenantId: tenant.id,
        status: "SUSPENDED",
        reason,
        changedByPlatformAdminId: platformAdmin.id,
      },
    });

    await tx.notification.create({
      data: {
        tenantId: tenant.id,
        recipientPlatformAdminId: platformAdmin.id,
        type: "TENANT_SUSPENDED",
        title: "Tenant Suspenso",
        body: `${tenant.name} foi suspenso por ${platformAdmin.name}.${
          reason ? ` Motivo: ${reason}` : ""
        }`,
        metadata: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          reason,
        },
      },
    });
  });

  revalidatePath("/platform");
  redirect(`/platform?message=${encodeMessage("Tenant suspenso.")}`);
}

export async function reactivateTenantAction(formData: FormData) {
  const platformAdmin = await requirePlatformAdmin();
  const tenantId = normalizeText(formData.get("tenantId"));
  const reason = normalizeText(formData.get("reason"));

  if (!tenantId) {
    redirect("/platform?error=Tenant%20nao%20informado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!tenant) {
    redirect("/platform?error=Tenant%20nao%20encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: {
        id: tenant.id,
      },
      data: {
        status: "ACTIVE",
      },
    });

    await tx.tenantStatusEvent.create({
      data: {
        tenantId: tenant.id,
        status: "ACTIVE",
        reason: reason || null,
        changedByPlatformAdminId: platformAdmin.id,
      },
    });

    await tx.notification.create({
      data: {
        tenantId: tenant.id,
        recipientPlatformAdminId: platformAdmin.id,
        type: "TENANT_REACTIVATED",
        title: "Tenant Reativado",
        body: `${tenant.name} foi reativado por ${platformAdmin.name}.`,
        metadata: {
          tenantId: tenant.id,
          tenantName: tenant.name,
        },
      },
    });
  });

  revalidatePath("/platform");
  redirect(`/platform?message=${encodeMessage("Tenant reativado.")}`);
}

export async function deleteTenantAction(formData: FormData) {
  const platformAdmin = await requirePlatformAdmin();
  const tenantId = normalizeText(formData.get("tenantId"));
  const confirmation = normalizeText(formData.get("confirmation"));

  if (!tenantId) {
    redirect("/platform?error=Organizacao%20nao%20informada.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
          accounts: true,
          contacts: true,
          activities: true,
          interactions: true,
          opportunities: true,
          imports: true,
        },
      },
    },
  });

  if (!tenant) {
    redirect("/platform?error=Organizacao%20nao%20encontrada.");
  }

  const expectedConfirmation = `EXCLUIR ${tenant.name}`;

  if (confirmation !== expectedConfirmation) {
    redirect(
      `/platform?error=${encodeMessage(
        `Digite exatamente "${expectedConfirmation}" para excluir a organizacao.`,
      )}`,
    );
  }

  const deletedSummary = {
    users: tenant._count.users,
    accounts: tenant._count.accounts,
    contacts: tenant._count.contacts,
    activities: tenant._count.activities,
    interactions: tenant._count.interactions,
    opportunities: tenant._count.opportunities,
    imports: tenant._count.imports,
  };

  await prisma.$transaction(async (tx) => {
    await tx.notification.create({
      data: {
        recipientPlatformAdminId: platformAdmin.id,
        type: "TENANT_DELETED",
        title: "Organização Excluída",
        body: `${tenant.name} foi excluída completamente por ${platformAdmin.name}.`,
        metadata: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          deletedByPlatformAdminId: platformAdmin.id,
          deletedByPlatformAdminName: platformAdmin.name,
          deletedSummary,
        },
      },
    });

    await tx.stageMovement.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.activity.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.interaction.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.attachment.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.aiJob.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.importRow.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.importBatch.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.opportunity.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.contact.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.account.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.teamMember.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.team.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.pipelineStage.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.pipeline.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.notification.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.notification.updateMany({
      where: {
        actorUser: {
          is: {
            tenantId: tenant.id,
          },
        },
      },
      data: {
        actorUserId: null,
      },
    });
    await tx.user.deleteMany({
      where: {
        tenantId: tenant.id,
      },
    });
    await tx.tenant.delete({
      where: {
        id: tenant.id,
      },
    });
  });

  revalidatePath("/platform");
  redirect(
    `/platform?message=${encodeMessage(
      `Organizacao ${tenant.name} excluida completamente.`,
    )}`,
  );
}

export async function markPlatformNotificationsReadAction() {
  const platformAdmin = await requirePlatformAdmin();

  await prisma.notification.updateMany({
    where: {
      recipientPlatformAdminId: platformAdmin.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/platform");
  redirect(`/platform?message=${encodeMessage("Notificações marcadas como lidas.")}`);
}
