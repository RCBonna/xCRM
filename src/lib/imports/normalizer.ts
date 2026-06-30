import type { RawSpreadsheetRow } from "@/lib/imports/spreadsheet";

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
    address: string | null;
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
  email: ["e-mail", "email", "mail"],
  phone: ["fone", "telefone", "whatsapp", "celular"],
  city: ["cidade", "municipio", "município"],
  state: ["uf", "estado"],
  address: ["endereco", "endereço"],
  website: ["site", "site do cliente", "website"],
  mainSupplier: ["principal fornecedor", "fornecedor", "marca"],
  action: ["acao", "ação", "historico", "histórico", "observacao", "observação"],
  nextAction: ["proxima visita", "próxima visita", "proxima acao", "próxima ação"],
  channel: ["presencial/email/telefone", "canal", "origem"],
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

function buildWarnings(row: NormalizedImportRow) {
  const warnings: string[] = [];

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

export function normalizeSpreadsheetRow(row: RawSpreadsheetRow): NormalizedImportRow {
  const companyName = normalizeUppercase(
    findValue(row.values, columnAliases.companyName),
  );
  const legalName =
    normalizeUppercase(findValue(row.values, columnAliases.legalName)) ??
    companyName;
  const contactName = findValue(row.values, columnAliases.contactName);
  const email = findValue(row.values, columnAliases.email)?.toLowerCase() ?? null;
  const phone = normalizePhone(findValue(row.values, columnAliases.phone));
  const action = findValue(row.values, columnAliases.action);
  const nextAction = findValue(row.values, columnAliases.nextAction);
  const nextActionDate = normalizeDate(nextAction);
  const channel = findValue(row.values, columnAliases.channel);

  const normalizedRow: NormalizedImportRow = {
    company: {
      name: companyName,
      legalName,
      document: normalizeDocument(findValue(row.values, columnAliases.document)),
      city: normalizeUppercase(findValue(row.values, columnAliases.city)),
      state: normalizeUppercase(findValue(row.values, columnAliases.state)),
      address: findValue(row.values, columnAliases.address),
      website: findValue(row.values, columnAliases.website),
      segment: null,
      mainSupplier: normalizeUppercase(
        findValue(row.values, columnAliases.mainSupplier),
      ),
      notes: action || channel || null,
    },
    contacts:
      contactName || email || phone
        ? [
            {
              name: contactName || "Contato a Revisar",
              email,
              phone,
              role: null,
              isPrimary: true,
            },
          ]
        : [],
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

  const warnings = buildWarnings(normalizedRow);
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
