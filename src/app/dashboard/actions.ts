"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import {
  ACTIVITY_UNDO_WINDOW_MS,
  completeVisibleActivity,
} from "@/lib/activity-completion";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    redirect("/dashboard-anterior?error=Atividade%20nao%20informada.");
  }

  const result = await completeVisibleActivity({
    activityId,
    actor: appUser,
    source: "Dashboard Anterior",
  });

  if (!result.ok) {
    redirect(
      `/dashboard-anterior?error=${encodeMessage("Atividade pendente não encontrada.")}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard-anterior");
  revalidatePath("/accounts");

  if (result.accountId) {
    revalidatePath(`/accounts/${result.accountId}`);
  }

  const params = new URLSearchParams({
    message: `Atividade "${result.title}" concluída.`,
    undoActivityId: result.activityId,
    undoUntil: String(result.completedAt.getTime() + ACTIVITY_UNDO_WINDOW_MS),
  });
  redirect(`/dashboard-anterior?${params.toString()}`);
}
