"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatProposalNumber } from "@/lib/proposals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpportunityVisibilityWhere } from "@/lib/visibility";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const text = normalizeOptionalText(value);

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDecimal(value: FormDataEntryValue | null, fallback = 0) {
  const text = String(value ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (!text) {
    return fallback;
  }

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.split(".").length > 2
      ? text.replace(/\./g, "")
      : text;
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : fallback;
}

function parseQuantity(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!/^\d+(?:[,.]\d+)?$/.test(text)) {
    return 0;
  }

  return parseDecimal(text);
}

function money(value: number) {
  return value.toFixed(2);
}

function quantity(value: number) {
  return value.toFixed(3);
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

async function getVisibleOpportunity(
  opportunityId: string,
  appUser: Awaited<ReturnType<typeof getAuthenticatedAppUser>>,
) {
  const opportunityVisibilityWhere = await getOpportunityVisibilityWhere(appUser);

  return prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      tenantId: appUser.tenantId,
      ...opportunityVisibilityWhere,
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function createProposalAction(formData: FormData) {
  const appUser = await getAuthenticatedAppUser();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const contactId = normalizeOptionalText(formData.get("contactId"));
  const validUntil = parseOptionalDate(formData.get("validUntil"));
  const introduction = normalizeOptionalText(formData.get("introduction"));
  const paymentTerms = normalizeOptionalText(formData.get("paymentTerms"));
  const commercialTerms = normalizeOptionalText(formData.get("commercialTerms"));
  const notes = normalizeOptionalText(formData.get("notes"));
  const proposalDiscount = Math.max(0, parseDecimal(formData.get("discount")));
  const freight = Math.max(0, parseDecimal(formData.get("freight")));
  const additions = Math.max(0, parseDecimal(formData.get("additions")));

  if (!accountId || !opportunityId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const opportunity = await getVisibleOpportunity(opportunityId, appUser);

  if (!opportunity || opportunity.accountId !== accountId) {
    redirect(
      `/accounts/${accountId}?error=${encodeMessage(
        "Oportunidade não encontrada para criação da Proposta.",
      )}`,
    );
  }

  let validatedContactId: string | null = contactId ?? opportunity.contactId;

  if (validatedContactId) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: validatedContactId,
        tenantId: appUser.tenantId,
        accountId,
      },
      select: {
        id: true,
      },
    });

    if (!contact) {
      redirect(
        `/accounts/${accountId}/proposals/new?opportunity=${opportunityId}&error=${encodeMessage(
          "Contato selecionado não pertence a esta Empresa/Prospect.",
        )}`,
      );
    }

    validatedContactId = contact.id;
  }

  const productIds = formData.getAll("productId").map((item) => String(item));
  const names = formData.getAll("itemName").map((item) => String(item).trim());
  const descriptions = formData
    .getAll("itemDescription")
    .map((item) => String(item).trim());
  const units = formData
    .getAll("itemUnit")
    .map((item) => String(item).trim().toLocaleUpperCase("pt-BR"));
  const quantities = formData.getAll("quantity");
  const unitPrices = formData.getAll("unitPrice");
  const itemDiscounts = formData.getAll("itemDiscount");

  const productRecords =
    productIds.filter(Boolean).length > 0
      ? await prisma.product.findMany({
          where: {
            tenantId: appUser.tenantId,
            id: {
              in: productIds.filter(Boolean),
            },
            status: "ACTIVE",
          },
        })
      : [];
  const productMap = new Map(productRecords.map((product) => [product.id, product]));

  const items = names
    .map((name, index) => {
      const product = productIds[index]
        ? productMap.get(productIds[index])
        : null;
      const itemName = name || product?.name || "";
      const qty = Math.max(0, parseQuantity(quantities[index]));
      const unitPrice = Math.max(
        0,
        parseDecimal(unitPrices[index], Number(product?.basePrice ?? 0)),
      );
      const itemDiscount = Math.max(0, parseDecimal(itemDiscounts[index]));
      const lineTotal = Math.max(0, qty * unitPrice - itemDiscount);

      return {
        productId: product?.id ?? null,
        snapshotSku: product?.sku ?? null,
        snapshotName: itemName,
        snapshotDescription: descriptions[index] || product?.description || null,
        snapshotUnit: units[index] || product?.unit || "UN",
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        lineTotal,
      };
    })
    .filter((item) => item.snapshotName.length > 1 && item.quantity > 0);

  if (items.length === 0) {
    redirect(
      `/accounts/${accountId}/proposals/new?opportunity=${opportunityId}&error=${encodeMessage(
        "Inclua pelo menos um item na Proposta.",
      )}`,
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(0, subtotal - proposalDiscount + freight + additions);

  const proposal = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.update({
      where: {
        id: appUser.tenantId,
      },
      data: {
        nextProposalNumber: {
          increment: 1,
        },
      },
      select: {
        nextProposalNumber: true,
      },
    });
    const proposalNumber = tenant.nextProposalNumber - 1;
    const createdProposal = await tx.proposal.create({
      data: {
        tenantId: appUser.tenantId,
        accountId,
        opportunityId,
        contactId: validatedContactId,
        ownerUserId: appUser.id,
        number: proposalNumber,
        validUntil,
        subtotal: money(subtotal),
        discount: money(proposalDiscount),
        freight: money(freight),
        additions: money(additions),
        total: money(total),
        introduction,
        paymentTerms,
        commercialTerms,
        notes,
        items: {
          create: items.map((item, index) => ({
            tenantId: appUser.tenantId,
            productId: item.productId,
            position: index + 1,
            snapshotSku: item.snapshotSku,
            snapshotName: item.snapshotName,
            snapshotDescription: item.snapshotDescription,
            snapshotUnit: item.snapshotUnit,
            quantity: quantity(item.quantity),
            unitPrice: money(item.unitPrice),
            discount: money(item.discount),
            lineTotal: money(item.lineTotal),
          })),
        },
      },
      select: {
        id: true,
        number: true,
        version: true,
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId,
        contactId: validatedContactId,
        opportunityId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Proposta Criada",
        body: `Proposta ${formatProposalNumber(
          createdProposal.number,
          createdProposal.version,
        )} criada para ${opportunity.title}.`,
      },
    });

    return createdProposal;
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath(`/accounts/${accountId}/proposals/${proposal.id}`);
  redirect(
    `/accounts/${accountId}/proposals/${proposal.id}?message=${encodeMessage(
      "Proposta criada.",
    )}`,
  );
}

export async function publishProposalAction(formData: FormData) {
  const appUser = await getAuthenticatedAppUser();
  const proposalId = String(formData.get("proposalId") ?? "").trim();

  if (!proposalId) {
    redirect("/accounts?error=Registro%20nao%20informado.");
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      tenantId: appUser.tenantId,
      opportunity: {
        ...(await getOpportunityVisibilityWhere(appUser)),
      },
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!proposal) {
    redirect("/accounts?error=Proposta%20nao%20encontrada.");
  }

  if (proposal.status !== "DRAFT") {
    redirect(
      `/accounts/${proposal.accountId}/proposals/${proposal.id}?message=${encodeMessage(
        "A Proposta já foi publicada.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: {
        id: proposal.id,
      },
      data: {
        status: "READY",
        publishedAt: new Date(),
      },
    });

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: proposal.accountId,
        contactId: proposal.contactId,
        opportunityId: proposal.opportunityId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Proposta Publicada",
        body: `Proposta ${formatProposalNumber(
          proposal.number,
          proposal.version,
        )} publicada para envio.`,
      },
    });
  });

  revalidatePath(`/accounts/${proposal.accountId}`);
  revalidatePath(`/accounts/${proposal.accountId}/proposals/${proposal.id}`);
  redirect(
    `/accounts/${proposal.accountId}/proposals/${proposal.id}?message=${encodeMessage(
      "Proposta pronta para envio.",
    )}`,
  );
}
