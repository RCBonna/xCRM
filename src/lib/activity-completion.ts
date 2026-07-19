import "server-only";

import { prisma } from "@/lib/prisma";
import { getActivityVisibilityWhere } from "@/lib/visibility";

export const ACTIVITY_UNDO_WINDOW_MS = 5 * 60 * 1000;

type ActivityActor = {
  id: string;
  role: string;
  tenantId: string;
};

type CompletionSource = "Agenda" | "Dashboard Anterior" | "Empresa/Prospect";

export type ActivityOperationResult =
  | {
      ok: true;
      activityId: string;
      accountId: string | null;
      title: string;
      completedAt: Date;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "NOT_PENDING" | "ALREADY_PENDING" | "EXPIRED";
    };

export async function completeVisibleActivity({
  activityId,
  actor,
  source,
  accountId,
}: {
  activityId: string;
  actor: ActivityActor;
  source: CompletionSource;
  accountId?: string;
}): Promise<ActivityOperationResult> {
  const visibilityWhere = await getActivityVisibilityWhere(actor);
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tenantId: actor.tenantId,
      ...(accountId ? { accountId } : {}),
      ...visibilityWhere,
    },
    select: {
      id: true,
      accountId: true,
      title: true,
      status: true,
    },
  });

  if (!activity) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (activity.status !== "PENDING") {
    return { ok: false, reason: "NOT_PENDING" };
  }

  const completedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.activity.updateMany({
      where: {
        id: activity.id,
        tenantId: actor.tenantId,
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        completedAt,
      },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.interaction.create({
      data: {
        tenantId: actor.tenantId,
        accountId: activity.accountId,
        userId: actor.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Concluída",
        body: `Atividade concluída em ${source}: ${activity.title}.`,
      },
    });

    return true;
  });

  if (!updated) {
    return { ok: false, reason: "NOT_PENDING" };
  }

  return {
    ok: true,
    activityId: activity.id,
    accountId: activity.accountId,
    title: activity.title,
    completedAt,
  };
}

export async function undoVisibleActivityCompletion({
  activityId,
  actor,
  now = new Date(),
}: {
  activityId: string;
  actor: ActivityActor;
  now?: Date;
}): Promise<ActivityOperationResult> {
  const visibilityWhere = await getActivityVisibilityWhere(actor);
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tenantId: actor.tenantId,
      ...visibilityWhere,
    },
    select: {
      id: true,
      accountId: true,
      title: true,
      status: true,
      completedAt: true,
    },
  });

  if (!activity) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (activity.status === "PENDING") {
    return { ok: false, reason: "ALREADY_PENDING" };
  }

  if (
    activity.status !== "COMPLETED" ||
    !activity.completedAt ||
    now.getTime() - activity.completedAt.getTime() > ACTIVITY_UNDO_WINDOW_MS
  ) {
    return { ok: false, reason: "EXPIRED" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.activity.updateMany({
      where: {
        id: activity.id,
        tenantId: actor.tenantId,
        status: "COMPLETED",
        completedAt: activity.completedAt,
      },
      data: {
        status: "PENDING",
        completedAt: null,
      },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.interaction.create({
      data: {
        tenantId: actor.tenantId,
        accountId: activity.accountId,
        userId: actor.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Reaberta",
        body: `Conclusão desfeita: ${activity.title}.`,
      },
    });

    return true;
  });

  if (!updated) {
    return { ok: false, reason: "ALREADY_PENDING" };
  }

  return {
    ok: true,
    activityId: activity.id,
    accountId: activity.accountId,
    title: activity.title,
    completedAt: activity.completedAt,
  };
}
