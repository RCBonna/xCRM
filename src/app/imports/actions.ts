"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { JobStatus, Prisma } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/auth";
import { normalizeSpreadsheetRow } from "@/lib/imports/normalizer";
import { getImportFile, readSpreadsheetRows } from "@/lib/imports/spreadsheet";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const activeImportStatuses: JobStatus[] = [
  "QUEUED",
  "PROCESSING",
  "REVIEWING",
  "APPROVED",
];

type ReviewRowJson = {
  company: {
    name: string | null;
    legalName: string | null;
    document: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    website: string | null;
    segment: string | null;
    mainSupplier: string | null;
    notes: string | null;
  };
  contacts: Array<{
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    isPrimary: boolean;
  }>;
  history: Array<{
    summary: string;
    body: string | null;
    occurredAt: string | null;
  }>;
  futureActions: Array<{
    title: string;
    description: string | null;
    scheduledAt: string | null;
    priority: number;
  }>;
  aiSuggestion: {
    mode: string;
    explanation: string;
    confidence: number;
    warnings: string[];
  };
};

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

function normalizeOptionalDocument(value: FormDataEntryValue | null) {
  return (
    normalizeOptionalText(value)
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "") ?? null
  );
}

function normalizeOptionalPhone(value: FormDataEntryValue | null) {
  return normalizeOptionalText(value)?.replace(/[^\d+]/g, "") ?? null;
}

