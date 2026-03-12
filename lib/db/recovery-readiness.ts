import "server-only";

export const recoveryReadinessStates = ["ready", "degraded", "blocked"] as const;
export type RecoveryReadinessState = (typeof recoveryReadinessStates)[number];

export const recoveryReadinessReasonCodes = [
  "ready",
  "backup_missing",
  "backup_stale",
  "restore_rehearsal_missing",
  "restore_rehearsal_stale",
  "restore_rehearsal_partial",
  "restore_rehearsal_failed",
] as const;
export type RecoveryReadinessReasonCode = (typeof recoveryReadinessReasonCodes)[number];

export const restoreRehearsalStatuses = ["succeeded", "partial", "failed"] as const;
export type RestoreRehearsalStatus = (typeof restoreRehearsalStatuses)[number];

export interface RecoveryBackupArtifactRecord {
  id: string;
  artifactKey: string;
  summary: string;
  artifactRef?: string | null;
  coverageScope?: string | null;
  completedAt: Date;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface RestoreRehearsalRecord {
  id: string;
  backupArtifactId?: string | null;
  status: RestoreRehearsalStatus;
  summary: string;
  notes?: string | null;
  actorId?: string | null;
  requestId?: string | null;
  rehearsedAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface RecoveryReadinessPolicy {
  backupMaxAgeHours: number;
  restoreMaxAgeHours: number;
}

export interface RecoveryReadinessRecord {
  state: RecoveryReadinessState;
  reasonCode: RecoveryReadinessReasonCode;
  summary: string;
  checkedAt: Date;
  backupArtifact: RecoveryBackupArtifactRecord | null;
  latestRestoreRehearsal: RestoreRehearsalRecord | null;
  policy: RecoveryReadinessPolicy;
  contributingReasonCodes: RecoveryReadinessReasonCode[];
  backupAgeHours?: number | null;
  restoreAgeHours?: number | null;
}

export interface BuildRecoveryReadinessRecordInput {
  checkedAt?: Date;
  policy?: Partial<RecoveryReadinessPolicy>;
  backupArtifact?: RecoveryBackupArtifactRecord | null;
  latestRestoreRehearsal?: RestoreRehearsalRecord | null;
}

const defaultPolicy: RecoveryReadinessPolicy = {
  backupMaxAgeHours: 48,
  restoreMaxAgeHours: 24 * 14,
};

function withFixed(value: number): number {
  return Number(value.toFixed(2));
}

function ageHours(checkedAt: Date, observedAt: Date): number {
  return withFixed((checkedAt.getTime() - observedAt.getTime()) / (1000 * 60 * 60));
}

function buildSummary(
  state: RecoveryReadinessState,
  reasonCode: RecoveryReadinessReasonCode,
  contributingReasonCodes: RecoveryReadinessReasonCode[],
): string {
  if (state === "ready") {
    return "Recovery readiness is healthy. Backup freshness and restore rehearsal checks are within policy.";
  }

  const reasonText = contributingReasonCodes
    .filter((code) => code !== "ready")
    .map((code) => {
      switch (code) {
        case "backup_missing":
          return "No backup artifact has been recorded.";
        case "backup_stale":
          return "The latest recorded backup artifact is stale.";
        case "restore_rehearsal_missing":
          return "No restore rehearsal has been recorded.";
        case "restore_rehearsal_stale":
          return "The latest restore rehearsal is stale.";
        case "restore_rehearsal_partial":
          return "The latest restore rehearsal completed only partially.";
        case "restore_rehearsal_failed":
          return "The latest restore rehearsal failed.";
        default:
          return "Recovery readiness is not healthy.";
      }
    });

  if (reasonText.length === 0) {
    return state === "blocked"
      ? "Recovery readiness is blocked."
      : "Recovery readiness is degraded.";
  }

  const prefix = reasonCode === "backup_missing" || reasonCode === "restore_rehearsal_missing" || reasonCode === "restore_rehearsal_failed"
    ? "Recovery readiness is blocked."
    : "Recovery readiness is degraded.";

  return `${prefix} ${reasonText.join(" ")}`.trim();
}

function dedupeReasonCodes(reasonCodes: RecoveryReadinessReasonCode[]): RecoveryReadinessReasonCode[] {
  return [...new Set(reasonCodes)];
}

function classifyReadiness(
  checkedAt: Date,
  policy: RecoveryReadinessPolicy,
  backupArtifact: RecoveryBackupArtifactRecord | null,
  latestRestoreRehearsal: RestoreRehearsalRecord | null,
): Pick<
  RecoveryReadinessRecord,
  "state" | "reasonCode" | "contributingReasonCodes" | "backupAgeHours" | "restoreAgeHours"
> {
  const backupAge = backupArtifact ? ageHours(checkedAt, backupArtifact.completedAt) : null;
  const restoreAge = latestRestoreRehearsal ? ageHours(checkedAt, latestRestoreRehearsal.rehearsedAt) : null;

  const blockedReasons: RecoveryReadinessReasonCode[] = [];
  const degradedReasons: RecoveryReadinessReasonCode[] = [];

  if (!backupArtifact) {
    blockedReasons.push("backup_missing");
  } else if (backupAge !== null && backupAge > policy.backupMaxAgeHours) {
    degradedReasons.push("backup_stale");
  }

  if (!latestRestoreRehearsal) {
    blockedReasons.push("restore_rehearsal_missing");
  } else {
    if (latestRestoreRehearsal.status === "failed") {
      blockedReasons.push("restore_rehearsal_failed");
    } else if (latestRestoreRehearsal.status === "partial") {
      degradedReasons.push("restore_rehearsal_partial");
    }

    if (restoreAge !== null && restoreAge > policy.restoreMaxAgeHours) {
      degradedReasons.push("restore_rehearsal_stale");
    }
  }

  const contributingReasonCodes = dedupeReasonCodes([...blockedReasons, ...degradedReasons]);

  if (blockedReasons.length > 0) {
    return {
      state: "blocked",
      reasonCode: blockedReasons[0]!,
      contributingReasonCodes,
      backupAgeHours: backupAge,
      restoreAgeHours: restoreAge,
    };
  }

  if (degradedReasons.length > 0) {
    return {
      state: "degraded",
      reasonCode: degradedReasons[0]!,
      contributingReasonCodes,
      backupAgeHours: backupAge,
      restoreAgeHours: restoreAge,
    };
  }

  return {
    state: "ready",
    reasonCode: "ready",
    contributingReasonCodes: ["ready"],
    backupAgeHours: backupAge,
    restoreAgeHours: restoreAge,
  };
}

export function buildRecoveryReadinessRecord(
  input: BuildRecoveryReadinessRecordInput = {},
): RecoveryReadinessRecord {
  const checkedAt = input.checkedAt ?? new Date();
  const policy: RecoveryReadinessPolicy = {
    ...defaultPolicy,
    ...input.policy,
  };
  const backupArtifact = input.backupArtifact ?? null;
  const latestRestoreRehearsal = input.latestRestoreRehearsal ?? null;

  const readiness = classifyReadiness(checkedAt, policy, backupArtifact, latestRestoreRehearsal);

  return {
    state: readiness.state,
    reasonCode: readiness.reasonCode,
    summary: buildSummary(readiness.state, readiness.reasonCode, readiness.contributingReasonCodes),
    checkedAt,
    backupArtifact,
    latestRestoreRehearsal,
    policy,
    contributingReasonCodes: readiness.contributingReasonCodes,
    backupAgeHours: readiness.backupAgeHours,
    restoreAgeHours: readiness.restoreAgeHours,
  };
}
