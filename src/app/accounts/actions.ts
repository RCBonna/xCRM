"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  AccountStatus,
  OpportunityStatus,
  Prisma,
} from "@/generated/prisma/client";
import { getAppUser } from "@/lib/auth";
import {
  ACTIVITY_UNDO_WINDOW_MS,
  completeVisibleActivity,
} from "@/lib/activity-completion";
import { isBrazilianStateCode } from "@/lib/brazilian-states";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAccountVisibilityWhere,
  getActivityVisibilityWhere,
} from "@/lib/visibility";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function getCreateAccountRedirect(
  formData: FormData,
  feedbackType: "error" | "message",
  feedback: string,
) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const params = new URLSearchParams();

  if (returnTo) {
    try {
      const returnUrl = new URL(returnTo, "http://xcrm.local");

      if (returnUrl.pathname === "/accounts") {
        for (const name of ["q", "status", "pipeline", "period"]) {
          const value = returnUrl.searchParams.get(name);

          if (value && value.length <= 200) {
            params.set(name, value);
          }
        }
      }
    } catch {
      // A rota segura abaixo é usada quando o retorno informado é inválido.
    }
  }

  params.set("tab", "new");
  params.set(feedbackType, feedback);
  return `/accounts?${params.toString()}`;
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

function normalizeOptionalCep(value: FormDataEntryValue | null) {
  const postalCode = normalizeOptionalText(value)?.replace(/\D/g, "");

  return postalCode && postalCode.length > 0 ? postalCode : null;
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
  const text = normalizeOptionalText(value)?.replace(/[^\d,.-]/g, "");

  if (!text) {
    return null;
  }

  const normalizedAmount = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.split(".").length > 2
      ? text.replace(/\./g, "")
      : text;
  const amount = Number(normalizedAmount);

  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
}

const accountStatusLabels: Record<AccountStatus, string> = {
  PROSPECT: "Prospect",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
  ARCHIVED: "Arquivado",
};

function getOpportunityStatusFromStage(stage: {
  isWon: boolean;
  isLost: boolean;
}): OpportunityStatus {
  if (stage.isWon) {
    return "WON";
  }

  if (stage.isLost) {
    return "LOST";
  }

  return "OPEN";
}

async function syncAccountStatusFromOpportunities({
  tx,
  tenantId,
  accountId,
  currentStatus,
  userId,
  opportunityId,
}: {
  tx: Prisma.TransactionClient;
  tenantId: string;
  accountId: string;
  currentStatus: AccountStatus;
  userId: string;
  opportunityId?: string;
}) {
  if (currentStatus === "ARCHIVED") {
    return;
  }

  const opportunityStatusCounts = await tx.opportunity.groupBy({
    by: ["status"],
    where: {
      tenantId,
      accountId,
      status: {
        in: ["OPEN", "WON", "LOST"],
      },
    },
    _count: {
      _all: true,
    },
  });

  const hasWonOpportunity = opportunityStatusCounts.some(
    (item) => item.status === "WON" && item._count._all > 0,
  );
  const hasOpenOpportunity = opportunityStatusCounts.some(
    (item) => item.status === "OPEN" && item._count._all > 0,
  );
  const hasLostOpportunity = opportunityStatusCounts.some(
    (item) => item.status === "LOST" && item._count._all > 0,
  );

  const nextStatus: AccountStatus = hasWonOpportunity
    ? "CUSTOMER"
    : hasOpenOpportunity
      ? "PROSPECT"
      : hasLostOpportunity
        ? "LOST"
        : "PROSPECT";

  if (nextStatus === currentStatus) {
    return;
  }

  await tx.account.update({
    where: {
      id: accountId,
    },
    data: {
      status: nextStatus,
    },
  });

  await tx.interaction.create({
    data: {
      tenantId,
      accountId,
      opportunityId,
      userId,
      channel: "MANUAL_NOTE",
      direction: "INTERNAL",
      summary: "Status Alterado",
      body: `Status da Empresa/Prospect alterado de ${accountStatusLabels[currentStatus]} para ${accountStatusLabels[nextStatus]}.`,
    },
  });
}

