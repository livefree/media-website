import "server-only";

import { z } from "zod";

import type { BackendLogLevel } from "../../../types/backend";

const logLevels = ["debug", "info", "warn", "error"] as const satisfies readonly BackendLogLevel[];

const serverRuntimeConfigSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(logLevels).default("info"),
});

export type ServerRuntimeConfig = {
  appEnv: "development" | "test" | "production";
  nodeEnv: "development" | "test" | "production";
  databaseUrl?: string;
  redisUrl?: string;
  logLevel: BackendLogLevel;
};

let cachedConfig: ServerRuntimeConfig | undefined;

export function getServerRuntimeConfig(): ServerRuntimeConfig {
  if (!cachedConfig) {
    const parsed = serverRuntimeConfigSchema.parse({
      APP_ENV: process.env.APP_ENV,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: process.env.LOG_LEVEL,
    });

    cachedConfig = {
      appEnv: parsed.APP_ENV,
      nodeEnv: parsed.NODE_ENV,
      databaseUrl: parsed.DATABASE_URL,
      redisUrl: parsed.REDIS_URL,
      logLevel: parsed.LOG_LEVEL,
    };
  }

  return cachedConfig;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getServerRuntimeConfig().databaseUrl?.trim());
}

export function getDatabaseUrl(): string | undefined {
  return getServerRuntimeConfig().databaseUrl;
}

export function requireDatabaseUrl(): string {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  return databaseUrl;
}

export function getRedisUrl(): string | undefined {
  return getServerRuntimeConfig().redisUrl;
}
