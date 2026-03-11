import "server-only";

import { createRequire } from "node:module";

import type { PrismaClient as PrismaClientType } from "@prisma/client";

import { getServerRuntimeConfig, isDatabaseConfigured } from "../server/config";
import { requireDatabaseUrl } from "../server/config";
import { BackendError } from "../server/errors";
import { logger } from "../server/logging";

declare global {
  var __mediaAtlasPrisma__: PrismaClientType | undefined;
}

const require = createRequire(import.meta.url);
const dbLogger = logger.child({ subsystem: "db.client" });

function getPrismaClientConstructor() {
  const prismaClientPackage = require("@prisma/client") as typeof import("@prisma/client");
  return prismaClientPackage.PrismaClient;
}

function createPrismaClient(): PrismaClientType {
  const config = getServerRuntimeConfig();
  requireDatabaseUrl();

  dbLogger.info("Initializing Prisma client", {
    nodeEnv: config.nodeEnv,
    databaseConfigured: true,
  });

  const PrismaClient = getPrismaClientConstructor();

  return new PrismaClient({
    log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getDb(): PrismaClientType | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalThis.__mediaAtlasPrisma__) {
    globalThis.__mediaAtlasPrisma__ = createPrismaClient();
  }

  return globalThis.__mediaAtlasPrisma__;
}

export function requireDb(): PrismaClientType {
  const db = getDb();

  if (!db) {
    throw new BackendError("Database access requested before DATABASE_URL was configured.", {
      status: 500,
      code: "database_not_configured",
    });
  }

  return db;
}
