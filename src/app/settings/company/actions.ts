"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeOptionalUppercase(value: FormDataEntryValue | null) {
  return normalizeOptionalText(value)?.toLocaleUpperCase("pt-BR") ?? null;
}

function normalizeOptionalCnpj(value: FormDataEntryValue | null) {
  const document = normalizeOptionalText(value)
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return document && document.length > 0 ? document : null;
}

function canManageCompanySettings(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

export async function updateCompanySettingsAction(formData: FormData) {
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

  if (!canManageCompanySettings(appUser.role)) {
    redirect(
      `/dashboard?error=${encodeMessage(
        "Você não tem permissão para alterar as Configurações da Empresa.",
      )}`,
    );
  }

  const name = normalizeOptionalUppercase(formData.get("companyName"));
  const legalName = normalizeOptionalUppercase(formData.get("legalName"));
  const document = normalizeOptionalCnpj(formData.get("document"));
  const segment = normalizeOptionalText(formData.get("segment"));
  const plan = normalizeOptionalText(formData.get("plan"));

  if (!name || name.length < 2) {
    redirect(
      `/settings/company?error=${encodeMessage(
        "Informe o Nome da Empresa com pelo menos 2 caracteres.",
      )}`,
    );
  }

  if (document && document.length !== 14) {
    redirect(
      `/settings/company?error=${encodeMessage(
        "CNPJ precisa ter 14 posições entre letras e números.",
      )}`,
    );
  }

  const currentTenant = appUser.tenant;

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: {
        id: appUser.tenantId,
      },
      data: {
        name,
        legalName,
        document,
        segment,
        plan,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Empresa Atualizada",
        body:
          currentTenant.name === name
            ? "Configurações da Empresa foram atualizadas."
            : `Nome da Empresa alterado de ${currentTenant.name} para ${name}.`,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/settings/company");
  redirect(
    `/settings/company?message=${encodeMessage(
      "Configurações da Empresa atualizadas.",
    )}`,
  );
}
