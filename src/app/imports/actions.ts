"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { JobStatus, Prisma } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/auth";
import {
  parseImportMapping,
  parseImportMappingJson,
  validateImportMapping,
} from "@/lib/imports/mapping";
import { normalizeSpreadsheetRow } from "@/lib/imports/normalizer";
import {
  getUploadedFileMetadata,
  readUploadedSpreadsheetRows,
} from "@/lib/imports/spreadsheet";
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
    postalCode: string | null;
    address: string | null;
    addressNumber: string | null;
    addressComplement: string | null;
    district: string | null;
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
  importDecision?: {
    existingAccountMode: "LINK_EXISTING" | "CREATE_NEW";
  };
};

type OwnerUser = Awaited<ReturnType<typeof getOwnerUser>>;

type ReviewImportRow = {
  id: string;
  importId: string;
  rowNumber: number;
  normalizedJson: Prisma.JsonValue | null;
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

function normalizeOptionalEmail(value: unknown) {
  const email = String(value ?? "").trim().toLocaleLowerCase("pt-BR");

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
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

export async function previewImportFileAction(formData: FormData) {
  await getOwnerUser();
  const uploadedFile = formData.get("file");

  if (
    !uploadedFile ||
    typeof uploadedFile === "string" ||
    uploadedFile.size === 0
  ) {
    return {
      error: "Selecione um arquivo para pré-visualizar.",
      headers: [],
      rows: [],
    };
  }

  const fileMetadata = getUploadedFileMetadata(uploadedFile);

  if (!fileMetadata) {
    return {
      error: "Selecione uma planilha nos formatos XLSX ou CSV.",
      headers: [],
      rows: [],
    };
  }

  if (uploadedFile.size > 10 * 1024 * 1024) {
    return {
      error: "O arquivo deve ter no máximo 10 MB.",
      headers: [],
      rows: [],
    };
  }

  const file = {
    ...fileMetadata,
    content: Buffer.from(await uploadedFile.arrayBuffer()),
  };
  const rows = await readUploadedSpreadsheetRows(file);
  const headers = Object.keys(rows[0]?.values ?? {});

  if (rows.length === 0 || headers.length === 0) {
    return {
      error: "Não foi possível identificar cabeçalhos e linhas válidas.",
      headers: [],
      rows: [],
    };
  }

  return {
    error: null,
    headers,
    rows: rows.slice(0, 3).map((row) =>
      headers.map((header) => String(row.values[header] ?? "")),
    ),
  };
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
        status: {
          in: ["REJECTED", "FAILED"],
        },
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

async function getTeamAssignment({
  tenantId,
  teamId,
}: {
  tenantId: string;
  teamId: string | null;
}) {
  if (!teamId) {
    return null;
  }

  return prisma.team.findFirst({
    where: {
      id: teamId,
      tenantId,
      status: "ACTIVE",
      managerUserId: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      managerUserId: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function importReviewedRow({
  row,
  appUser,
  assignedOwnerUserId,
  assignmentTeamName,
}: {
  row: ReviewImportRow;
  appUser: OwnerUser;
  assignedOwnerUserId?: string | null;
  assignmentTeamName?: string | null;
}) {
  if (!row.normalizedJson) {
    throw new Error("Linha temporária sem dados revisados.");
  }

  const reviewJson = row.normalizedJson as ReviewRowJson;

  if (!reviewJson.company.name) {
    throw new Error("Informe o nome da empresa antes de importar.");
  }

  return prisma.$transaction(async (tx) => {
    const shouldCreateNewAccount =
      reviewJson.importDecision?.existingAccountMode === "CREATE_NEW";
    const existingAccount = shouldCreateNewAccount
      ? null
      : await tx.account.findFirst({
          where: {
            tenantId: appUser.tenantId,
            name: {
              equals: reviewJson.company.name!,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            ownerUserId: true,
          },
        });
    const account =
      existingAccount ??
      (await tx.account.create({
        data: {
          tenantId: appUser.tenantId,
          ownerUserId: assignedOwnerUserId ?? appUser.id,
          name: reviewJson.company.name!,
          legalName: reviewJson.company.legalName,
          document: reviewJson.company.document,
          city: reviewJson.company.city,
          state: reviewJson.company.state,
          postalCode: reviewJson.company.postalCode,
          address: reviewJson.company.address,
          addressNumber: reviewJson.company.addressNumber,
          addressComplement: reviewJson.company.addressComplement,
          district: reviewJson.company.district,
          website: reviewJson.company.website,
          segment: reviewJson.company.segment,
          mainSupplier: reviewJson.company.mainSupplier,
          source: "Importado",
          notes: reviewJson.company.notes,
        },
        select: {
          id: true,
          ownerUserId: true,
        },
      }));

    if (existingAccount && assignedOwnerUserId) {
      await tx.account.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          ownerUserId: assignedOwnerUserId,
        },
      });
    }

    let accountHasPrimaryContact = Boolean(
      await tx.contact.findFirst({
        where: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          isPrimary: true,
        },
        select: { id: true },
      }),
    );

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

      if (duplicateContact) {
        if (contact.isPrimary && !accountHasPrimaryContact) {
          await tx.contact.update({
            where: { id: duplicateContact.id },
            data: { isPrimary: true },
          });
          accountHasPrimaryContact = true;
        }
      } else {
        const isPrimary = !accountHasPrimaryContact;

        await tx.contact.create({
          data: {
            tenantId: appUser.tenantId,
            accountId: account.id,
            ownerUserId: assignedOwnerUserId ?? appUser.id,
            name: contact.name || "Contato a Revisar",
            title: contact.role,
            email: contact.email,
            phone: contact.phone,
            isPrimary,
          },
        });

        if (isPrimary) {
          accountHasPrimaryContact = true;
        }
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

      if (history.body) {
        await tx.activity.create({
          data: {
            tenantId: appUser.tenantId,
            accountId: account.id,
            ownerUserId: assignedOwnerUserId ?? appUser.id,
            type: "FOLLOW_UP",
            title: history.body,
            description: history.body,
            status: "COMPLETED",
            completedAt: history.occurredAt ? new Date(history.occurredAt) : new Date(),
            scheduledAt: history.occurredAt ? new Date(history.occurredAt) : new Date(),
            priority: 2,
          },
        });
      }
    }

    for (const action of reviewJson.futureActions) {
      await tx.activity.create({
        data: {
          tenantId: appUser.tenantId,
          accountId: account.id,
          ownerUserId: assignedOwnerUserId ?? appUser.id,
          type: "FOLLOW_UP",
          title: action.description || action.title || "Próxima Ação Importada",
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
        summary: assignmentTeamName
          ? "Linha Importada e Encaminhada"
          : "Linha Importada",
        body: assignmentTeamName
          ? `Linha ${row.rowNumber} da carga ${row.importId} importada pelo Owner e encaminhada para a equipe ${assignmentTeamName}.`
          : `Linha ${row.rowNumber} da carga ${row.importId} importada pelo Owner.`,
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

    return {
      accountId: account.id,
      accountName: reviewJson.company.name!,
      wasExistingAccount: Boolean(existingAccount),
    };
  });
}

function getReviewContactsFromForm(formData: FormData) {
  const fallbackContact = {
    name: normalizeOptionalText(formData.get("contactName")),
    email: normalizeOptionalEmail(formData.get("contactEmail")),
    phone: normalizeOptionalPhone(formData.get("contactPhone")),
    role: normalizeOptionalText(formData.get("contactRole")),
    isPrimary: true,
  };
  const rawContacts = formData.get("contactsJson");

  if (typeof rawContacts !== "string") {
    return {
      contacts:
        fallbackContact.name || fallbackContact.email || fallbackContact.phone
          ? [
              {
                ...fallbackContact,
                name: fallbackContact.name || "Contato a Revisar",
              },
            ]
          : [],
      warnings: [],
    };
  }

  try {
    const parsedContacts: unknown = JSON.parse(rawContacts);

    if (!Array.isArray(parsedContacts)) {
      throw new Error("Formato inválido");
    }

    const seenEmails = new Set<string>();
    const warnings: string[] = [];
    const contacts = parsedContacts.flatMap((rawContact) => {
      if (!rawContact || typeof rawContact !== "object") {
        return [];
      }

      const contact = rawContact as Record<string, unknown>;
      const rawEmail = String(contact.email ?? "").trim();
      const email = normalizeOptionalEmail(rawEmail);
      const name = normalizeOptionalText(String(contact.name ?? ""));
      const phone = normalizeOptionalPhone(String(contact.phone ?? ""));

      if (rawEmail && !email) {
        warnings.push(`O e-mail "${rawEmail}" não é válido e foi removido.`);
      }

      if (!name && !email && !phone) {
        return [];
      }

      if (email && seenEmails.has(email)) {
        warnings.push(`O e-mail duplicado "${email}" foi ignorado.`);
        return [];
      }

      if (email) {
        seenEmails.add(email);
      }

      return [
        {
          name: name || "Contato a Revisar",
          email,
          phone,
          role: normalizeOptionalText(String(contact.role ?? "")),
          isPrimary: Boolean(contact.isPrimary),
        },
      ];
    });
    const primaryIndex = contacts.findIndex((contact) => contact.isPrimary);

    return {
      contacts: contacts.map((contact, index) => ({
        ...contact,
        isPrimary: index === (primaryIndex >= 0 ? primaryIndex : 0),
      })),
      warnings,
    };
  } catch {
    return {
      contacts: [],
      warnings: ["Não foi possível ler os contatos revisados desta linha."],
    };
  }
}

function getReviewRowFromForm(formData: FormData): ReviewRowJson {
  const companyName = normalizeOptionalUppercase(formData.get("companyName"));
  const legalName =
    normalizeOptionalUppercase(formData.get("legalName")) ?? companyName;
  const contactResult = getReviewContactsFromForm(formData);
  const historyBody = normalizeOptionalText(formData.get("historyBody"));
  const nextActionDescription = normalizeOptionalText(
    formData.get("nextActionDescription"),
  );
  const warnings = [
    companyName ? null : "Empresa/Prospect sem nome identificado.",
    contactResult.contacts.length > 0
      ? null
      : "Nenhum contato claro foi identificado nesta linha.",
    nextActionDescription
      ? null
      : "Nenhuma próxima ação futura foi identificada.",
    ...contactResult.warnings,
  ].filter(Boolean) as string[];

  return {
    company: {
      name: companyName,
      legalName,
      document: normalizeOptionalDocument(formData.get("document")),
      city: normalizeOptionalUppercase(formData.get("city")),
      state: normalizeOptionalUppercase(formData.get("state")),
      postalCode: normalizeOptionalText(formData.get("postalCode"))?.replace(/\D/g, "") ?? null,
      address: normalizeOptionalText(formData.get("address")),
      addressNumber: normalizeOptionalText(formData.get("addressNumber")),
      addressComplement: normalizeOptionalText(formData.get("addressComplement")),
      district: normalizeOptionalText(formData.get("district")),
      website: normalizeOptionalText(formData.get("website")),
      segment: normalizeOptionalText(formData.get("segment")),
      mainSupplier: normalizeOptionalUppercase(formData.get("mainSupplier")),
      notes: normalizeOptionalText(formData.get("notes")),
    },
    contacts: contactResult.contacts,
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
    importDecision: {
      existingAccountMode:
        normalizeOptionalText(formData.get("existingAccountMode")) === "CREATE_NEW"
          ? "CREATE_NEW"
          : "LINK_EXISTING",
    },
  };
}

function getRawSpreadsheetValues(rawJson: Prisma.JsonValue) {
  if (!rawJson || typeof rawJson !== "object" || Array.isArray(rawJson)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawJson).map(([key, value]) => [key, String(value ?? "")]),
  );
}

export async function reprocessImportRowContactsAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const rowId = normalizeOptionalText(formData.get("rowId"));

  if (!rowId) {
    redirect("/imports?error=Linha%20nao%20informada.");
  }

  const row = await prisma.importRow.findFirst({
    where: {
      id: rowId,
      tenantId: appUser.tenantId,
      status: "REVIEWING",
      import: { status: { in: activeImportStatuses } },
    },
    select: {
      id: true,
      importId: true,
      rowNumber: true,
      rawJson: true,
      normalizedJson: true,
      import: {
        select: {
          columnMapping: true,
        },
      },
    },
  });

  if (!row?.normalizedJson) {
    redirect("/imports?error=Linha%20temporaria%20nao%20encontrada.");
  }

  const reprocessed = normalizeSpreadsheetRow(
    {
      rowNumber: row.rowNumber,
      values: getRawSpreadsheetValues(row.rawJson),
    },
    parseImportMapping(row.import.columnMapping),
  );
  const currentReview = row.normalizedJson as ReviewRowJson;
  const preservedWarnings = currentReview.aiSuggestion.warnings.filter(
    (warning) =>
      !warning.toLocaleLowerCase("pt-BR").includes("contato") &&
      !warning.toLocaleLowerCase("pt-BR").includes("e-mail"),
  );
  const nextWarnings = [
    ...preservedWarnings,
    ...reprocessed.aiSuggestion.warnings,
  ].filter((warning, index, warnings) => warnings.indexOf(warning) === index);
  const nextReview: ReviewRowJson = {
    ...currentReview,
    contacts: reprocessed.contacts,
    aiSuggestion: {
      ...currentReview.aiSuggestion,
      mode: "owner-review",
      explanation:
        "Contatos reprocessados a partir dos Dados Originais da Planilha.",
      confidence: nextWarnings.length === 0 ? 1 : 0.75,
      warnings: nextWarnings,
    },
  };

  await prisma.importRow.update({
    where: { id: row.id },
    data: {
      normalizedJson: nextReview as Prisma.InputJsonValue,
      errorMessage: nextWarnings.length > 0 ? nextWarnings.join(" ") : null,
    },
  });

  await refreshImportCounts(row.importId, appUser.tenantId);
  revalidatePath("/imports");
  redirect(
    `/imports?row=${row.id}&message=${encodeMessage(
      `${reprocessed.contacts.length} contato(s) reprocessado(s) a partir da planilha.`,
    )}`,
  );
}

export async function startImportBatchAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const uploadedFile = formData.get("file");
  const sourcePath = normalizeOptionalText(formData.get("sourcePath"));
  const columnMapping = parseImportMappingJson(formData.get("columnMappingJson"));
  const mappingTemplateName = normalizeOptionalText(
    formData.get("mappingTemplateName"),
  );

  if (
    !uploadedFile ||
    typeof uploadedFile === "string" ||
    uploadedFile.size === 0
  ) {
    redirect("/imports?error=Selecione%20um%20arquivo%20para%20importar.");
  }

  const fileMetadata = getUploadedFileMetadata(uploadedFile);

  if (!fileMetadata) {
    redirect(
      "/imports?error=Selecione%20uma%20planilha%20nos%20formatos%20XLSX%20ou%20CSV.",
    );
  }

  if (uploadedFile.size > 10 * 1024 * 1024) {
    redirect("/imports?error=O%20arquivo%20deve%20ter%20no%20maximo%2010%20MB.");
  }

  if (sourcePath && sourcePath.length > 1000) {
    redirect("/imports?error=O%20Caminho%20de%20Origem%20deve%20ter%20no%20maximo%201000%20caracteres.");
  }

  if (mappingTemplateName && mappingTemplateName.length > 80) {
    redirect("/imports?error=O%20nome%20do%20modelo%20deve%20ter%20no%20maximo%2080%20caracteres.");
  }

  const mappingValidation = validateImportMapping(columnMapping);

  if (!mappingValidation.isValid) {
    redirect(
      `/imports?error=${encodeMessage(
        `Revise o mapeamento. Campo obrigatório sem coluna: ${mappingValidation.missingRequiredFields.join(", ")}.`,
      )}`,
    );
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

  const file = {
    ...fileMetadata,
    content: Buffer.from(await uploadedFile.arrayBuffer()),
  };
  const rows = await readUploadedSpreadsheetRows(file);

  if (rows.length === 0) {
    redirect("/imports?error=O%20arquivo%20selecionado%20nao%20possui%20linhas%20validas.");
  }

  const headerValidation = validateImportMapping(
    columnMapping,
    Object.keys(rows[0]?.values ?? {}),
  );

  if (!headerValidation.isValid) {
    const missingFields = [
      ...headerValidation.missingRequiredFields,
      ...headerValidation.unavailableRequiredFields,
    ];

    redirect(
      `/imports?error=${encodeMessage(
        `Revise o mapeamento. Campo obrigatório sem coluna válida: ${missingFields.join(", ")}.`,
      )}`,
    );
  }

  const importBatch = await prisma.importBatch.create({
    data: {
      tenantId: appUser.tenantId,
      uploadedByUserId: appUser.id,
      fileName: file.fileName,
      sourcePath,
      sourceType: file.extension.replace(".", "").toUpperCase(),
      columnMapping: columnMapping as Prisma.InputJsonValue,
      status: "REVIEWING",
      totalRows: rows.length,
      rows: {
        createMany: {
          data: rows.map((row) => ({
            tenantId: appUser.tenantId,
            rowNumber: row.rowNumber,
            rawJson: row.values as Prisma.InputJsonValue,
            normalizedJson: normalizeSpreadsheetRow(
              row,
              columnMapping,
            ) as Prisma.InputJsonValue,
            status: "REVIEWING",
          })),
        },
      },
    },
  });

  if (mappingTemplateName && columnMapping) {
    await prisma.importMappingTemplate.upsert({
      where: {
        tenantId_name: {
          tenantId: appUser.tenantId,
          name: mappingTemplateName,
        },
      },
      create: {
        tenantId: appUser.tenantId,
        createdByUserId: appUser.id,
        name: mappingTemplateName,
        mappingJson: columnMapping as Prisma.InputJsonValue,
      },
      update: {
        createdByUserId: appUser.id,
        mappingJson: columnMapping as Prisma.InputJsonValue,
        status: "ACTIVE",
      },
    });
  }

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

  if (intent === "import") {
    if (!reviewJson.company.name) {
      redirect(`/imports?row=${row.id}&error=Informe%20o%20nome%20da%20empresa%20antes%20de%20importar.`);
    }

    await importReviewedRow({
      row: {
        id: row.id,
        importId: row.importId,
        rowNumber: row.rowNumber,
        normalizedJson: reviewJson as Prisma.JsonValue,
      },
      appUser,
    });

    await refreshImportCounts(row.importId, appUser.tenantId);
    const nextRowId = await getNextReviewRowId({
      importId: row.importId,
      tenantId: appUser.tenantId,
      currentRowNumber: row.rowNumber,
    });
    revalidatePath("/imports");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    redirect(
      `/imports${nextRowId ? `?row=${nextRowId}&` : "?"}message=${encodeMessage(
        `Linha ${row.rowNumber} importada para a base definitiva.`,
      )}`,
    );
  }

  await refreshImportCounts(row.importId, appUser.tenantId);
  revalidatePath("/imports");
  const lineMessage =
    nextStatus === "APPROVED"
      ? `Linha ${row.rowNumber} aprovada.`
      : `Linha ${row.rowNumber} salva.`;

  redirect(`/imports?row=${row.id}&message=${encodeMessage(lineMessage)}`);
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
    `/imports${nextRowId ? `?row=${nextRowId}&` : "?"}message=${encodeMessage(
      `Linha ${row.rowNumber} rejeitada.`,
    )}`,
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

  await importReviewedRow({
    row,
    appUser,
  });

  await refreshImportCounts(row.importId, appUser.tenantId);
  const nextRowId = await getNextReviewRowId({
    importId: row.importId,
    tenantId: appUser.tenantId,
    currentRowNumber: row.rowNumber,
  });
  revalidatePath("/imports");
  redirect(
    `/imports${nextRowId ? `?row=${nextRowId}&` : "?"}message=${encodeMessage(
      `Linha ${row.rowNumber} importada para a base definitiva.`,
    )}`,
  );
}

export async function importApprovedRowsAction(formData: FormData) {
  const appUser = await getOwnerUser();
  const batchId = normalizeOptionalText(formData.get("batchId"));
  const teamId = normalizeOptionalText(formData.get("teamId"));

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

  const teamAssignment = await getTeamAssignment({
    tenantId: appUser.tenantId,
    teamId,
  });

  if (teamId && !teamAssignment?.managerUserId) {
    redirect(
      `/imports?error=${encodeMessage(
        "Selecione uma equipe ativa com líder definido para encaminhar prospects.",
      )}`,
    );
  }

  const approvedRows = await prisma.importRow.findMany({
    where: {
      importId: batch.id,
      tenantId: appUser.tenantId,
      status: "APPROVED",
    },
    orderBy: {
      rowNumber: "asc",
    },
  });

  if (approvedRows.length === 0) {
    redirect("/imports?error=Nenhuma%20linha%20aprovada%20para%20importar.");
  }

  const importedAccounts: Array<{ id: string; name: string }> = [];
  let importedCount = 0;
  let errorCount = 0;

  for (const row of approvedRows) {
    try {
      const result = await importReviewedRow({
        row,
        appUser,
        assignedOwnerUserId: teamAssignment?.managerUserId,
        assignmentTeamName: teamAssignment?.name,
      });

      importedCount += 1;
      importedAccounts.push({
        id: result.accountId,
        name: result.accountName,
      });
    } catch (error) {
      errorCount += 1;
      await prisma.importRow.update({
        where: {
          id: row.id,
        },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Erro inesperado ao importar a linha aprovada.",
        },
      });
    }
  }

  await refreshImportCounts(batch.id, appUser.tenantId);

  if (teamAssignment?.managerUserId && importedCount > 0) {
    await prisma.notification.create({
      data: {
        tenantId: appUser.tenantId,
        recipientUserId: teamAssignment.managerUserId,
        actorUserId: appUser.id,
        type: "PROSPECTS_ASSIGNED_TO_TEAM",
        title: "Novos Prospects para Distribuir",
        body: `${appUser.name} encaminhou ${importedCount} prospect(s) da carga ${batch.fileName} para a equipe ${teamAssignment.name}.`,
        metadata: {
          importBatchId: batch.id,
          importFileName: batch.fileName,
          teamId: teamAssignment.id,
          teamName: teamAssignment.name,
          importedCount,
          errorCount,
          accounts: importedAccounts.slice(0, 20),
        },
      },
    });
  }

  await prisma.interaction.create({
    data: {
      tenantId: appUser.tenantId,
      userId: appUser.id,
      channel: "MANUAL_NOTE",
      direction: "INTERNAL",
      summary: "Aprovadas Importadas em Lote",
      body: teamAssignment
        ? `${importedCount} linha(s) aprovadas da carga ${batch.fileName} foram importadas e encaminhadas para a equipe ${teamAssignment.name}. ${errorCount} linha(s) falharam.`
        : `${importedCount} linha(s) aprovadas da carga ${batch.fileName} foram importadas. ${errorCount} linha(s) falharam.`,
    },
  });

  revalidatePath("/imports");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect(
    `/imports?message=${encodeMessage(
      `${importedCount} aprovada(s) importada(s). ${errorCount} com erro.`,
    )}`,
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