function parseOptionalDateTime(value: FormDataEntryValue | null) {
  const text = normalizeOptionalText(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function getOwnerUser() {
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

  if (appUser.role !== "OWNER") {
    redirect("/dashboard?error=Somente%20Owner%20pode%20importar%20dados.");
  }

  return appUser;
}

async function refreshImportCounts(importId: string, tenantId: string) {
  const [totalRows, validRows, invalidRows] = await Promise.all([
    prisma.importRow.count({
      where: {
        importId,
        tenantId,
      },
    }),
    prisma.importRow.count({
      where: {
        importId,
        tenantId,
        status: {
          in: ["APPROVED", "IMPORTED"],
        },
      },
    }),
    prisma.importRow.count({
      where: {
        importId,
        tenantId,
        status: "REJECTED",
      },
    }),
  ]);

  await prisma.importBatch.update({
    where: {
      id: importId,
    },
    data: {
      totalRows,
      validRows,
      invalidRows,
    },
  });
}

async function getNextReviewRowId({
  importId,
  tenantId,
  currentRowNumber,
}: {
  importId: string;
  tenantId: string;
  currentRowNumber: number;
}) {
  const nextRow =
    (await prisma.importRow.findFirst({
      where: {
        importId,
        tenantId,
        rowNumber: {
          gt: currentRowNumber,
        },
        status: {
          in: ["REVIEWING", "APPROVED"],
        },
      },
      orderBy: {
        rowNumber: "asc",
      },
      select: {
        id: true,
      },
    })) ??
    (await prisma.importRow.findFirst({
      where: {
        importId,
        tenantId,
        status: {
          in: ["REVIEWING", "APPROVED"],
        },
      },
      orderBy: {
        rowNumber: "asc",
      },
      select: {
        id: true,
      },
    }));

  return nextRow?.id ?? null;
}

function getReviewRowFromForm(formData: FormData): ReviewRowJson {
  const companyName = normalizeOptionalUppercase(formData.get("companyName"));
  const legalName =
    normalizeOptionalUppercase(formData.get("legalName")) ?? companyName;
  const contactName = normalizeOptionalText(formData.get("contactName"));
  const historyBody = normalizeOptionalText(formData.get("historyBody"));
  const nextActionDescription = normalizeOptionalText(
    formData.get("nextActionDescription"),
  );
  const warnings = [
    companyName ? null : "Empresa/Prospect sem nome identificado.",
    contactName ||
    normalizeOptionalText(formData.get("contactEmail")) ||
    normalizeOptionalText(formData.get("contactPhone"))
      ? null
      : "Nenhum contato claro foi identificado nesta linha.",
    nextActionDescription
      ? null
      : "Nenhuma próxima ação futura foi identificada.",
  ].filter(Boolean) as string[];

  return {
    company: {
      name: companyName,
      legalName,
      document: normalizeOptionalDocument(formData.get("document")),
      city: normalizeOptionalUppercase(formData.get("city")),
      state: normalizeOptionalUppercase(formData.get("state")),
      address: normalizeOptionalText(formData.get("address")),
      website: normalizeOptionalText(formData.get("website")),
      segment: normalizeOptionalText(formData.get("segment")),
      mainSupplier: normalizeOptionalUppercase(formData.get("mainSupplier")),
      notes: normalizeOptionalText(formData.get("notes")),
    },
    contacts:
      contactName ||
      normalizeOptionalText(formData.get("contactEmail")) ||
      normalizeOptionalText(formData.get("contactPhone"))
        ? [
            {
              name: contactName || "Contato a Revisar",
              email:
                normalizeOptionalText(formData.get("contactEmail"))?.toLowerCase() ??
                null,
              phone: normalizeOptionalPhone(formData.get("contactPhone")),
              role: normalizeOptionalText(formData.get("contactRole")),
              isPrimary: true,
            },
          ]
        : [],
    history: historyBody
      ? [
          {
            summary: "Histórico Importado",
            body: historyBody,
            occurredAt: null,
          },
        ]
      : [],
    futureActions: nextActionDescription
      ? [
          {
            title:
              normalizeOptionalText(formData.get("nextActionTitle")) ??
              "Próxima Ação Importada",
            description: nextActionDescription,
            scheduledAt: parseOptionalDateTime(formData.get("scheduledAt")),
            priority: 2,
          },
        ]
      : [],
    aiSuggestion: {
      mode: "owner-review",
      explanation: "Linha revisada manualmente pelo Owner no ambiente temporário.",
      confidence: warnings.length === 0 ? 1 : 0.75,
      warnings,
    },
  };
}

export async function startImportBatchAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const fileName = normalizeOptionalText(formData.get("fileName"));

  if (!fileName) {
    redirect("/imports?error=Selecione%20um%20arquivo%20para%20importar.");
  }

  const activeImport = await prisma.importBatch.findFirst({
    where: {
      tenantId: appUser.tenantId,
      status: {
        in: activeImportStatuses,
      },
    },
    select: {
      id: true,
    },
  });

  if (activeImport) {
    redirect(
      `/imports?error=${encodeMessage(
        "Já existe uma carga temporária em andamento. Descarte a carga atual antes de iniciar outra.",
      )}`,
    );
  }

  const file = await getImportFile(fileName);

  if (!file) {
    redirect("/imports?error=Arquivo%20nao%20encontrado%20na%20pasta%20configurada.");
  }

  const rows = await readSpreadsheetRows(file);

  if (rows.length === 0) {
    redirect("/imports?error=O%20arquivo%20selecionado%20nao%20possui%20linhas%20validas.");
  }

  const importBatch = await prisma.importBatch.create({
    data: {
      tenantId: appUser.tenantId,
      uploadedByUserId: appUser.id,
      fileName: file.fileName,
      sourceType: file.extension.replace(".", "").toUpperCase(),
      status: "REVIEWING",
      totalRows: rows.length,
      rows: {
        createMany: {
          data: rows.map((row) => ({
            tenantId: appUser.tenantId,
            rowNumber: row.rowNumber,
            rawJson: row.values as Prisma.InputJsonValue,
            normalizedJson: normalizeSpreadsheetRow(row) as Prisma.InputJsonValue,
            status: "REVIEWING",
          })),
        },
      },
    },
  });

  await prisma.interaction.create({
    data: {
      tenantId: appUser.tenantId,
      userId: appUser.id,
      channel: "MANUAL_NOTE",
      direction: "INTERNAL",
      summary: "Carga Temporária Criada",
      body: `Arquivo ${file.fileName} carregado para revisão temporária com ${rows.length} linhas.`,
    },
  });

  revalidatePath("/imports");
  redirect(`/imports?batch=${importBatch.id}&message=Carga%20temporaria%20criada.`);
}

export async function updateImportRowAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const rowId = normalizeOptionalText(formData.get("rowId"));
  const intent = normalizeOptionalText(formData.get("intent"));

  if (!rowId) {
    redirect("/imports?error=Linha%20nao%20informada.");
  }

  const row = await prisma.importRow.findFirst({
    where: {
      id: rowId,
      tenantId: appUser.tenantId,
      import: {
        status: {
          in: activeImportStatuses,
        },
      },
    },
    select: {
      id: true,
      importId: true,
      rowNumber: true,
    },
  });

  if (!row) {
    redirect("/imports?error=Linha%20temporaria%20nao%20encontrada.");
  }

  const reviewJson = getReviewRowFromForm(formData);
  const nextStatus = intent === "approve" ? "APPROVED" : "REVIEWING";

  await prisma.importRow.update({
    where: {
      id: row.id,
    },
    data: {
      normalizedJson: reviewJson as Prisma.InputJsonValue,
      status: nextStatus,
      errorMessage:
        reviewJson.aiSuggestion.warnings.length > 0
          ? reviewJson.aiSuggestion.warnings.join(" ")
          : null,
    },
  });

  await refreshImportCounts(row.importId, appUser.tenantId);
  revalidatePath("/imports");
  redirect(`/imports?row=${row.id}&message=Linha%20temporaria%20salva.`);
}

