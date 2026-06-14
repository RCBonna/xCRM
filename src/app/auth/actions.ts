"use server";

import { redirect } from "next/navigation";

import { getDefaultRedirectPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const defaultStages = [
  "Visitantes",
  "Contatos",
  "Qualificação",
  "Oportunidades",
  "Proposta",
  "Negociação",
  "Clientes",
  "Perdidos",
];

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function getAuthConnectionErrorMessage() {
  return "Não foi possível conectar ao serviço de autenticação. Tente novamente em instantes.";
}

function getAuthErrorMessage(error?: { message?: string; code?: string } | null) {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  const normalizedMessage = message.toLowerCase();

  if (code === "email_not_confirmed" || normalizedMessage.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam antes de entrar.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    normalizedMessage.includes("email rate limit")
  ) {
    return "O serviço de autenticação atingiu o limite de envio de e-mails. Aguarde alguns minutos e tente novamente.";
  }

  if (
    code === "email_address_invalid" ||
    normalizedMessage.includes("email address") ||
    normalizedMessage.includes("invalid email")
  ) {
    return "Informe um e-mail válido para criar o acesso.";
  }

  if (code === "invalid_credentials") {
    return "E-mail ou senha inválidos.";
  }

  return message || "Não foi possível concluir a autenticação. Tente novamente.";
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirect(
      `/login?error=${encodeMessage(
        "A senha deve ter no mínimo 8 caracteres.",
      )}&tab=sign-in`,
    );
  }

  const supabase = await createSupabaseServerClient();
  let authResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

  try {
    authResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  } catch {
    redirect(
      `/login?error=${encodeMessage(getAuthConnectionErrorMessage())}&tab=sign-in`,
    );
  }

  const { data, error } = authResult;

  if (error || !data.user) {
    redirect(
      `/login?error=${encodeMessage(getAuthErrorMessage(error))}&tab=sign-in`,
    );
  }

  redirect(await getDefaultRedirectPath(data.user));
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (password.length < 8) {
    redirect(
      `/login?error=${encodeMessage(
        "A senha deve ter no mínimo 8 caracteres.",
      )}&tab=sign-up`,
    );
  }

  const existingAppUser = await prisma.user.findFirst({
    where: {
      email,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (existingAppUser) {
    redirect(
      `/login?message=${encodeMessage(
        "Este e-mail já possui acesso. Entre com sua senha para continuar.",
      )}&tab=sign-in`,
    );
  }

  const supabase = await createSupabaseServerClient();
  let authResult: Awaited<ReturnType<typeof supabase.auth.signUp>>;

  try {
    authResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
  } catch {
    redirect(
      `/login?error=${encodeMessage(getAuthConnectionErrorMessage())}&tab=sign-up`,
    );
  }

  const { data, error } = authResult;

  if (error) {
    redirect(
      `/login?error=${encodeMessage(getAuthErrorMessage(error))}&tab=sign-up`,
    );
  }

  if (data.user && data.user.identities?.length === 0) {
    redirect(
      `/login?message=${encodeMessage(
        "Este e-mail já possui acesso. Entre com sua senha para continuar.",
      )}&tab=sign-in`,
    );
  }

  if (!data.session || !data.user) {
    redirect(
      `/login?message=${encodeMessage(
        "Cadastro criado. Verifique seu e-mail antes de entrar.",
      )}&tab=sign-in`,
    );
  }

  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTenantAction(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const userName = String(formData.get("userName") ?? "").trim();

  if (companyName.length < 2 || userName.length < 2) {
    redirect(
      `/onboarding?error=${encodeMessage(
        "Informe o Nome da Empresa e Seu Nome.",
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      authUserId: user.id,
      status: "ACTIVE",
    },
  });

  if (existingUser) {
    redirect("/dashboard");
  }

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        plan: "trial",
      },
    });

    const owner = await tx.user.create({
      data: {
        tenantId: tenant.id,
        authUserId: user.id,
        name: userName,
        email: user.email!.toLowerCase(),
        role: "OWNER",
      },
    });

    const pipeline = await tx.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: "Funil Comercial Padrão",
        isDefault: true,
      },
    });

    await tx.pipelineStage.createMany({
      data: defaultStages.map((stageName, index) => ({
        tenantId: tenant.id,
        pipelineId: pipeline.id,
        name: stageName,
        position: index + 1,
        isWon: stageName === "Clientes",
        isLost: stageName === "Perdidos",
      })),
    });

    await tx.activity.create({
      data: {
        tenantId: tenant.id,
        ownerUserId: owner.id,
        type: "INTERNAL_TASK",
        title: "Revisar configurações iniciais do xCRM",
        description:
          "Primeira tarefa criada automaticamente para concluir o onboarding da empresa.",
      },
    });
  });

  redirect("/dashboard");
}
