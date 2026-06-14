"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { isBrazilianStateCode } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseOptionalDateTime(value: FormDataEntryValue | null) {
  const text = normalizeOptionalText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const text = normalizeOptionalText(value);

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeOptionalMoney(value: FormDataEntryValue | null) {
  const text = normalizeOptionalText(value)?.replace(",", ".");

  if (!text) {
    return null;
  }

  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
}

function canManageTenantAccounts(role: string) {
  return ["OWNER", "ADMIN", "MANAGER"].includes(role);
}

async function getVisibleAccount(
  accountId: string,
  appUser: Awaited<ReturnType<typeof getAppUser>>,
) {
  if (!appUser) {
    return null;
  }

  return prisma.account.findFirst({
    where: {
      id: accountId,
      tenantId: appUser.tenantId,
      ...(canManageTenantAccounts(appUser.role) ? {} : { ownerUserId: appUser.id }),
    },
    select: {
      id: true,
      name: true,
    },
  });
}

function isChecked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function createAccountAction(formData: FormData) {
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

  const accountName = String(formData.get("accountName") ?? "").trim();
  const city = normalizeOptionalText(formData.get("city"));
  const state = normalizeOptionalText(formData.get("state"))?.toUpperCase();
  const website = normalizeOptionalText(formData.get("website"));
  const mainSupplier = normalizeOptionalText(formData.get("mainSupplier"));
  const source = normalizeOptionalText(formData.get("source"));
  const contactName = normalizeOptionalText(formData.get("contactName"));
  const contactEmail = normalizeOptionalText(formData.get("contactEmail"));
  const contactPhone = normalizeOptionalText(formData.get("contactPhone"));
  const nextActionTitle = normalizeOptionalText(formData.get("nextActionTitle"));
  const nextActionScheduledAt = parseOptionalDateTime(
    formData.get("nextActionScheduledAt"),
  );

  if (accountName.length < 2) {
    redirect(
      `/accounts?error=${encodeMessage(
        "Informe o nome da Empresa/Prospect.",
      )}`,
    );
  }

  if (state && !isBrazilianStateCode(state)) {
    redirect(`/accounts?error=${encodeMessage("Selecione uma UF válida.")}`);
  }

  if (contactPhone && contactPhone.length > 15) {
    redirect(
      `/accounts?error=${encodeMessage(
        "Telefone deve ter no máximo 15 caracteres.",
      )}`,
    );
  }

  const existingAccount = await prisma.account.findFirst({
    where: {
      tenantId: appUser.tenantId,
      name: {
        equals: accountName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingAccount) {
    redirect(
      `/accounts?error=${encodeMessage(
        "Esta Empresa/Prospect já existe neste tenant.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        tenantId: appUser.tenantId,
        ownerUserId: appUser.id,
        name: accountName,
        city,
        state,
        website,
        mainSupplier,
        source,
      },
    });

    let contactId: string | null = null;

    if (contactName) {
      const contact = await tx.contact.create({
        data: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          ownerUserId: appUser.id,
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          isPrimary: true,
        },
      });
      contactId = contact.id;
    }

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Prospect Criado",
        body: contactName
          ? `Cadastro Inicial criado com Contato Principal: ${contactName}.`
          : "Cadastro Inicial criado sem Contato Principal.",
      },
    });

    if (nextActionTitle || nextActionScheduledAt) {
      await tx.activity.create({
        data: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          contactId,
          ownerUserId: appUser.id,
          type: "FOLLOW_UP",
          title: nextActionTitle ?? "Retornar contato",
          scheduledAt: nextActionScheduledAt,
        },
      });
    }
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect(`/accounts?message=${encodeMessage("Empresa/Prospect cadastrada.")}`);
}

export async function updateAccountAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const city = normalizeOptionalText(formData.get("city"));
  const state = normalizeOptionalText(formData.get("state"))?.toUpperCase();
  const website = normalizeOptionalText(formData.get("website"));
  const mainSupplier = normalizeOptionalText(formData.get("mainSupplier"));
  const source = normalizeOptionalText(formData.get("source"));
  const notes = normalizeOptionalText(formData.get("notes"));

  if (!accountId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (accountName.length < 2) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe o nome da Empresa/Prospect.",
      )}`,
    );
  }

  if (state && !isBrazilianStateCode(state)) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage("Selecione uma UF válida.")}`,
    );
  }

  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      tenantId: appUser.tenantId,
      ...(canManageTenantAccounts(appUser.role) ? {} : { ownerUserId: appUser.id }),
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const existingAccount = await prisma.account.findFirst({
    where: {
      tenantId: appUser.tenantId,
      id: {
        not: account.id,
      },
      name: {
        equals: accountName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingAccount) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Esta Empresa/Prospect já existe neste tenant.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: {
        id: account.id,
      },
      data: {
        name: accountName,
        city,
        state,
        website,
        mainSupplier,
        source,
        notes,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Dados Atualizados",
        body:
          account.name === accountName
            ? "Dados Básicos da Empresa/Prospect foram atualizados."
            : `Nome alterado de ${account.name} para ${accountName}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage(
      "Empresa/Prospect atualizada.",
    )}`,
  );
}

export async function createAccountActivityAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const title = normalizeOptionalText(formData.get("nextActionTitle"));
  const scheduledAt = parseOptionalDateTime(formData.get("nextActionScheduledAt"));

  if (!accountId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (!title) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe a descrição da Próxima Ação.",
      )}`,
    );
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        ownerUserId: appUser.id,
        type: "FOLLOW_UP",
        title,
        scheduledAt,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Criada",
        body: `Próxima Ação registrada: ${title}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Próxima Ação registrada.")}`,
  );
}