export async function rejectImportRowAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const rowId = normalizeOptionalText(formData.get("rowId"));

  if (!rowId) {
    redirect("/imports?error=Linha%20nao%20informada.");
  }

  const row = await prisma.importRow.findFirst({
    where: {
      id: rowId,
      tenantId: appUser.tenantId,
      import: {
        status: {
          in: activeImportStatuses,
        },
      },
    },
    select: {
      id: true,
      importId: true,
      rowNumber: true,
    },
  });

  if (!row) {
    redirect("/imports?error=Linha%20temporaria%20nao%20encontrada.");
  }

  await prisma.importRow.update({
    where: {
      id: row.id,
    },
    data: {
      status: "REJECTED",
      errorMessage: "Linha rejeitada pelo Owner.",
    },
  });

  await refreshImportCounts(row.importId, appUser.tenantId);
  const nextRowId = await getNextReviewRowId({
    importId: row.importId,
    tenantId: appUser.tenantId,
    currentRowNumber: row.rowNumber,
  });
  revalidatePath("/imports");
  redirect(
    `/imports${nextRowId ? `?row=${nextRowId}&` : "?"}message=Linha%20rejeitada.`,
  );
}

export async function importSingleRowAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const rowId = normalizeOptionalText(formData.get("rowId"));

  if (!rowId) {
    redirect("/imports?error=Linha%20nao%20informada.");
  }

  const row = await prisma.importRow.findFirst({
    where: {
      id: rowId,
      tenantId: appUser.tenantId,
      status: {
        in: ["APPROVED", "REVIEWING"],
      },
      import: {
        status: {
          in: activeImportStatuses,
        },
      },
    },
  });

  if (!row?.normalizedJson) {
    redirect("/imports?error=Linha%20temporaria%20nao%20encontrada.");
  }

  const reviewJson = row.normalizedJson as ReviewRowJson;

  if (!reviewJson.company.name) {
    redirect(`/imports?row=${row.id}&error=Informe%20o%20nome%20da%20empresa%20antes%20de%20importar.`);
  }

  await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.account.findFirst({
      where: {
        tenantId: appUser.tenantId,
        name: {
          equals: reviewJson.company.name!,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    const account =
      existingAccount ??
      (await tx.account.create({
        data: {
          tenantId: appUser.tenantId,
          ownerUserId: appUser.id,
          name: reviewJson.company.name!,
          legalName: reviewJson.company.legalName,
          document: reviewJson.company.document,
          city: reviewJson.company.city,
          state: reviewJson.company.state,
          address: reviewJson.company.address,
          website: reviewJson.company.website,
          segment: reviewJson.company.segment,
          mainSupplier: reviewJson.company.mainSupplier,
          notes: reviewJson.company.notes,
        },
        select: {
          id: true,
        },
      }));

    for (const contact of reviewJson.contacts) {
      if (!contact.name && !contact.email && !contact.phone) {
        continue;
      }

      const duplicateContact = contact.email
        ? await tx.contact.findFirst({
            where: {
              tenantId: appUser.tenantId,
              accountId: account.id,
              email: contact.email,
            },
            select: {
              id: true,
            },
          })
        : null;

      if (!duplicateContact) {
        await tx.contact.create({
          data: {
            tenantId: appUser.tenantId,
            accountId: account.id,
            ownerUserId: appUser.id,
            name: contact.name || "Contato a Revisar",
            title: contact.role,
            email: contact.email,
            phone: contact.phone,
            isPrimary: contact.isPrimary,
          },
        });
      }
    }

    for (const history of reviewJson.history) {
      await tx.interaction.create({
        data: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          userId: appUser.id,
          channel: "MANUAL_NOTE",
          direction: "INTERNAL",
          summary: history.summary || "Histórico Importado",
          body: history.body,
          occurredAt: history.occurredAt ? new Date(history.occurredAt) : undefined,
        },
      });
    }

    for (const action of reviewJson.futureActions) {
      await tx.activity.create({
        data: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          ownerUserId: appUser.id,
          type: "FOLLOW_UP",
          title: action.title || "Próxima Ação Importada",
          description: action.description,
          scheduledAt: action.scheduledAt ? new Date(action.scheduledAt) : null,
          priority: action.priority,
        },
      });
    }

    await tx.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        accountId: account.id,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Linha Importada",
        body: `Linha ${row.rowNumber} da carga ${row.importId} importada pelo Owner.`,
      },
    });

    await tx.importRow.update({
      where: {
        id: row.id,
      },
      data: {
        status: "IMPORTED",
        errorMessage: null,
      },
    });
  });

  await refreshImportCounts(row.importId, appUser.tenantId);
  const nextRowId = await getNextReviewRowId({
    importId: row.importId,
    tenantId: appUser.tenantId,
    currentRowNumber: row.rowNumber,
  });
  revalidatePath("/imports");
  redirect(
    `/imports${nextRowId ? `?row=${nextRowId}&` : "?"}message=Linha%20importada%20para%20a%20base%20definitiva.`,
  );
}

