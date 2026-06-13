"use server";

import { redirect } from "next/navigation";

import { getDefaultRedirectPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const defaultStages = [
  "Visitantes",
  "Contatos",
  "Qualificacao",
  "Oportunidades",
  "Proposta",
  "Negociacao",
  "Clientes",
  "Perdidos",
];

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirect(
      `/login?error=${encodeMessage(
        "A senha deve ter no minimo 8 caracteres.",
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(`/login?error=${encodeMessage("E-mail ou senha invalidos.")}`);
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
        "A senha deve ter no minimo 8 caracteres.",
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeMessage(error.message)}`);
  }

  if (!data.session || !data.user) {
    redirect(
      `/login?message=${encodeMessage(
        "Cadastro criado. Verifique seu e-mail antes de entrar.",
      )}`,
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
        "Informe o nome da empresa e seu nome.",
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
        name: "Funil comercial padrao",
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
        title: "Revisar configuracoes iniciais do xCRM",
        description:
          "Primeira tarefa criada automaticamente para concluir o onboarding da empresa.",
      },
    });
  });

  redirect("/dashboard");
}
