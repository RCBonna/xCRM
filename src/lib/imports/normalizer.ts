import type { RawSpreadsheetRow } from "@/lib/imports/spreadsheet";
import {
  applyImportMapping,
  type ImportMapping,
} from "@/lib/imports/mapping";

type NormalizedContact = {
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
};

type NormalizedImportRow = {
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
  contacts: NormalizedContact[];
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
    mode: "heuristic";
    explanation: string;
    confidence: number;
    warnings: string[];
  };
};

const columnAliases = {
  companyName: ["empresa", "cliente", "nome fantasia", "prospect"],
  legalName: ["razao social", "razão social"],
  document: ["cnpj", "documento"],
  contactName: ["contato", "nome do contato", "pessoa"],
  contactRole: ["funcao", "função", "cargo", "funcao cargo", "função cargo"],
  email: ["e-mail", "email", "mail"],
  phone: ["fone", "telefone", "whatsapp", "celular"],
  city: ["cidade", "municipio", "município"],
  state: ["uf", "estado"],
  postalCode: ["cep", "codigo postal", "código postal"],
  address: ["endereco", "endereço"],
  addressNumber: ["numero", "número", "nro", "num"],
  addressComplement: ["complemento", "compl"],
  district: ["bairro", "distrito"],
  website: ["site", "site do cliente", "website"],
  segment: ["segmento", "ramo", "setor"],
  mainSupplier: ["principal fornecedor", "fornecedor", "marca"],
  notes: [
    "observacao comercial",
    "observação comercial",
    "notas",
    "observacoes",
    "observações",
  ],
  action: ["acao", "ação", "historico", "histórico", "observacao", "observação"],
  nextAction: ["proxima visita", "próxima visita", "proxima acao", "próxima ação"],
  nextActionDate: [
    "data proxima acao",
    "data próxima ação",
    "data proxima visita",
    "data próxima visita",
  ],
  channel: ["presencial/email/telefone", "canal", "origem"],
};

const emailPattern = /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi;

type ContactExtraction = {
  contacts: NormalizedContact[];
  warnings: string[];
};

