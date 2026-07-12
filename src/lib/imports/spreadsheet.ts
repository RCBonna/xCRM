import path from "path";
import { readSheet } from "read-excel-file/node";

export type UploadedImportFile = {
  fileName: string;
  extension: string;
  content: Buffer;
};

export type RawSpreadsheetRow = {
  rowNumber: number;
  values: Record<string, string>;
};

const expectedHeaderTerms = [
  "empresa",
  "cliente",
  "contato",
  "cidade",
  "uf",
  "estado",
  "e-mail",
  "email",
  "fone",
  "telefone",
  "endereco",
  "endereço",
  "site",
  "fornecedor",
  "acao",
  "ação",
];

function cellToText(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value ?? "").trim();
}

function parseCsvLine(line: string, separator: string) {
  const cells: string[] = [];
  let currentCell = "";
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === separator && !isQuoted) {
      cells.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  cells.push(currentCell.trim());

  return cells;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getHeaderScore(row: unknown[]) {
  const normalizedCells = row.map((cell) => normalizeHeader(cellToText(cell)));

  return normalizedCells.filter((cell) =>
    expectedHeaderTerms.some((term) => cell === normalizeHeader(term)),
  ).length;
}

function findHeaderRowIndex(matrix: unknown[][]) {
  let bestIndex = 0;
  let bestScore = 0;

  matrix.forEach((row, index) => {
    const score = getHeaderScore(row);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore >= 2 ? bestIndex : 0;
}

function rowsFromMatrix(matrix: unknown[][]) {
  const headerRowIndex = findHeaderRowIndex(matrix);
  const headerRow = matrix[headerRowIndex];
  const dataRows = matrix.slice(headerRowIndex + 1);

  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map(cellToText);

  return dataRows
    .map((row, index): RawSpreadsheetRow => {
      const values = Object.fromEntries(
        headers
          .map((header, headerIndex) => [
            header,
            cellToText(row[headerIndex]),
          ])
          .filter(([header]) => header.length > 0),
      );

      return {
        rowNumber: headerRowIndex + index + 2,
        values,
      };
    })
    .filter((row) =>
      Object.values(row.values).some((value) => value.trim().length > 0),
    );
}

export function getUploadedFileMetadata(file: File): UploadedImportFile | null {
  const fileName = path.basename(file.name).trim();
  const extension = path.extname(fileName).toLowerCase();

  if (!fileName || !new Set([".xlsx", ".csv"]).has(extension)) {
    return null;
  }

  return {
    fileName,
    extension,
    content: Buffer.alloc(0),
  };
}

export async function readUploadedSpreadsheetRows(file: UploadedImportFile) {
  if (file.extension === ".csv") {
    const content = file.content.toString("utf8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const separator =
      (lines[0]?.match(/;/g)?.length ?? 0) > (lines[0]?.match(/,/g)?.length ?? 0)
        ? ";"
        : ",";

    return rowsFromMatrix(lines.map((line) => parseCsvLine(line, separator)));
  }

  const rows = await readSheet(file.content, 1);

  return rowsFromMatrix(rows);
}
