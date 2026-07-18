import type { RawSpreadsheetRow } from "@/lib/imports/spreadsheet";

export const SYSTEM_IMPORT_MAPPING_TEMPLATE_NAME = "Modelo Padrão do Sistema";

export type ImportFieldKey =
  | "companyName"
  | "legalName"
  | "document"
  | "contactName"
  | "contactRole"
  | "email"
  | "phone"
  | "city"
  | "state"
  | "postalCode"
  | "address"
  | "addressNumber"
  | "addressComplement"
  | "district"
  | "website"
  | "segment"
  | "mainSupplier"
  | "notes"
  | "historyBody"
  | "historyChannel"
  | "nextAction"
  | "nextActionDate";

export type ImportFieldDefinition = {
  key: ImportFieldKey;
  label: string;
  standardHeader: string;
  aliases: string[];
  required?: boolean;
  help: string;
};

export type ImportColumnMapping = Partial<Record<ImportFieldKey, string>>;

export type ImportMapping = {
  version: 1;
  fields: ImportColumnMapping;
};

export const importFieldDefinitions: ImportFieldDefinition[] = [
  {
    key: "companyName",
    label: "Empresa/Prospect",
    standardHeader: "Empresa",
    aliases: ["empresa", "cliente", "nome fantasia", "prospect"],
    required: true,
    help: "Nome principal que identifica a Empresa/Prospect.",
  },
  {
    key: "legalName",
    label: "Razão Social",
    standardHeader: "Razão Social",
    aliases: ["razao social", "razão social"],
    help: "Razão social ou nome legal, quando existir.",
  },
  {
    key: "document",
    label: "CNPJ",
    standardHeader: "CNPJ",
    aliases: ["cnpj", "documento"],
    help: "Documento da organização.",
  },
  {
    key: "contactName",
    label: "Contato Principal",
    standardHeader: "Contato",
    aliases: ["contato", "nome do contato", "pessoa"],
    help: "Pessoa de referência da linha.",
  },
  {
    key: "contactRole",
    label: "Função/Cargo",
    standardHeader: "Função/Cargo",
    aliases: ["funcao", "função", "cargo", "funcao cargo", "função cargo"],
    help: "Cargo do contato, quando a planilha informar.",
  },
  {
    key: "email",
    label: "E-mail",
    standardHeader: "E-mail",
    aliases: ["e-mail", "email", "mail"],
    help: "Pode conter um ou mais e-mails na mesma célula.",
  },
  {
    key: "phone",
    label: "Telefone",
    standardHeader: "Telefone",
    aliases: ["fone", "telefone", "whatsapp", "celular"],
    help: "Telefone do contato principal.",
  },
  {
    key: "city",
    label: "Cidade",
    standardHeader: "Cidade",
    aliases: ["cidade", "municipio", "município"],
    help: "Cidade da Empresa/Prospect.",
  },
  {
    key: "state",
    label: "UF",
    standardHeader: "UF",
    aliases: ["uf", "estado"],
    help: "Unidade federativa.",
  },
  {
    key: "postalCode",
    label: "CEP",
    standardHeader: "CEP",
    aliases: ["cep", "codigo postal", "código postal"],
    help: "CEP da Empresa/Prospect.",
  },
  {
    key: "address",
    label: "Endereço",
    standardHeader: "Endereço",
    aliases: ["endereco", "endereço"],
    help: "Endereço comercial.",
  },
  {
    key: "addressNumber",
    label: "Número",
    standardHeader: "Número",
    aliases: ["numero", "número", "nro", "num"],
    help: "Número do endereço.",
  },
  {
    key: "addressComplement",
    label: "Complemento",
    standardHeader: "Complemento",
    aliases: ["complemento", "compl"],
    help: "Complemento do endereço, como sala, bloco ou referência.",
  },
  {
    key: "district",
    label: "Bairro",
    standardHeader: "Bairro",
    aliases: ["bairro", "distrito"],
    help: "Bairro ou distrito do endereço.",
  },
  {
    key: "website",
    label: "Site",
    standardHeader: "Site",
    aliases: ["site", "site do cliente", "website"],
    help: "Site ou página de referência.",
  },
  {
    key: "segment",
    label: "Segmento",
    standardHeader: "Segmento",
    aliases: ["segmento", "ramo", "setor"],
    help: "Segmento comercial, se existir na origem.",
  },
  {
    key: "mainSupplier",
    label: "Fornecedor/Atividade/Marca",
    standardHeader: "Fornecedor",
    aliases: ["principal fornecedor", "fornecedor", "marca", "atividade"],
    help: "Fornecedor, atividade, marca ou interesse principal.",
  },
  {
    key: "notes",
    label: "Observação Comercial",
    standardHeader: "Observação Comercial",
    aliases: ["observacao comercial", "observação comercial", "notas", "observacoes", "observações"],
    help: "Observação geral da Empresa/Prospect.",
  },
  {
    key: "historyBody",
    label: "Histórico Realizado",
    standardHeader: "Histórico",
    aliases: ["acao", "ação", "historico", "histórico", "observacao", "observação"],
    help: "Registro do que já aconteceu.",
  },
  {
    key: "historyChannel",
    label: "Canal/Origem",
    standardHeader: "Canal",
    aliases: ["presencial/email/telefone", "canal", "origem"],
    help: "Canal do histórico ou origem da informação.",
  },
  {
    key: "nextAction",
    label: "Próxima Ação",
    standardHeader: "Próxima Ação",
    aliases: ["proxima visita", "próxima visita", "proxima acao", "próxima ação"],
    help: "Ação futura sugerida.",
  },
  {
    key: "nextActionDate",
    label: "Data da Próxima Ação",
    standardHeader: "Data da Próxima Ação",
    aliases: ["data proxima acao", "data próxima ação", "data proxima visita", "data próxima visita"],
    help: "Data ou data/hora da próxima ação.",
  },
];

