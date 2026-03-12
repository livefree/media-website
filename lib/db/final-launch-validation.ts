import "server-only";

import type { IngestLaunchValidationEvidenceRecord } from "../server/ingest/launch-validation";
import type { MigrationPreflightRecord } from "./migration-safety";
import type { RecoveryReadinessRecord } from "./recovery-readiness";

export const finalLaunchValidationStates = ["ready", "degraded", "blocked"] as const;
export type FinalLaunchValidationState = (typeof finalLaunchValidationStates)[number];

export const finalLaunchValidationDomainKeys = [
  "ingest",
  "catalog_publishing",
  "source_health",
  "admin_access",
  "guardrails",
] as const;
export type FinalLaunchValidationDomainKey = (typeof finalLaunchValidationDomainKeys)[number];

export const finalLaunchValidationReasonCodes = [
  "ready",
  "ingest_validation_blocked",
  "ingest_validation_degraded",
  "catalog_publish_path_missing",
  "catalog_public_read_missing",
  "catalog_detail_missing",
  "source_watch_contract_missing",
  "source_watch_contract_blocked",
  "source_watch_contract_degraded",
  "admin_access_validation_failed",
  "migration_preflight_blocked",
  "recovery_guardrail_blocked",
  "recovery_guardrail_degraded",
] as const;
export type FinalLaunchValidationReasonCode = (typeof finalLaunchValidationReasonCodes)[number];

export type FinalLaunchValidationSourceHealthState = "healthy" | "degraded" | "broken" | "replaced" | "offline";
export type FinalLaunchValidationSourceResolutionReason =
  | "explicit"
  | "fallback_missing"
  | "fallback_unusable"
  | "preferred_healthy"
  | "preferred_degraded"
  | "no_usable_source";

export interface FinalLaunchValidationCatalogEvidence {
  adminPublishedCount: number;
  publicPublishedCount: number;
  sampleMediaPublicId?: string | null;
  sampleMediaTitle?: string | null;
  sampleCanonicalWatchHref?: string | null;
  sampleDetailAvailable: boolean;
  sampleWatchAvailable: boolean;
  sampleSourceResolutionReason?: FinalLaunchValidationSourceResolutionReason | null;
  sampleSelectedResourceHealthState?: FinalLaunchValidationSourceHealthState | null;
}

export interface FinalLaunchValidationHealthEvidence {
  queueFailureCount: number;
  failedQueueFailureCount: number;
  retryingQueueFailureCount: number;
  openRepairCount: number;
  inProgressRepairCount: number;
  waitingProviderRepairCount: number;
}

export interface FinalLaunchValidationAdminAccessEvidence {
  currentActorId?: string | null;
  currentRole?: "viewer" | "operator" | "admin" | null;
  currentSource: "header" | "cookie" | "env" | "missing";
  privilegedSessionValidated: boolean;
  anonymousDenied: boolean;
  viewerDenied: boolean;
  operatorAllowed: boolean;
}

export interface FinalLaunchValidationDomainRecord {
  domain: FinalLaunchValidationDomainKey;
  state: FinalLaunchValidationState;
  reasonCode: FinalLaunchValidationReasonCode;
  summary: string;
  observedAt?: Date | null;
  supportingEvidence: Record<string, unknown>;
}

export interface FinalLaunchValidationRecord {
  state: FinalLaunchValidationState;
  reasonCode: FinalLaunchValidationReasonCode;
  summary: string;
  checkedAt: Date;
  contributingReasonCodes: FinalLaunchValidationReasonCode[];
  ingestValidation: IngestLaunchValidationEvidenceRecord;
  catalogEvidence: FinalLaunchValidationCatalogEvidence;
  healthEvidence: FinalLaunchValidationHealthEvidence;
  adminAccessEvidence: FinalLaunchValidationAdminAccessEvidence;
  migrationPreflight: MigrationPreflightRecord;
  recoveryReadiness: RecoveryReadinessRecord;
  domains: FinalLaunchValidationDomainRecord[];
}