export async function discardImportBatchAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const batchId = normalizeOptionalText(formData.get("batchId"));

  if (!batchId) {
    redirect("/imports?error=Carga%20temporaria%20nao%20informada.");
  }

  const batch = await prisma.importBatch.findFirst({
    where: {
      id: batchId,
      tenantId: appUser.tenantId,
      status: {
        in: activeImportStatuses,
      },
    },
    select: {
      id: true,
      fileName: true,
    },
  });

  if (!batch) {
    redirect("/imports?error=Carga%20temporaria%20nao%20encontrada.");
  }

  await prisma.$transaction([
    prisma.importRow.updateMany({
      where: {
        importId: batch.id,
        tenantId: appUser.tenantId,
        status: {
          not: "IMPORTED",
        },
      },
      data: {
        status: "DISCARDED",
        errorMessage: "Carga descartada pelo Owner.",
      },
    }),
    prisma.importBatch.update({
      where: {
        id: batch.id,
      },
      data: {
        status: "DISCARDED",
        completedAt: new Date(),
      },
    }),
    prisma.interaction.create({
      data: {
        tenantId: appUser.tenantId,
        userId: appUser.id,
        channel: "MANUAL_NOTE",
        direction: "INTERNAL",
        summary: "Carga Temporária Descartada",
        body: `Carga temporária ${batch.fileName} descartada pelo Owner.`,
      },
    }),
  ]);

  revalidatePath("/imports");
  redirect("/imports?message=Carga%20temporaria%20descartada.");
}
