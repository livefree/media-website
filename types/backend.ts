export type BackendModuleId =
  | "config"
  | "provider"
  | "ingest"
  | "normalize"
  | "review"
  | "catalog"
  | "source"
  | "health"
  | "search"
  | "admin";

export type BackendLogLevel = "debug" | "info" | "warn" | "error";

export interface BackendModuleBoundary {
  id: BackendModuleId;
  description: string;
  owns: string[];
  dependsOn: BackendModuleId[];
}

export interface RequestContextMetadata {
  actorId?: string;
  requestId?: string;
}

export interface TransactionBoundaryOptions {
  name: string;
  timeoutMs?: number;
  maxWaitMs?: number;
}