export interface BuildFinalLaunchValidationRecordInput {
  checkedAt?: Date;
  ingestValidation: IngestLaunchValidationEvidenceRecord;
  catalogEvidence: FinalLaunchValidationCatalogEvidence;
  healthEvidence: FinalLaunchValidationHealthEvidence;
  adminAccessEvidence: FinalLaunchValidationAdminAccessEvidence;
  migrationPreflight: MigrationPreflightRecord;
  recoveryReadiness: RecoveryReadinessRecord;
}

function dedupeReasonCodes(reasonCodes: FinalLaunchValidationReasonCode[]): FinalLaunchValidationReasonCode[] {
  return [...new Set(reasonCodes)];
}

function rankState(state: FinalLaunchValidationState): number {
  switch (state) {
    case "blocked":
      return 2;
    case "degraded":
      return 1;
    default:
      return 0;
  }
}

function buildOverallSummary(
  state: FinalLaunchValidationState,
  reasonCodes: FinalLaunchValidationReasonCode[],
): string {
  if (state === "ready") {
    return "Final launch validation is ready across ingest, catalog publishing, source health, admin access, and launch guardrails.";
  }

  const reasonText = reasonCodes
    .filter((code) => code !== "ready")
    .map((code) => {
      switch (code) {
        case "ingest_validation_blocked":
          return "Accepted ingest-lane validation is blocked.";
        case "ingest_validation_degraded":
          return "Accepted ingest-lane validation is degraded.";
        case "catalog_publish_path_missing":
          return "Published catalog evidence is missing.";
        case "catalog_public_read_missing":
          return "Published catalog public reads are not returning launch evidence.";
        case "catalog_detail_missing":
          return "Published catalog detail evidence is missing.";
        case "source_watch_contract_missing":
          return "Published watch-contract evidence is missing.";
        case "source_watch_contract_blocked":
          return "Published watch resolution is blocked.";
        case "source_watch_contract_degraded":
          return "Published watch resolution is degraded.";
        case "admin_access_validation_failed":
          return "Privileged admin access validation is not passing.";
        case "migration_preflight_blocked":
          return "Migration safety preflight is blocking launch.";
        case "recovery_guardrail_blocked":
          return "Recovery guardrails are blocked.";
        case "recovery_guardrail_degraded":
          return "Recovery guardrails are degraded.";
        default:
          return "Final launch validation is not healthy.";
      }
    });

  const prefix = state === "blocked" ? "Final launch validation is blocked." : "Final launch validation is degraded.";
  return `${prefix} ${reasonText.join(" ")}`.trim();
}

function buildIngestDomain(
  ingestValidation: IngestLaunchValidationEvidenceRecord,
): FinalLaunchValidationDomainRecord {
  if (ingestValidation.state === "blocked") {
    return {
      domain: "ingest",
      state: "blocked",
      reasonCode: "ingest_validation_blocked",
      summary: "Accepted provider-lane ingest validation is blocked.",
      observedAt: ingestValidation.checkedAt,
      supportingEvidence: {
        ingestReasonCode: ingestValidation.reasonCode,
        contributingReasonCodes: ingestValidation.contributingReasonCodes,
        acceptedProviderLane: ingestValidation.acceptedProviderLane,
      },
    };
  }

  if (ingestValidation.state === "degraded") {
    return {
      domain: "ingest",
      state: "degraded",
      reasonCode: "ingest_validation_degraded",
      summary: "Accepted provider-lane ingest validation is degraded.",
      observedAt: ingestValidation.checkedAt,
      supportingEvidence: {
        ingestReasonCode: ingestValidation.reasonCode,
        contributingReasonCodes: ingestValidation.contributingReasonCodes,
        acceptedProviderLane: ingestValidation.acceptedProviderLane,
      },
    };
  }

  return {
    domain: "ingest",
    state: "ready",
    reasonCode: "ready",
    summary: "Accepted provider-lane ingest validation is ready.",
    observedAt: ingestValidation.checkedAt,
    supportingEvidence: {
      ingestReasonCode: ingestValidation.reasonCode,
      acceptedProviderLane: ingestValidation.acceptedProviderLane,
    },
  };
}

