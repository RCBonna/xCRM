import { readFile } from "fs/promises";
import path from "path";

type ImportSettings = {
  spreadsheetImportPath: string;
  allowedExtensions: string[];
  singleActiveImportPerTenant: boolean;
  aiAssistedNormalization: {
    enabled: boolean;
    mode: string;
  };
};

const fallbackSettings: ImportSettings = {
  spreadsheetImportPath: "C:\\Users\\rcbon\\OneDrive\\Apps\\Importar\\xCRM",
  allowedExtensions: [".xlsx", ".csv"],
  singleActiveImportPerTenant: true,
  aiAssistedNormalization: {
    enabled: true,
    mode: "heuristic-until-provider-configured",
  },
};

export async function getImportSettings() {
  const settingsPath = path.join(process.cwd(), "config", "import-settings.json");

  try {
    const rawSettings = await readFile(settingsPath, "utf8");
    const parsedSettings = JSON.parse(rawSettings) as Partial<ImportSettings>;

    return {
      ...fallbackSettings,
      ...parsedSettings,
      aiAssistedNormalization: {
        ...fallbackSettings.aiAssistedNormalization,
        ...parsedSettings.aiAssistedNormalization,
      },
    };
  } catch {
    return fallbackSettings;
  }
}
