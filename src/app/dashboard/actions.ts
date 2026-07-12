"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActivityVisibilityWhere } from "@/lib/visibility";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function completeDashboardActivityAction(formData: FormData) {
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

  const activityId = String(formData.get("activityId") ?? "").trim();

  if (!activityId) {
    redirect("/dashboard?error=Atividade%20nao%20informada.");
  }

  const activityVisibilityWhere = await getActivityVisibilityWhere(appUser);

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      tenantId: appUser.tenantId,
      status: "PENDING",
      ...activityVisibilityWhere,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!activity) {
    redirect(
      `/dashboard?error=${encodeMessage("Atividade pendente não encontrada.")}`,
    );
  }

  await prisma.activity.update({
    where: {
      id: activity.id,
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  redirect(
    `/dashboard?message=${encodeMessage(`Atividade "${activity.title}" concluída.`)}`,
  );
}
