import "server-only";

import { PrismaClient } from "@prisma/client";

import { isDatabaseConfigured } from "../config/env";

declare global {
  var __mediaAtlasPrisma__: PrismaClient | undefined;
}

export function getDb(): PrismaClient | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalThis.__mediaAtlasPrisma__) {
    globalThis.__mediaAtlasPrisma__ = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalThis.__mediaAtlasPrisma__;
}
