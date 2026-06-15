import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const shouldPreferPooledUrl =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const rawConnectionString = shouldPreferPooledUrl
    ? process.env.POSTGRES_PRISMA_URL ??
      process.env.DATABASE_URL ??
      process.env.DIRECT_URL
    : process.env.DIRECT_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error(
      "POSTGRES_PRISMA_URL, DIRECT_URL or DATABASE_URL is not configured.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg(createPgConfig(rawConnectionString)),
  });
}

function createPgConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);

  if (isSupabaseHost(url.hostname)) {
    url.searchParams.delete("sslmode");
    url.searchParams.delete("uselibpqcompat");

    return {
      connectionString: url.toString(),
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  return { connectionString };
}

function isSupabaseHost(hostname: string) {
  return hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.com");
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
