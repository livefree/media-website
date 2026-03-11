import "server-only";

import { getServerRuntimeConfig } from "../config";

import type { BackendLogLevel } from "../../../types/backend";

type LogValue = boolean | number | string | null | undefined;
type LogBindings = Record<string, LogValue>;
type LogData = Record<string, unknown> | undefined;

const levelWeight: Record<BackendLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: BackendLogLevel): boolean {
  return levelWeight[level] >= levelWeight[getServerRuntimeConfig().logLevel];
}

function writeLog(level: BackendLogLevel, bindings: LogBindings, message: string, data?: LogData) {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...bindings,
    ...(data ? { data } : {}),
  };
  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export interface ServerLogger {
  child(bindings: LogBindings): ServerLogger;
  debug(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, data?: LogData): void;
}

export function createServerLogger(bindings: LogBindings = {}): ServerLogger {
  return {
    child(childBindings) {
      return createServerLogger({ ...bindings, ...childBindings });
    },
    debug(message, data) {
      writeLog("debug", bindings, message, data);
    },
    info(message, data) {
      writeLog("info", bindings, message, data);
    },
    warn(message, data) {
      writeLog("warn", bindings, message, data);
    },
    error(message, data) {
      writeLog("error", bindings, message, data);
    },
  };
}

export const logger = createServerLogger({ runtime: "monolith" });