export async function completeAccountActivityAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const activityId = String(formData.get("activityId") ?? "").trim();

  if (!accountId || !activityId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      accountId: account.id,
      tenantId: appUser.tenantId,
      status: "PENDING",
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!activity) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Ação pendente não encontrada.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: {
        id: activity.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Concluída",
        body: `Ação concluída: ${activity.title}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Ação concluída.")}`,
  );
}

export async function createAccountContactAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const name = String(formData.get("contactName") ?? "").trim();
  const title = normalizeOptionalText(formData.get("contactTitle"));
  const email = normalizeOptionalText(formData.get("contactEmail"));
  const phone = normalizeOptionalText(formData.get("contactPhone"));
  const shouldMarkPrimary = isChecked(formData.get("isPrimary"));

  if (!accountId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (name.length < 2) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe o nome do Contato.",
      )}`,
    );
  }

  if (phone && phone.length > 15) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Telefone deve ter no máximo 15 caracteres.",
      )}`,
    );
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const contactCount = await prisma.contact.count({
    where: {
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
  });
  const isPrimary = shouldMarkPrimary || contactCount === 0;

  await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.contact.updateMany({
        where: {
          tenantId: appUser.tenantId,
          accountId: account.id,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const contact = await tx.contact.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        ownerUserId: appUser.id,
        name,
        title,
        email,
        phone,
        isPrimary,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: contact.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Contato Criado",
        body: isPrimary
          ? `Contato Principal criado: ${name}.`
          : `Contato criado: ${name}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(`/accounts/${account.id}?message=${encodeMessage("Contato criado.")}`);
}

export async function updateAccountContactAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "").trim();
  const name = String(formData.get("contactName") ?? "").trim();
  const title = normalizeOptionalText(formData.get("contactTitle"));
  const email = normalizeOptionalText(formData.get("contactEmail"));
  const phone = normalizeOptionalText(formData.get("contactPhone"));

  if (!accountId || !contactId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (name.length < 2) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe o nome do Contato.",
      )}`,
    );
  }

  if (phone && phone.length > 15) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Telefone deve ter no máximo 15 caracteres.",
      )}`,
    );
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!contact) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage("Contato não encontrado.")}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        name,
        title,
        email,
        phone,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: contact.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Contato Atualizado",
        body:
          contact.name === name
            ? `Contato atualizado: ${name}.`
            : `Contato alterado de ${contact.name} para ${name}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Contato atualizado.")}`,
  );
}

export async function setPrimaryAccountContactAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "").trim();

  if (!accountId || !contactId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
    select: {
      id: true,
      name: true,
      isPrimary: true,
    },
  });

  if (!contact) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage("Contato não encontrado.")}`,
    );
  }

  if (contact.isPrimary) {
    redirect(
      `/accounts/${account.id}?message=${encodeMessage(
        "Este já é o Contato Principal.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.contact.updateMany({
      where: {
        tenantId: appUser.tenantId,
        accountId: account.id,
      },
      data: {
        isPrimary: false,
      },
    });

    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        isPrimary: true,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: contact.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Contato Principal Alterado",
        body: `Contato Principal alterado para ${contact.name}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage(
      "Contato Principal alterado.",
    )}`,
  );
}