function buildCatalogDomain(
  catalogEvidence: FinalLaunchValidationCatalogEvidence,
  checkedAt: Date,
): FinalLaunchValidationDomainRecord {
  if (catalogEvidence.adminPublishedCount < 1) {
    return {
      domain: "catalog_publishing",
      state: "blocked",
      reasonCode: "catalog_publish_path_missing",
      summary: "No published catalog records are available to validate launch publishing.",
      observedAt: checkedAt,
      supportingEvidence: {
        adminPublishedCount: catalogEvidence.adminPublishedCount,
        publicPublishedCount: catalogEvidence.publicPublishedCount,
      },
    };
  }

  if (catalogEvidence.publicPublishedCount < 1) {
    return {
      domain: "catalog_publishing",
      state: "blocked",
      reasonCode: "catalog_public_read_missing",
      summary: "Published catalog public reads do not currently expose launch evidence.",
      observedAt: checkedAt,
      supportingEvidence: {
        adminPublishedCount: catalogEvidence.adminPublishedCount,
        publicPublishedCount: catalogEvidence.publicPublishedCount,
      },
    };
  }

  if (!catalogEvidence.sampleDetailAvailable) {
    return {
      domain: "catalog_publishing",
      state: "blocked",
      reasonCode: "catalog_detail_missing",
      summary: "A sampled published catalog title does not resolve through the detail contract.",
      observedAt: checkedAt,
      supportingEvidence: {
        sampleMediaPublicId: catalogEvidence.sampleMediaPublicId ?? null,
        sampleMediaTitle: catalogEvidence.sampleMediaTitle ?? null,
      },
    };
  }

  return {
    domain: "catalog_publishing",
    state: "ready",
    reasonCode: "ready",
    summary: "Published catalog list and detail launch evidence is available.",
    observedAt: checkedAt,
    supportingEvidence: {
      adminPublishedCount: catalogEvidence.adminPublishedCount,
      publicPublishedCount: catalogEvidence.publicPublishedCount,
      sampleMediaPublicId: catalogEvidence.sampleMediaPublicId ?? null,
      sampleMediaTitle: catalogEvidence.sampleMediaTitle ?? null,
      sampleCanonicalWatchHref: catalogEvidence.sampleCanonicalWatchHref ?? null,
    },
  };
}