function normalizeKey(key: string) {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findValue(values: Record<string, string>, aliases: string[]) {
  const entries = Object.entries(values);
  const normalizedAliases = aliases.map(normalizeKey);
  const exactMatch = entries.find(([key]) =>
    normalizedAliases.includes(normalizeKey(key)),
  );

  if (exactMatch) {
    return exactMatch[1] || null;
  }

  const partialMatch = entries.find(([key]) => {
    const normalizedKey = normalizeKey(key);

    return normalizedAliases.some((alias) => normalizedKey.includes(alias));
  });

  return partialMatch?.[1] || null;
}

function normalizeUppercase(value: string | null) {
  return value?.trim().toLocaleUpperCase("pt-BR") || null;
}

function normalizeDocument(value: string | null) {
  const document = value?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";

  return document.length > 0 ? document : null;
}

function normalizePhone(value: string | null) {
  const phone = value?.replace(/[^\d+]/g, "") ?? "";

  return phone.length > 0 ? phone : null;
}

function normalizePostalCode(value: string | null) {
  const postalCode = value?.replace(/\D/g, "") ?? "";

  return postalCode.length > 0 ? postalCode : null;
}

function normalizeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function normalizeContactName(value: string) {
  const name = value
    .replace(/[<>()[\]{}"']/g, " ")
    .replace(/[;,/|]+/g, " ")
    .replace(/\b(e-?mails?|contatos?)\s*:?/gi, " ")
    .replace(/[\s-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return name.length > 1 ? name : null;
}

function extractContactsFromEmailCell({
  emailCell,
  contactName,
  phone,
  role,
}: {
  emailCell: string | null;
  contactName: string | null;
  phone: string | null;
  role: string | null;
}): ContactExtraction {
  if (!emailCell) {
    return {
      contacts:
        contactName || phone
          ? [
              {
                name: contactName || "Contato a Revisar",
                email: null,
                phone,
                role,
                isPrimary: true,
              },
            ]
          : [],
      warnings: [],
    };
  }

  const matches = Array.from(emailCell.matchAll(emailPattern));

  if (matches.length === 0) {
    return {
      contacts:
        contactName || phone
          ? [
              {
                name: contactName || "Contato a Revisar",
                email: null,
                phone,
                role,
                isPrimary: true,
              },
            ]
          : [],
      warnings: [
        "Nenhum e-mail válido foi reconhecido na célula de e-mail; revise o conteúdo original.",
      ],
    };
  }

  const seenEmails = new Set<string>();
  const contacts: NormalizedContact[] = [];
  let cursor = 0;
  let ignoredDuplicates = false;

  for (const match of matches) {
    const email = match[0].toLocaleLowerCase("pt-BR");
    const segmentBeforeEmail = emailCell.slice(cursor, match.index ?? 0);
    cursor = (match.index ?? 0) + match[0].length;

    if (seenEmails.has(email)) {
      ignoredDuplicates = true;
      continue;
    }

    seenEmails.add(email);
    const inlineName = normalizeContactName(segmentBeforeEmail);
    const isFirstContact = contacts.length === 0;

    contacts.push({
      name:
        inlineName ??
        (isFirstContact ? contactName : null) ??
        "Contato a Revisar",
      email,
      phone: isFirstContact ? phone : null,
      role,
      isPrimary: isFirstContact,
    });
  }

  return {
    contacts,
    warnings: ignoredDuplicates
      ? ["Endereços de e-mail duplicados na mesma célula foram ignorados."]
      : [],
  };
}

function buildWarnings(row: NormalizedImportRow, extractionWarnings: string[]) {
  const warnings = [...extractionWarnings];

  if (!row.company.name) {
    warnings.push("Empresa/Prospect sem nome identificado.");
  }

  if (row.contacts.length === 0) {
    warnings.push("Nenhum contato claro foi identificado nesta linha.");
  }

  if (row.futureActions.length === 0) {
    warnings.push("Nenhuma próxima ação futura foi identificada.");
  }

  if (row.company.document && row.company.document.length !== 14) {
    warnings.push("CNPJ/documento identificado com tamanho diferente de 14 posições.");
  }

  return warnings;
}

export function normalizeSpreadsheetRow(
  row: RawSpreadsheetRow,
  mapping?: ImportMapping | null,
): NormalizedImportRow {
  const mappedRow = applyImportMapping(row, mapping ?? null);
  const companyName = normalizeUppercase(
    findValue(mappedRow.values, columnAliases.companyName),
  );
  const legalName =
    normalizeUppercase(findValue(mappedRow.values, columnAliases.legalName)) ??
    companyName;
  const contactName = findValue(mappedRow.values, columnAliases.contactName);
  const contactRole = findValue(mappedRow.values, columnAliases.contactRole);
  const emailCell = findValue(mappedRow.values, columnAliases.email);
  const phone = normalizePhone(findValue(mappedRow.values, columnAliases.phone));
  const notes = findValue(mappedRow.values, columnAliases.notes);
  const action = findValue(mappedRow.values, columnAliases.action);
  const nextAction = findValue(mappedRow.values, columnAliases.nextAction);
  const nextActionDate =
    normalizeDate(findValue(mappedRow.values, columnAliases.nextActionDate)) ??
    normalizeDate(nextAction);
  const channel = findValue(mappedRow.values, columnAliases.channel);
  const contactExtraction = extractContactsFromEmailCell({
    emailCell,
    contactName,
    phone,
    role: contactRole,
  });

  const normalizedRow: NormalizedImportRow = {
    company: {
      name: companyName,
      legalName,
      document: normalizeDocument(findValue(mappedRow.values, columnAliases.document)),
      city: normalizeUppercase(findValue(mappedRow.values, columnAliases.city)),
      state: normalizeUppercase(findValue(mappedRow.values, columnAliases.state)),
      postalCode: normalizePostalCode(
        findValue(mappedRow.values, columnAliases.postalCode),
      ),
      address: findValue(mappedRow.values, columnAliases.address),
      addressNumber: findValue(mappedRow.values, columnAliases.addressNumber),
      addressComplement: findValue(
        mappedRow.values,
        columnAliases.addressComplement,
      ),
      district: findValue(mappedRow.values, columnAliases.district),
      website: findValue(mappedRow.values, columnAliases.website),
      segment: findValue(mappedRow.values, columnAliases.segment),
      mainSupplier: normalizeUppercase(
        findValue(mappedRow.values, columnAliases.mainSupplier),
      ),
      notes: notes || action || channel || null,
    },
    contacts: contactExtraction.contacts,
    history: action
      ? [
          {
            summary: "Histórico Importado",
            body: [action, channel ? `Canal: ${channel}` : null]
              .filter(Boolean)
              .join("\n"),
            occurredAt: null,
          },
        ]
      : [],
    futureActions: nextAction
      ? [
          {
            title: "Próxima Ação Importada",
            description: nextAction,
            scheduledAt: nextActionDate,
            priority: 2,
          },
        ]
      : [],
    aiSuggestion: {
      mode: "heuristic",
      explanation:
        "Sugestão inicial criada por heurística local; revise antes de importar a linha.",
      confidence: 0.5,
      warnings: [],
    },
  };

  const warnings = buildWarnings(normalizedRow, contactExtraction.warnings);
  const confidenceSignals = [
    Boolean(normalizedRow.company.name),
    normalizedRow.contacts.length > 0,
    normalizedRow.history.length > 0 || normalizedRow.futureActions.length > 0,
    warnings.length === 0,
  ].filter(Boolean).length;

  normalizedRow.aiSuggestion = {
    ...normalizedRow.aiSuggestion,
    confidence: Math.max(0.25, confidenceSignals / 4),
    warnings,
  };

  return normalizedRow;
}
