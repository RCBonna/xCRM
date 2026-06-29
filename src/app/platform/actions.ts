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