function buildSourceHealthDomain(
  catalogEvidence: FinalLaunchValidationCatalogEvidence,
  healthEvidence: FinalLaunchValidationHealthEvidence,
  checkedAt: Date,
): FinalLaunchValidationDomainRecord {
  if (!catalogEvidence.sampleWatchAvailable) {
    return {
      domain: "source_health",
      state: "blocked",
      reasonCode: "source_watch_contract_missing",
      summary: "Launch validation could not resolve a published watch contract for the sampled title.",
      observedAt: checkedAt,
      supportingEvidence: {
        sampleMediaPublicId: catalogEvidence.sampleMediaPublicId ?? null,
        queueFailureCount: healthEvidence.queueFailureCount,
        openRepairCount: healthEvidence.openRepairCount,
      },
    };
  }

  if (
    catalogEvidence.sampleSourceResolutionReason === "fallback_missing" ||
    catalogEvidence.sampleSourceResolutionReason === "fallback_unusable" ||
    catalogEvidence.sampleSourceResolutionReason === "no_usable_source" ||
    catalogEvidence.sampleSelectedResourceHealthState === "broken" ||
    catalogEvidence.sampleSelectedResourceHealthState === "offline" ||
    catalogEvidence.sampleSelectedResourceHealthState === "replaced"
  ) {
    return {
      domain: "source_health",
      state: "blocked",
      reasonCode: "source_watch_contract_blocked",
      summary: "Published watch resolution is blocked by unhealthy or unavailable source evidence.",
      observedAt: checkedAt,
      supportingEvidence: {
        sampleSourceResolutionReason: catalogEvidence.sampleSourceResolutionReason ?? null,
        sampleSelectedResourceHealthState: catalogEvidence.sampleSelectedResourceHealthState ?? null,
        queueFailureCount: healthEvidence.queueFailureCount,
        openRepairCount: healthEvidence.openRepairCount,
      },
    };
  }

  if (
    catalogEvidence.sampleSourceResolutionReason === "preferred_degraded" ||
    catalogEvidence.sampleSelectedResourceHealthState === "degraded" ||
    healthEvidence.openRepairCount > 0
  ) {
    return {
      domain: "source_health",
      state: "degraded",
      reasonCode: "source_watch_contract_degraded",
      summary: "Published watch resolution is available, but source health evidence is degraded.",
      observedAt: checkedAt,
      supportingEvidence: {
        sampleSourceResolutionReason: catalogEvidence.sampleSourceResolutionReason ?? null,
        sampleSelectedResourceHealthState: catalogEvidence.sampleSelectedResourceHealthState ?? null,
        queueFailureCount: healthEvidence.queueFailureCount,
        openRepairCount: healthEvidence.openRepairCount,
        inProgressRepairCount: healthEvidence.inProgressRepairCount,
        waitingProviderRepairCount: healthEvidence.waitingProviderRepairCount,
      },
    };
  }

  return {
    domain: "source_health",
    state: "ready",
    reasonCode: "ready",
    summary: "Published watch resolution and operator source-health guardrails are healthy.",
    observedAt: checkedAt,
    supportingEvidence: {
      sampleSourceResolutionReason: catalogEvidence.sampleSourceResolutionReason ?? null,
      sampleSelectedResourceHealthState: catalogEvidence.sampleSelectedResourceHealthState ?? null,
      queueFailureCount: healthEvidence.queueFailureCount,
      openRepairCount: healthEvidence.openRepairCount,
    },
  };
}

function buildAdminAccessDomain(
  adminAccessEvidence: FinalLaunchValidationAdminAccessEvidence,
  checkedAt: Date,
): FinalLaunchValidationDomainRecord {
  if (
    !adminAccessEvidence.privilegedSessionValidated ||
    !adminAccessEvidence.anonymousDenied ||
    !adminAccessEvidence.viewerDenied ||
    !adminAccessEvidence.operatorAllowed
  ) {
    return {
      domain: "admin_access",
      state: "blocked",
      reasonCode: "admin_access_validation_failed",
      summary: "Privileged admin access validation is not passing for the accepted operator boundary.",
      observedAt: checkedAt,
      supportingEvidence: {
        currentActorId: adminAccessEvidence.currentActorId ?? null,
        currentRole: adminAccessEvidence.currentRole ?? null,
        currentSource: adminAccessEvidence.currentSource,
        privilegedSessionValidated: adminAccessEvidence.privilegedSessionValidated,
        anonymousDenied: adminAccessEvidence.anonymousDenied,
        viewerDenied: adminAccessEvidence.viewerDenied,
        operatorAllowed: adminAccessEvidence.operatorAllowed,
      },
    };
  }

  return {
    domain: "admin_access",
    state: "ready",
    reasonCode: "ready",
    summary: "Privileged admin access validation is passing for operator surfaces.",
    observedAt: checkedAt,
    supportingEvidence: {
      currentActorId: adminAccessEvidence.currentActorId ?? null,
      currentRole: adminAccessEvidence.currentRole ?? null,
      currentSource: adminAccessEvidence.currentSource,
    },
  };
}