const fieldDefinitionsByKey = Object.fromEntries(
  importFieldDefinitions.map((definition) => [definition.key, definition]),
) as Record<ImportFieldKey, ImportFieldDefinition>;

export const systemDefaultImportMapping: ImportMapping = {
  version: 1,
  fields: Object.fromEntries(
    importFieldDefinitions.map((definition) => [
      definition.key,
      definition.standardHeader,
    ]),
  ) as ImportColumnMapping,
};

export function normalizeImportHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseImportMapping(value: unknown): ImportMapping | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { version?: unknown; fields?: unknown };

  if (candidate.version !== 1 || !candidate.fields || typeof candidate.fields !== "object") {
    return null;
  }

  const fields = Object.fromEntries(
    importFieldDefinitions.flatMap((definition) => {
      const rawValue = (candidate.fields as Record<string, unknown>)[definition.key];
      const valueText = String(rawValue ?? "").trim();

      return valueText ? [[definition.key, valueText]] : [];
    }),
  ) as ImportColumnMapping;

  return {
    version: 1,
    fields,
  };
}

export function parseImportMappingJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return parseImportMapping(JSON.parse(value));
  } catch {
    return null;
  }
}

export function suggestImportMapping(headers: string[]): ImportMapping {
  const normalizedHeaders = headers.map((header) => ({
    source: header,
    normalized: normalizeImportHeader(header),
  }));

  return {
    version: 1,
    fields: Object.fromEntries(
      importFieldDefinitions.flatMap((definition) => {
        const aliases = [
          definition.standardHeader,
          ...definition.aliases,
        ].map(normalizeImportHeader);
        const exactMatch = normalizedHeaders.find((header) =>
          aliases.includes(header.normalized),
        );
        const partialMatch = normalizedHeaders.find((header) =>
          aliases.some((alias) => header.normalized.includes(alias)),
        );
        const match = exactMatch ?? partialMatch;

        return match ? [[definition.key, match.source]] : [];
      }),
    ) as ImportColumnMapping,
  };
}

export function validateImportMapping(
  mapping: ImportMapping | null,
  availableHeaders?: string[],
) {
  const fields = mapping?.fields ?? {};
  const availableHeaderSet = new Set(availableHeaders ?? []);
  const missingRequiredFields = importFieldDefinitions
    .filter((definition) => definition.required && !fields[definition.key])
    .map((definition) => definition.label);
  const unavailableRequiredFields = availableHeaders
    ? importFieldDefinitions
        .filter(
          (definition) =>
            definition.required &&
            fields[definition.key] &&
            !availableHeaderSet.has(fields[definition.key]!),
        )
        .map((definition) => definition.label)
    : [];

  return {
    isValid:
      missingRequiredFields.length === 0 &&
      unavailableRequiredFields.length === 0,
    missingRequiredFields,
    unavailableRequiredFields,
  };
}

export function applyImportMapping(
  row: RawSpreadsheetRow,
  mapping: ImportMapping | null,
): RawSpreadsheetRow {
  if (!mapping) {
    return row;
  }

  const mappedValues = Object.fromEntries(
    importFieldDefinitions.map((definition) => {
      const sourceHeader = mapping.fields[definition.key];

      return [
        definition.standardHeader,
        sourceHeader ? row.values[sourceHeader] ?? "" : "",
      ];
    }),
  );

  return {
    ...row,
    values: {
      ...row.values,
      ...mappedValues,
    },
  };
}

export function getImportFieldDefinition(key: ImportFieldKey) {
  return fieldDefinitionsByKey[key];
}

export function buildStandardImportCsv() {
  const headers = importFieldDefinitions.map((definition) => definition.standardHeader);
  const example = [
    "EMPRESA EXEMPLO",
    "EMPRESA EXEMPLO LTDA",
    "00.000.000/0001-00",
    "Maria Compras",
    "Compras",
    "maria@example.com joao@example.com",
    "48999999999",
    "Tijucas",
    "SC",
    "88200-000",
    "Rua Exemplo, 100",
    "100",
    "Sala 2",
    "Centro",
    "https://example.com",
    "Indústria",
    "Tinta Automotiva",
    "Cliente informou interesse em cotação.",
    "Contato inicial realizado por telefone.",
    "Telefone",
    "Retornar contato para proposta.",
    "2026-07-20 09:00",
  ];

  return `\uFEFF${[
    headers.map(csvEscape).join(";"),
    example.map(csvEscape).join(";"),
  ].join("\r\n")}`;
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
