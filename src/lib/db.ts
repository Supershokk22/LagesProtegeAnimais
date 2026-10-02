import { PrismaClient } from "@/generated/prisma/client";
import type { RoleKey } from "@/generated/prisma/client";

// Prisma 7 muda o caminho; manter este unico ponto de acesso evita refatorar tudo.
declare global {
  var __lpaPrisma: PrismaClient | undefined;
}

function build(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [{ emit: "event", level: "query" }, "warn", "error"]
        : ["warn", "error"],
    datasources: {
      db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
    },
  });
}

export const prisma: PrismaClient = globalThis.__lpaPrisma ?? build();

if (process.env.NODE_ENV !== "production") globalThis.__lpaPrisma = prisma;

export type { RoleKey };

/**
 * Erro de dominio padronizado. Toda rota de API converte para HTTP via
 * `toHttpError` em src/lib/api/error.ts.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}