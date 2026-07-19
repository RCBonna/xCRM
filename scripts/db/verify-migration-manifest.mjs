import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..", "..");
const manifestPath = join(scriptDirectory, "migration-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const errors = [];

function normalizePath(filePath) {
  return filePath.split(sep).join("/");
}

function listSqlFiles(directory) {
  const absoluteDirectory = join(projectRoot, directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
    .map((entry) => normalizePath(relative(projectRoot, join(absoluteDirectory, entry.name))));
}

const declared = manifest.migrations;
const discovered = [
  ...listSqlFiles("supabase/migrations"),
  ...listSqlFiles("prisma"),
].sort();
const declaredSet = new Set(declared);

if (declaredSet.size !== declared.length) {
  errors.push("O manifesto possui migrations duplicadas.");
}

for (const migrationPath of declared) {
  const absolutePath = join(projectRoot, migrationPath);
  const timestamp = /^\d{14}/.exec(migrationPath.split("/").at(-1) ?? "")?.[0];

  if (!timestamp) {
    errors.push(`Migration sem timestamp de 14 digitos: ${migrationPath}`);
  }

  if (!existsSync(absolutePath)) {
    errors.push(`Migration declarada nao encontrada: ${migrationPath}`);
  } else if (readFileSync(absolutePath, "utf8").trim().length === 0) {
    errors.push(`Migration vazia: ${migrationPath}`);
  }
}

for (let index = 1; index < declared.length; index += 1) {
  const previous = declared[index - 1].split("/").at(-1) ?? "";
  const current = declared[index].split("/").at(-1) ?? "";

  if (previous.localeCompare(current) >= 0) {
    errors.push(`Ordem cronologica invalida entre ${previous} e ${current}.`);
  }
}

for (const migrationPath of discovered) {
  if (!declaredSet.has(migrationPath)) {
    errors.push(`Migration SQL fora do manifesto: ${migrationPath}`);
  }
}

for (const migrationPath of declared) {
  if (!discovered.includes(migrationPath)) {
    errors.push(`Entrada do manifesto nao corresponde ao inventario SQL: ${migrationPath}`);
  }
}

if (!existsSync(join(projectRoot, "supabase", "seed.sql"))) {
  errors.push("supabase/config.toml habilita seed, mas supabase/seed.sql nao existe.");
}

if (errors.length > 0) {
  console.error("Falha na verificacao do manifesto de migrations:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Manifesto valido: ${declared.length} migrations SQL em ordem cronologica.`);
console.log("Seed do Supabase localizado.");
