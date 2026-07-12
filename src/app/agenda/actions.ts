"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActivityVisibilityWhere } from "@/lib/visibility";

const activityTypes = new Set([
  "CALL",
  "WHATSAPP",
  "EMAIL",
  "VISIT",
  "MEETING",
  "TASK",
  "FOLLOW_UP",
  "INTERNAL_TASK",
]);

function getReturnTo(formData: FormData) {
  const value = String(formData.get("returnTo") ?? "");
  return value.startsWith("/agenda") ? value : "/agenda";
}

function withFeedback(returnTo: string, key: "error" | "message", value: string) {
  return `${returnTo}${returnTo.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function parseOptionalDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getAuthenticatedAppUser() {
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

  return appUser;
}

async function findVisibleActivity(activityId: string, appUser: Awaited<ReturnType<typeof getAppUser>>) {
  if (!appUser) {
    return null;
  }

  return prisma.activity.findFirst({
    where: {
      id: activityId,
      tenantId: appUser.tenantId,
      ...(await getActivityVisibilityWhere(appUser)),
    },
    select: {
      id: true,
      accountId: true,
      title: true,
      status: true,
    },
  });
}

export async function updateAgendaActivityAction(formData: FormData) {
  const returnTo = getReturnTo(formData);
  const appUser = await getAuthenticatedAppUser();
  const activityId = String(formData.get("activityId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 2);
  const scheduledAt = parseOptionalDateTime(formData.get("scheduledAt"));

  if (!activityId || title.length < 2 || !activityTypes.has(type) || ![1, 2, 3].includes(priority)) {
    redirect(withFeedback(returnTo, "error", "Revise os dados da atividade antes de salvar."));
  }

  const activity = await findVisibleActivity(activityId, appUser);

  if (!activity) {
    redirect(withFeedback(returnTo, "error", "Atividade não encontrada no seu escopo."));
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activity.id },
      data: {
        title,
        description,
        type: type as never,
        priority,
        scheduledAt,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: activity.accountId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Atualizada",
        body: `Atividade atualizada na Agenda: ${title}.`,
      },
    });
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  redirect(withFeedback(returnTo, "message", "Atividade atualizada."));
}

export async function completeAgendaActivityAction(formData: FormData) {
  const returnTo = getReturnTo(formData);
  const appUser = await getAuthenticatedAppUser();
  const activityId = String(formData.get("activityId") ?? "").trim();

  if (!activityId) {
    redirect(withFeedback(returnTo, "error", "Atividade não informada."));
  }

  const activity = await findVisibleActivity(activityId, appUser);

  if (!activity || activity.status !== "PENDING") {
    redirect(withFeedback(returnTo, "error", "Atividade pendente não encontrada no seu escopo."));
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activity.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: activity.accountId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Concluída",
        body: `Atividade concluída pela Agenda: ${activity.title}.`,
      },
    });
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  redirect(withFeedback(returnTo, "message", "Atividade concluída."));
}
