"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { undoVisibleActivityCompletion } from "@/lib/activity-completion";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedReturnPaths = ["/agenda", "/dashboard-anterior"];

function getSafeReturnTo(formData: FormData) {
  const requested = String(formData.get("returnTo") ?? "").trim();

  try {
    const url = new URL(requested, "http://xcrm.local");
    const isAllowed =
      allowedReturnPaths.includes(url.pathname) ||
      /^\/accounts\/[0-9a-f-]{36}$/i.test(url.pathname);

    if (!isAllowed || url.origin !== "http://xcrm.local") {
      return "/dashboard-anterior";
    }

    for (const key of ["error", "message", "undoActivityId", "undoUntil"]) {
      url.searchParams.delete(key);
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard-anterior";
  }
}

function withFeedback(returnTo: string, key: "error" | "message", value: string) {
  const url = new URL(returnTo, "http://xcrm.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function undoActivityCompletionAction(formData: FormData) {
  const returnTo = getSafeReturnTo(formData);
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
    redirect(withFeedback(returnTo, "error", "Atividade não informada."));
  }

  const result = await undoVisibleActivityCompletion({
    activityId,
    actor: appUser,
  });

  if (!result.ok) {
    const errorMessage =
      result.reason === "EXPIRED"
        ? "O prazo de 5 minutos para desfazer terminou."
        : result.reason === "ALREADY_PENDING"
          ? "A atividade já está pendente."
          : "Não foi possível desfazer esta conclusão no seu escopo.";
    redirect(withFeedback(returnTo, "error", errorMessage));
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard-anterior");
  revalidatePath("/accounts");

  if (result.accountId) {
    revalidatePath(`/accounts/${result.accountId}`);
  }

  redirect(
    withFeedback(returnTo, "message", `Atividade "${result.title}" reaberta.`),
  );
}
