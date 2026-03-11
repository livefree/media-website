import "server-only";

import { PrismaClient } from "@prisma/client";

import { getServerRuntimeConfig, isDatabaseConfigured } from "../server/config";
import { requireDatabaseUrl } from "../server/config";
import { BackendError } from "../server/errors";
import { logger } from "../server/logging";

declare global {
  var __mediaAtlasPrisma__: PrismaClient | undefined;
}

const dbLogger = logger.child({ subsystem: "db.client" });

function createPrismaClient(): PrismaClient {
  const config = getServerRuntimeConfig();
  requireDatabaseUrl();

  dbLogger.info("Initializing Prisma client", {
    nodeEnv: config.nodeEnv,
    databaseConfigured: true,
  });

  return new PrismaClient({
    log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getDb(): PrismaClient | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalThis.__mediaAtlasPrisma__) {
    globalThis.__mediaAtlasPrisma__ = createPrismaClient();
  }

  return globalThis.__mediaAtlasPrisma__;
}

export function requireDb(): PrismaClient {
  const db = getDb();

  if (!db) {
    throw new BackendError("Database access requested before DATABASE_URL was configured.", {
      status: 500,
      code: "database_not_configured",
    });
  }

  return db;
}