export async function deleteAccountContactAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "").trim();

  if (!accountId || !contactId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
    select: {
      id: true,
      name: true,
      isPrimary: true,
    },
  });

  if (!contact) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage("Contato não encontrado.")}`,
    );
  }

  const contactCount = await prisma.contact.count({
    where: {
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
  });

  if (contactCount <= 1) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Não é possível excluir o único contato da Empresa/Prospect.",
      )}`,
    );
  }

  if (contact.isPrimary) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Escolha outro Contato Principal antes de excluir este contato.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.updateMany({
      where: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: contact.id,
      },
      data: {
        contactId: null,
      },
    });

    await tx.interaction.updateMany({
      where: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: contact.id,
      },
      data: {
        contactId: null,
      },
    });

    await tx.contact.delete({
      where: {
        id: contact.id,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Contato Excluído",
        body: `Contato excluído: ${contact.name}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(`/accounts/${account.id}?message=${encodeMessage("Contato excluído.")}`);
}

export async function createAccountOpportunityAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const title = String(formData.get("opportunityTitle") ?? "").trim();
  const contactId = normalizeOptionalText(formData.get("contactId"));
  const stageId = String(formData.get("stageId") ?? "").trim();
  const amountEstimated = normalizeOptionalMoney(formData.get("amountEstimated"));
  const expectedCloseDate = parseOptionalDate(formData.get("expectedCloseDate"));

  if (!accountId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (title.length < 2) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe o título da Oportunidade.",
      )}`,
    );
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const stage = await prisma.pipelineStage.findFirst({
    where: {
      id: stageId,
      tenantId: appUser.tenantId,
      pipeline: {
        tenantId: appUser.tenantId,
        isDefault: true,
      },
    },
    select: {
      id: true,
      name: true,
      pipelineId: true,
      isWon: true,
      isLost: true,
    },
  });

  if (!stage) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Selecione uma etapa válida do Funil.",
      )}`,
    );
  }

  let validatedContactId: string | null = null;

  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: appUser.tenantId,
        accountId: account.id,
      },
      select: {
        id: true,
      },
    });

    if (!contact) {
      redirect(
        `/accounts/${account.id}?error=${encodeMessage(
          "Contato da Oportunidade não encontrado.",
        )}`,
      );
    }

    validatedContactId = contact.id;
  }

  await prisma.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: validatedContactId,
        ownerUserId: appUser.id,
        pipelineId: stage.pipelineId,
        stageId: stage.id,
        title,
        amountEstimated,
        expectedCloseDate,
        status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
      },
    });

    await tx.stageMovement.create({
      data: {
        tenantId: appUser.tenantId,
        opportunityId: opportunity.id,
        toStageId: stage.id,
        changedByUserId: appUser.id,
        note: "Oportunidade criada.",
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: validatedContactId,
        opportunityId: opportunity.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Oportunidade Criada",
        body: `Oportunidade criada em ${stage.name}: ${title}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Oportunidade criada.")}`,
  );
}

export async function moveAccountOpportunityStageAction(formData: FormData) {
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

  const accountId = String(formData.get("accountId") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const stageId = String(formData.get("stageId") ?? "").trim();

  if (!accountId || !opportunityId || !stageId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const account = await getVisibleAccount(accountId, appUser);

  if (!account) {
    redirect("/accounts?error=Empresa%2FProspect%20nao%20encontrada.");
  }

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      tenantId: appUser.tenantId,
      accountId: account.id,
    },
    include: {
      stage: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!opportunity) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Oportunidade não encontrada.",
      )}`,
    );
  }

  const nextStage = await prisma.pipelineStage.findFirst({
    where: {
      id: stageId,
      tenantId: appUser.tenantId,
      pipelineId: opportunity.pipelineId,
    },
    select: {
      id: true,
      name: true,
      isWon: true,
      isLost: true,
    },
  });

  if (!nextStage) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Selecione uma etapa válida do Funil.",
      )}`,
    );
  }

  if (nextStage.id === opportunity.stageId) {
    redirect(
      `/accounts/${account.id}?message=${encodeMessage(
        "A Oportunidade já está nesta etapa.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.opportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        stageId: nextStage.id,
        status: nextStage.isWon ? "WON" : nextStage.isLost ? "LOST" : "OPEN",
      },
    });

    await tx.stageMovement.create({
      data: {
        tenantId: appUser.tenantId,
        opportunityId: opportunity.id,
        fromStageId: opportunity.stageId,
        toStageId: nextStage.id,
        changedByUserId: appUser.id,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        contactId: opportunity.contactId,
        opportunityId: opportunity.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Oportunidade Movida",
        body: `Oportunidade ${opportunity.title} movida de ${opportunity.stage.name} para ${nextStage.name}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Oportunidade movida.")}`,
  );
}