async function getVisibleAccount(
  accountId: string,
  appUser: Awaited<ReturnType<typeof getAppUser>>,
) {
  if (!appUser) {
    return null;
  }

  const visibilityWhere = await getAccountVisibilityWhere(appUser);

  return prisma.account.findFirst({
    where: {
      id: accountId,
      tenantId: appUser.tenantId,
      ...visibilityWhere,
    },
    select: {
      id: true,
      name: true,
      status: true,
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

  const accountName = String(formData.get("accountName") ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");
  const city = normalizeOptionalText(formData.get("city"));
  const state = normalizeOptionalText(formData.get("state"))?.toUpperCase();
  const website = normalizeOptionalText(formData.get("website"));
  const mainSupplier = normalizeOptionalText(formData.get("mainSupplier"));
  const source = normalizeOptionalText(formData.get("source"));
  const contactName = normalizeOptionalText(formData.get("contactName"));
  const contactTitle = normalizeOptionalText(formData.get("contactTitle"));
  const contactEmail = normalizeOptionalText(formData.get("contactEmail"));
  const contactPhone = normalizeOptionalText(formData.get("contactPhone"));
  const nextActionTitle = normalizeOptionalText(formData.get("nextActionTitle"));
  const nextActionScheduledAt = parseOptionalDateTime(
    formData.get("nextActionScheduledAt"),
  );

  if (accountName.length < 2) {
    redirect(
      getCreateAccountRedirect(
        formData,
        "error",
        "Informe o nome da Empresa/Prospect.",
      ),
    );
  }

  if (state && !isBrazilianStateCode(state)) {
    redirect(
      getCreateAccountRedirect(
        formData,
        "error",
        "Selecione uma UF válida.",
      ),
    );
  }

  if (contactPhone && contactPhone.length > 15) {
    redirect(
      getCreateAccountRedirect(
        formData,
        "error",
        "Telefone deve ter no máximo 15 caracteres.",
      ),
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
      getCreateAccountRedirect(
        formData,
        "error",
        "Esta Empresa/Prospect já existe neste tenant.",
      ),
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
          title: contactTitle,
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
  redirect(
    getCreateAccountRedirect(
      formData,
      "message",
      "Empresa/Prospect cadastrada.",
    ),
  );
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
  const accountName = String(formData.get("accountName") ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");
  const legalName = normalizeOptionalUppercase(formData.get("legalName"));
  const document = normalizeOptionalCnpj(formData.get("document"));
  const postalCode = normalizeOptionalCep(formData.get("postalCode"));
  const address = normalizeOptionalText(formData.get("address"));
  const addressNumber = normalizeOptionalText(formData.get("addressNumber"));
  const addressComplement = normalizeOptionalText(
    formData.get("addressComplement"),
  );
  const district = normalizeOptionalText(formData.get("district"));
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

  if (document && document.length !== 14) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe um CNPJ com 14 posições.",
      )}`,
    );
  }

  if (document && !/^[A-Z0-9]{12}\d{2}$/.test(document)) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "O CNPJ deve ter letras ou números nas 12 primeiras posições e números nas 2 últimas.",
      )}`,
    );
  }

  if (postalCode && postalCode.length !== 8) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe um CEP com 8 dígitos.",
      )}`,
    );
  }

  if (state && !isBrazilianStateCode(state)) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage("Selecione uma UF válida.")}`,
    );
  }

  const visibilityWhere = await getAccountVisibilityWhere(appUser);
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      tenantId: appUser.tenantId,
      ...visibilityWhere,
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
        legalName,
        document,
        postalCode,
        address,
        addressNumber,
        addressComplement,
        district,
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

export async function updateAccountActivityAction(formData: FormData) {
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
  const title = normalizeOptionalText(formData.get("activityTitle"));
  const scheduledAt = parseOptionalDateTime(formData.get("activityScheduledAt"));

  if (!accountId || !activityId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  if (!title) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Informe a descrição da Ação Pendente.",
      )}`,
    );
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
      ...(await getActivityVisibilityWhere(appUser)),
    },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
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
        summary: "Ação Atualizada",
        body:
          activity.title === title
            ? `Data e Hora da Ação Pendente foram atualizadas: ${title}.`
            : `Ação Pendente alterada de ${activity.title} para ${title}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Ação atualizada.")}`,
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

  const result = await completeVisibleActivity({
    activityId,
    actor: appUser,
    source: "Empresa/Prospect",
    accountId: account.id,
  });

  if (!result.ok) {
    redirect(
      `/accounts/${account.id}?error=${encodeMessage(
        "Ação pendente não encontrada.",
      )}`,
    );
  }

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard-anterior");
  revalidatePath("/agenda");

  const params = new URLSearchParams({
    message: `Atividade "${result.title}" concluída.`,
    undoActivityId: result.activityId,
    undoUntil: String(result.completedAt.getTime() + ACTIVITY_UNDO_WINDOW_MS),
  });
  redirect(`/accounts/${account.id}?${params.toString()}`);
}

export async function deleteAccountActivityAction(formData: FormData) {
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
      ...(await getActivityVisibilityWhere(appUser)),
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
    await tx.activity.delete({
      where: {
        id: activity.id,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Ação Excluída",
        body: `Ação pendente excluída: ${activity.title}.`,
      },
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Ação excluída.")}`,
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
    const opportunityStatus = getOpportunityStatusFromStage(stage);
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
        status: opportunityStatus,
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

    await syncAccountStatusFromOpportunities({
      tx,
      tenantId: appUser.tenantId,
      accountId: account.id,
      currentStatus: account.status,
      userId: appUser.id,
      opportunityId: opportunity.id,
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
    const opportunityStatus = getOpportunityStatusFromStage(nextStage);

    await tx.opportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        stageId: nextStage.id,
        status: opportunityStatus,
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

    await syncAccountStatusFromOpportunities({
      tx,
      tenantId: appUser.tenantId,
      accountId: account.id,
      currentStatus: account.status,
      userId: appUser.id,
      opportunityId: opportunity.id,
    });
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${account.id}`);
  revalidatePath("/dashboard");
  redirect(
    `/accounts/${account.id}?message=${encodeMessage("Oportunidade movida.")}`,
  );
}
