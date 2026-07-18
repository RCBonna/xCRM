"use client";

import {
  Download,
  FileSpreadsheet,
  Info,
  Save,
  Upload,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

import {
  previewImportFileAction,
  startImportBatchAction,
} from "@/app/imports/actions";
import {
  importFieldDefinitions,
  parseImportMapping,
  suggestImportMapping,
  systemDefaultImportMapping,
  SYSTEM_IMPORT_MAPPING_TEMPLATE_NAME,
  type ImportColumnMapping,
  type ImportMapping,
} from "@/lib/imports/mapping";

type SavedMappingTemplate = {
  id: string;
  name: string;
  mappingJson: unknown;
};

type ImportMappingStarterProps = {
  mappingTemplates: SavedMappingTemplate[];
};

type PreviewData = {
  headers: string[];
  rows: string[][];
};

const unmappedValue = "__unmapped";
const suggestedTemplateId = "__suggested";
const systemTemplateId = "__system";

function applyTemplateToHeaders(
  template: ImportMapping,
  headers: string[],
): ImportColumnMapping {
  return Object.fromEntries(
    importFieldDefinitions.flatMap((definition) => {
      const sourceHeader = template.fields[definition.key];

      if (!sourceHeader) {
        return [];
      }

      const currentHeader =
        headers.find(
          (header) =>
            header.toLocaleLowerCase("pt-BR") ===
            sourceHeader.toLocaleLowerCase("pt-BR"),
        ) ?? sourceHeader;

      return [[definition.key, currentHeader]];
    }),
  ) as ImportColumnMapping;
}

export function ImportMappingStarter({
  mappingTemplates,
}: ImportMappingStarterProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mappingFields, setMappingFields] = useState<ImportColumnMapping>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(suggestedTemplateId);
  const [isReading, setIsReading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [shouldSaveTemplate, setShouldSaveTemplate] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const parsedTemplates = useMemo(
    () =>
      mappingTemplates.flatMap((template) => {
        const mapping = parseImportMapping(template.mappingJson);

        return mapping
          ? [
              {
                ...template,
                mapping,
              },
            ]
          : [];
      }),
    [mappingTemplates],
  );

  const currentMapping: ImportMapping = useMemo(
    () => ({
      version: 1,
      fields: mappingFields,
    }),
    [mappingFields],
  );

  const mappedHeaderSet = useMemo(
    () => new Set(Object.values(mappingFields).filter(Boolean)),
    [mappingFields],
  );
  const missingMappedHeaders =
    preview?.headers.filter((header) => !mappedHeaderSet.has(header)) ?? [];
  const missingRequiredFields = importFieldDefinitions.filter(
    (definition) => definition.required && !mappingFields[definition.key],
  );
  const isEmailMapped = Boolean(mappingFields.email);

  function applyTemplate(templateId: string, headers = preview?.headers ?? []) {
    setSelectedTemplateId(templateId);

    if (templateId === suggestedTemplateId) {
      setMappingFields(suggestImportMapping(headers).fields);
      return;
    }

    if (templateId === systemTemplateId) {
      setMappingFields(applyTemplateToHeaders(systemDefaultImportMapping, headers));
      return;
    }

    const template = parsedTemplates.find((item) => item.id === templateId);

    if (template) {
      setMappingFields(applyTemplateToHeaders(template.mapping, headers));
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setPreviewError(null);

    if (!file) {
      setSelectedFileName("");
      setPreview(null);
      setMappingFields({});
      return;
    }

    setSelectedFileName(file.name);
    setIsReading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await previewImportFileAction(formData);

      if (result.error) {
        setPreview(null);
        setMappingFields({});
        setPreviewError(result.error);
        return;
      }

      const nextPreview = {
        headers: result.headers,
        rows: result.rows,
      };
      setPreview(nextPreview);

      if (nextPreview.headers.length === 0) {
        setPreviewError("Não foi possível identificar cabeçalhos no arquivo.");
        setMappingFields({});
      } else {
        setSelectedTemplateId(suggestedTemplateId);
        setMappingFields(suggestImportMapping(nextPreview.headers).fields);
      }
    } catch {
      setPreview(null);
      setMappingFields({});
      setPreviewError("Não foi possível pré-ler a planilha selecionada.");
    } finally {
      setIsReading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Iniciar Carga Temporária</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Selecione a planilha, confira o mapeamento das colunas e envie para
            revisão temporária.
          </p>
        </div>
        <FileSpreadsheet size={22} className="text-primary" aria-hidden />
      </div>

      <div className="mt-4 rounded-md border border-border bg-background px-3 py-3 text-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2 text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>
              O modelo padrão é somente leitura. Você pode baixar um CSV de
              referência, ajustar as colunas da sua planilha e salvar um modelo
              próprio do tenant ao criar a carga.
            </p>
          </div>
          <a
            href="/api/imports/template.csv"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium"
          >
            <Download size={14} aria-hidden />
            Baixar CSV Padrão
          </a>
        </div>
      </div>

      <form action={startImportBatchAction} className="mt-5 grid min-w-0 gap-4">
        <input
          type="hidden"
          name="columnMappingJson"
          value={JSON.stringify(currentMapping)}
        />

        <div className="grid min-w-0 gap-1 text-sm">
          <span className="font-medium">Arquivo da Planilha</span>
          <span className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <input
              id="import-spreadsheet-file"
              required
              name="file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label
              htmlFor="import-spreadsheet-file"
              className="flex h-10 min-w-0 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 text-sm"
            >
              <span className="shrink-0 font-medium">Escolher Arquivo</span>
              <span className="min-w-0 truncate text-muted">
                {selectedFileName ||
                  "Nenhum arquivo selecionado. Clique aqui para selecionar um arquivo."}
              </span>
            </label>
            <button
              disabled={isReading || missingRequiredFields.length > 0}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Upload size={16} aria-hidden />
              Carregar Planilha
            </button>
          </span>
          <span className="text-xs text-muted">
            XLSX ou CSV do seu dispositivo, com até 10 MB.
          </span>
        </div>

        {previewError && (
          <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {previewError}
          </div>
        )}

        {preview && (
          <div className="grid min-w-0 gap-4 rounded-md border border-border bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <label className="grid min-w-0 flex-1 gap-1 text-sm">
                <span className="font-medium">Modelo de Mapeamento</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => applyTemplate(event.currentTarget.value)}
                  className="h-10 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-sm"
                >
                  <option value={suggestedTemplateId}>Sugestão Automática</option>
                  <option value={systemTemplateId}>
                    {SYSTEM_IMPORT_MAPPING_TEMPLATE_NAME}
                  </option>
                  {parsedTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-1 text-sm lg:w-80">
                <span className="font-medium">Salvar Como Modelo</span>
                <span className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3">
                  <input
                    type="checkbox"
                    checked={shouldSaveTemplate}
                    onChange={(event) =>
                      setShouldSaveTemplate(event.currentTarget.checked)
                    }
                    className="size-4"
                  />
                  <input
                    name="mappingTemplateName"
                    disabled={!shouldSaveTemplate}
                    maxLength={80}
                    placeholder="Nome do modelo"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-45"
                  />
                  <Save size={14} className="text-muted" aria-hidden />
                </span>
              </label>
            </div>

            <div className="min-w-0 overflow-hidden rounded-md border border-border">
              <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="p-3">
                  <p className="text-sm font-semibold">Colunas Encontradas</p>
                  <p className="mt-1 text-xs text-muted">
                    {preview.headers.length} coluna(s) detectada(s).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {preview.headers.map((header) => (
                      <span
                        key={header}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">Atenção</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {missingRequiredFields.length > 0
                      ? `Campo obrigatório sem coluna: ${missingRequiredFields
                          .map((definition) => definition.label)
                          .join(", ")}.`
                      : "O campo obrigatório Empresa/Prospect está mapeado."}
                  </p>
                  {missingMappedHeaders.length > 0 && (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Colunas não usadas podem permanecer assim:{" "}
                      {missingMappedHeaders.slice(0, 6).join(", ")}
                      {missingMappedHeaders.length > 6 ? "..." : ""}.
                    </p>
                  )}
                  {isEmailMapped && (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Se a célula de e-mail tiver mais de um endereço, o xCRM
                      separa os e-mails em contatos para revisão antes da
                      importação definitiva.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[44rem] table-fixed border-separate border-spacing-0 text-left text-xs">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[30%]" />
                  <col className="w-[42%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="border-b border-border px-2 py-2 font-semibold">
                      Campo xCRM
                    </th>
                    <th className="border-b border-border px-2 py-2 font-semibold">
                      Coluna da Planilha
                    </th>
                    <th className="border-b border-border px-2 py-2 font-semibold">
                      Ajuda
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importFieldDefinitions.map((definition) => (
                    <tr key={definition.key}>
                      <td className="border-b border-border px-2 py-2 align-middle">
                        <span className="font-medium">{definition.label}</span>
                        {definition.required && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                            Obrigatório
                          </span>
                        )}
                      </td>
                      <td className="border-b border-border px-2 py-2 align-middle">
                        <select
                          value={mappingFields[definition.key] ?? unmappedValue}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setMappingFields((current) => ({
                              ...current,
                              [definition.key]:
                                value === unmappedValue ? undefined : value,
                            }));
                            setSelectedTemplateId(suggestedTemplateId);
                          }}
                          className="h-9 w-full min-w-0 rounded-md border border-border bg-surface px-2 text-xs"
                        >
                          <option value={unmappedValue}>Não Mapear</option>
                          {preview.headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="break-words border-b border-border px-2 py-2 align-middle leading-5 text-muted">
                        {definition.help}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.rows.length > 0 && (
              <details className="rounded-md border border-border bg-surface px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Prévia das Primeiras Linhas
                </summary>
                <div className="mt-3 max-w-full overflow-x-auto">
                  <table className="w-full min-w-[44rem] table-fixed text-left text-xs">
                    <thead>
                      <tr>
                        {preview.headers.map((header) => (
                          <th
                            key={header}
                            className="truncate border-b border-border px-2 py-2 font-semibold"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {preview.headers.map((header, index) => (
                            <td
                              key={`${header}-${index}`}
                              className="truncate border-b border-border px-2 py-2 text-muted"
                              title={row[index]}
                            >
                              {row[index] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