function buildGuardrailsDomain(
  migrationPreflight: MigrationPreflightRecord,
  recoveryReadiness: RecoveryReadinessRecord,
): FinalLaunchValidationDomainRecord {
  if (migrationPreflight.status === "blocked") {
    return {
      domain: "guardrails",
      state: "blocked",
      reasonCode: "migration_preflight_blocked",
      summary: "Migration safety preflight is blocking the published catalog runtime.",
      observedAt: migrationPreflight.checkedAt,
      supportingEvidence: {
        migrationStatus: migrationPreflight.status,
        migrationReasonCode: migrationPreflight.reasonCode,
        expectedSchemaDigest: migrationPreflight.expectedSchemaDigest,
      },
    };
  }

  if (recoveryReadiness.state === "blocked") {
    return {
      domain: "guardrails",
      state: "blocked",
      reasonCode: "recovery_guardrail_blocked",
      summary: "Recovery readiness is blocked for final launch validation.",
      observedAt: recoveryReadiness.checkedAt,
      supportingEvidence: {
        recoveryState: recoveryReadiness.state,
        recoveryReasonCode: recoveryReadiness.reasonCode,
        contributingReasonCodes: recoveryReadiness.contributingReasonCodes,
      },
    };
  }

  if (recoveryReadiness.state === "degraded") {
    return {
      domain: "guardrails",
      state: "degraded",
      reasonCode: "recovery_guardrail_degraded",
      summary: "Recovery readiness is degraded for final launch validation.",
      observedAt: recoveryReadiness.checkedAt,
      supportingEvidence: {
        recoveryState: recoveryReadiness.state,
        recoveryReasonCode: recoveryReadiness.reasonCode,
        contributingReasonCodes: recoveryReadiness.contributingReasonCodes,
      },
    };
  }

  return {
    domain: "guardrails",
    state: "ready",
    reasonCode: "ready",
    summary: "Migration safety and recovery guardrails are ready for launch validation.",
    observedAt: recoveryReadiness.checkedAt,
    supportingEvidence: {
      migrationStatus: migrationPreflight.status,
      migrationReasonCode: migrationPreflight.reasonCode,
      recoveryState: recoveryReadiness.state,
      recoveryReasonCode: recoveryReadiness.reasonCode,
    },
  };
}

export function buildFinalLaunchValidationRecord(
  input: BuildFinalLaunchValidationRecordInput,
): FinalLaunchValidationRecord {
  const checkedAt = input.checkedAt ?? new Date();
  const domains = [
    buildIngestDomain(input.ingestValidation),
    buildCatalogDomain(input.catalogEvidence, checkedAt),
    buildSourceHealthDomain(input.catalogEvidence, input.healthEvidence, checkedAt),
    buildAdminAccessDomain(input.adminAccessEvidence, checkedAt),
    buildGuardrailsDomain(input.migrationPreflight, input.recoveryReadiness),
  ];

  const blockedDomain = domains.find((domain) => domain.state === "blocked");
  const degradedDomain = domains.find((domain) => domain.state === "degraded");
  const topDomain = blockedDomain ?? degradedDomain ?? domains[0];
  const state = topDomain?.state ?? "ready";
  const reasonCode = topDomain?.reasonCode ?? "ready";
  const contributingReasonCodes = dedupeReasonCodes(
    domains
      .filter((domain) => rankState(domain.state) > 0)
      .map((domain) => domain.reasonCode),
  );

  return {
    state,
    reasonCode,
    summary: buildOverallSummary(state, contributingReasonCodes.length > 0 ? contributingReasonCodes : ["ready"]),
    checkedAt,
    contributingReasonCodes: contributingReasonCodes.length > 0 ? contributingReasonCodes : ["ready"],
    ingestValidation: input.ingestValidation,
    catalogEvidence: input.catalogEvidence,
    healthEvidence: input.healthEvidence,
    adminAccessEvidence: input.adminAccessEvidence,
    migrationPreflight: input.migrationPreflight,
    recoveryReadiness: input.recoveryReadiness,
    domains,
  };
}
