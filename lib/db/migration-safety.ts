import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { BackendError } from "../server/errors";

export const migrationGuardTargets = ["published_catalog_runtime"] as const;
export type MigrationGuardTarget = (typeof migrationGuardTargets)[number];

export const migrationRolloutStates = ["pending", "ready", "blocked"] as const;
export type MigrationRolloutState = (typeof migrationRolloutStates)[number];

export const migrationPreflightStatuses = ["ready", "blocked"] as const;
export type MigrationPreflightStatus = (typeof migrationPreflightStatuses)[number];

export type MigrationPreflightReasonCode =
  | "ready"
  | "metadata_missing"
  | "metadata_unavailable"
  | "schema_digest_mismatch"
  | "rollout_pending"
  | "rollout_blocked";

export interface RuntimeMigrationStateRecord {
  target: MigrationGuardTarget;
  schemaDigest: string;
  rolloutState: MigrationRolloutState;
  summary?: string | null;
  updatedBy?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MigrationPreflightRecord {
  target: MigrationGuardTarget;
  status: MigrationPreflightStatus;
  reasonCode: MigrationPreflightReasonCode;
  summary: string;
  expectedSchemaDigest: string;
  checkedAt: Date;
  metadata?: RuntimeMigrationStateRecord | null;
}

export interface MigrationPreflightDependencies {
  loadRuntimeState?: (target: MigrationGuardTarget) => Promise<RuntimeMigrationStateRecord | null>;
  schemaText?: string;
  now?: Date;
}

function mapRolloutState(value: string): MigrationRolloutState {
  switch (value) {
    case "PENDING":
      return "pending";
    case "READY":
      return "ready";
    case "BLOCKED":
      return "blocked";
    default:
      throw new BackendError(`Unsupported migration rollout state '${value}'.`, {
        status: 500,
        code: "migration_rollout_state_invalid",
      });
  }
}

function isRuntimeMigrationMetadataUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (((error as { code?: unknown }).code === "P2021") || ((error as { code?: unknown }).code === "P2022"))
  );
}

function computeSchemaDigest(schemaText: string): string {
  return createHash("sha256").update(schemaText).digest("hex");
}

async function readSchemaText(): Promise<string> {
  return readFile(path.resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
}

async function loadRuntimeMigrationState(target: MigrationGuardTarget): Promise<RuntimeMigrationStateRecord | null> {
  try {
    const { requireDb } = await import("./client");
    const record = await requireDb().runtimeMigrationState.findUnique({
      where: {
        target,
      },
    });

    if (!record) {
      return null;
    }

    return {
      target: record.target as MigrationGuardTarget,
      schemaDigest: record.schemaDigest,
      rolloutState: mapRolloutState(record.rolloutState),
      summary: record.summary,
      updatedBy: record.updatedBy,
      metadata: (record.metadata as Record<string, unknown> | null) ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } catch (error) {
    if (isRuntimeMigrationMetadataUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

function buildBlockedPreflight(
  input: Omit<MigrationPreflightRecord, "status">,
): MigrationPreflightRecord {
  return {
    ...input,
    status: "blocked",
  };
}

function toPreflightDetails(preflight: MigrationPreflightRecord): Record<string, unknown> {
  return {
    target: preflight.target,
    status: preflight.status,
    reasonCode: preflight.reasonCode,
    summary: preflight.summary,
    expectedSchemaDigest: preflight.expectedSchemaDigest,
    checkedAt: preflight.checkedAt.toISOString(),
    metadata: preflight.metadata
      ? {
          ...preflight.metadata,
          createdAt: preflight.metadata.createdAt.toISOString(),
          updatedAt: preflight.metadata.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function getMigrationPreflightRecord(
  target: MigrationGuardTarget = "published_catalog_runtime",
  dependencies: MigrationPreflightDependencies = {},
): Promise<MigrationPreflightRecord> {
  const checkedAt = dependencies.now ?? new Date();
  const schemaText = dependencies.schemaText ?? (await readSchemaText());
  const expectedSchemaDigest = computeSchemaDigest(schemaText);
  const loadState = dependencies.loadRuntimeState ?? loadRuntimeMigrationState;

  let metadata: RuntimeMigrationStateRecord | null = null;

  try {
    metadata = await loadState(target);
  } catch {
    return buildBlockedPreflight({
      target,
      reasonCode: "metadata_unavailable",
      summary: "Migration metadata could not be read from the runtime database.",
      expectedSchemaDigest,
      checkedAt,
      metadata: null,
    });
  }

  if (!metadata) {
    return buildBlockedPreflight({
      target,
      reasonCode: "metadata_missing",
      summary: "Migration metadata is missing for the guarded runtime target.",
      expectedSchemaDigest,
      checkedAt,
      metadata: null,
    });
  }

  if (metadata.rolloutState === "blocked") {
    return buildBlockedPreflight({
      target,
      reasonCode: "rollout_blocked",
      summary: metadata.summary ?? "Migration rollout is explicitly blocked for this runtime target.",
      expectedSchemaDigest,
      checkedAt,
      metadata,
    });
  }

  if (metadata.rolloutState === "pending") {
    return buildBlockedPreflight({
      target,
      reasonCode: "rollout_pending",
      summary: metadata.summary ?? "Migration rollout is not marked ready for this runtime target.",
      expectedSchemaDigest,
      checkedAt,
      metadata,
    });
  }

  if (metadata.schemaDigest !== expectedSchemaDigest) {
    return buildBlockedPreflight({
      target,
      reasonCode: "schema_digest_mismatch",
      summary: "Runtime schema digest does not match the checked-in Prisma schema.",
      expectedSchemaDigest,
      checkedAt,
      metadata,
    });
  }

  return {
    target,
    status: "ready",
    reasonCode: "ready",
    summary: metadata.summary ?? "Migration preflight passed for the guarded runtime target.",
    expectedSchemaDigest,
    checkedAt,
    metadata,
  };
}

export async function assertMigrationPreflightReady(
  target: MigrationGuardTarget = "published_catalog_runtime",
  dependencies: MigrationPreflightDependencies = {},
): Promise<MigrationPreflightRecord> {
  const preflight = await getMigrationPreflightRecord(target, dependencies);

  if (preflight.status !== "ready") {
    throw new BackendError("Backend runtime is blocked by migration safety preflight.", {
      status: 503,
      code: "migration_preflight_blocked",
      details: toPreflightDetails(preflight),
    });
  }

  return preflight;
}
