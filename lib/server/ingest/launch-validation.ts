import "server-only";

import type { QueueFailureAlertSignal } from "../health";
import type { SourceHealthState } from "../provider";

export const ingestLaunchValidationStates = ["ready", "degraded", "blocked"] as const;
export type IngestLaunchValidationState = (typeof ingestLaunchValidationStates)[number];

export const ingestLaunchValidationReasonCodes = [
  "ready",
  "accepted_provider_lane_missing",
  "provider_execution_missing",
  "provider_execution_stale",
  "scheduled_execution_missing",
  "scheduled_execution_stale",
  "queue_operator_action_required",
  "queue_retrying",
  "probe_evidence_missing",
  "probe_health_degraded",
  "probe_health_blocked",
  "repair_queue_open",
] as const;
export type IngestLaunchValidationReasonCode = (typeof ingestLaunchValidationReasonCodes)[number];

export const ingestLaunchValidationDomainKeys = [
  "provider_lane",
  "scheduled_execution",
  "queue_telemetry",
  "probe_recovery",
] as const;
export type IngestLaunchValidationDomainKey = (typeof ingestLaunchValidationDomainKeys)[number];

export interface IngestLaunchValidationPolicy {
  providerExecutionMaxAgeHours: number;
  scheduledExecutionMaxAgeHours: number;
  probeEvidenceMaxAgeHours: number;
}

export interface IngestLaunchValidationAcceptedProviderLane {
  providerKey: string;
  adapterKey: string;
  displayName: string;
  accepted: boolean;
}

export interface IngestLaunchValidationProviderExecutionEvidence {
  lastSuccessfulPageIngestAt?: Date | null;
}

export interface IngestLaunchValidationScheduleEvidence {
  enabled: boolean;
  lastIncrementalCompletedAt?: Date | null;
  lastBackfillCompletedAt?: Date | null;
  nextIncrementalAt?: Date | null;
  nextBackfillAt?: Date | null;
}

export interface IngestLaunchValidationQueueFailureEvidence {
  jobType: "provider_page_ingest" | "scheduled_source_refresh" | "scheduled_source_probe";
  alertSignal?: QueueFailureAlertSignal | null;
  lastErrorSummary?: string | null;
}

export interface IngestLaunchValidationProbeRecoveryEvidence {
  latestRefreshObservedAt?: Date | null;
  latestRefreshObservedState?: SourceHealthState | null;
  latestProbeObservedAt?: Date | null;
  latestProbeObservedState?: SourceHealthState | null;
  openRepairCount: number;
}

export interface BuildIngestLaunchValidationEvidenceInput {
  checkedAt?: Date;
  policy?: Partial<IngestLaunchValidationPolicy>;
  acceptedProviderLane?: IngestLaunchValidationAcceptedProviderLane | null;
  providerExecution?: IngestLaunchValidationProviderExecutionEvidence | null;
  schedule?: IngestLaunchValidationScheduleEvidence | null;
  queueTelemetry?: {
    failures: IngestLaunchValidationQueueFailureEvidence[];
  } | null;
  probeRecovery?: IngestLaunchValidationProbeRecoveryEvidence | null;
}

export interface IngestLaunchValidationDomainRecord {
  domain: IngestLaunchValidationDomainKey;
  state: IngestLaunchValidationState;
  reasonCode: IngestLaunchValidationReasonCode;
  summary: string;
  observedAt?: Date | null;
  supportingEvidence: Record<string, unknown>;
}

export interface IngestLaunchValidationEvidenceRecord {
  state: IngestLaunchValidationState;
  reasonCode: IngestLaunchValidationReasonCode;
  summary: string;
  checkedAt: Date;
  acceptedProviderLane: IngestLaunchValidationAcceptedProviderLane | null;
  policy: IngestLaunchValidationPolicy;
  contributingReasonCodes: IngestLaunchValidationReasonCode[];
  domains: IngestLaunchValidationDomainRecord[];
}

const defaultPolicy: IngestLaunchValidationPolicy = {
  providerExecutionMaxAgeHours: 24,
  scheduledExecutionMaxAgeHours: 24,
  probeEvidenceMaxAgeHours: 24,
};

function withFixed(value: number): number {
  return Number(value.toFixed(2));
}

function ageHours(checkedAt: Date, observedAt: Date): number {
  return withFixed((checkedAt.getTime() - observedAt.getTime()) / (1000 * 60 * 60));
}

function dedupeReasonCodes(reasonCodes: IngestLaunchValidationReasonCode[]): IngestLaunchValidationReasonCode[] {
  return [...new Set(reasonCodes)];
}

function buildOverallSummary(
  state: IngestLaunchValidationState,
  reasons: IngestLaunchValidationReasonCode[],
): string {
  if (state === "ready") {
    return "Ingest launch validation evidence is healthy across the accepted provider lane, scheduled execution, queue telemetry, and probe recovery.";
  }

  const reasonText = reasons
    .filter((reason) => reason !== "ready")
    .map((reason) => {
      switch (reason) {
        case "accepted_provider_lane_missing":
          return "The accepted provider lane has not been configured.";
        case "provider_execution_missing":
          return "The accepted provider lane has no successful page-ingest evidence.";
        case "provider_execution_stale":
          return "The latest successful page-ingest evidence is stale.";
        case "scheduled_execution_missing":
          return "Scheduled execution has no durable completion evidence.";
        case "scheduled_execution_stale":
          return "Scheduled execution evidence is stale.";
        case "queue_operator_action_required":
          return "Queue telemetry shows an operator-action-required ingest failure.";
        case "queue_retrying":
          return "Queue telemetry shows retrying or degraded ingest failures.";
        case "probe_evidence_missing":
          return "Refresh/probe evidence is missing.";
        case "probe_health_degraded":
          return "Refresh/probe evidence shows degraded source health.";
        case "probe_health_blocked":
          return "Refresh/probe evidence shows blocked source health.";
        case "repair_queue_open":
          return "Repair queue entries remain open for the accepted provider lane.";
        default:
          return "Ingest launch validation evidence is not healthy.";
      }
    });

  const prefix = state === "blocked" ? "Ingest launch validation is blocked." : "Ingest launch validation is degraded.";
  return `${prefix} ${reasonText.join(" ")}`.trim();
}

function buildProviderLaneDomain(
  checkedAt: Date,
  policy: IngestLaunchValidationPolicy,
  acceptedProviderLane: IngestLaunchValidationAcceptedProviderLane | null,
  providerExecution: IngestLaunchValidationProviderExecutionEvidence | null,
): IngestLaunchValidationDomainRecord {
  if (!acceptedProviderLane?.accepted) {
    return {
      domain: "provider_lane",
      state: "blocked",
      reasonCode: "accepted_provider_lane_missing",
      summary: "No accepted provider lane has been configured for launch validation.",
      observedAt: null,
      supportingEvidence: {
        accepted: false,
      },
    };
  }

  const lastSuccessfulPageIngestAt = providerExecution?.lastSuccessfulPageIngestAt ?? null;

  if (!lastSuccessfulPageIngestAt) {
    return {
      domain: "provider_lane",
      state: "blocked",
      reasonCode: "provider_execution_missing",
      summary: "The accepted provider lane has no successful page-ingest execution evidence.",
      observedAt: null,
      supportingEvidence: {
        providerKey: acceptedProviderLane.providerKey,
        adapterKey: acceptedProviderLane.adapterKey,
        displayName: acceptedProviderLane.displayName,
      },
    };
  }

  const executionAgeHours = ageHours(checkedAt, lastSuccessfulPageIngestAt);

  if (executionAgeHours > policy.providerExecutionMaxAgeHours) {
    return {
      domain: "provider_lane",
      state: "degraded",
      reasonCode: "provider_execution_stale",
      summary: "The accepted provider lane has successful page-ingest evidence, but it is stale.",
      observedAt: lastSuccessfulPageIngestAt,
      supportingEvidence: {
        providerKey: acceptedProviderLane.providerKey,
        adapterKey: acceptedProviderLane.adapterKey,
        displayName: acceptedProviderLane.displayName,
        executionAgeHours,
      },
    };
  }

  return {
    domain: "provider_lane",
    state: "ready",
    reasonCode: "ready",
    summary: "The accepted provider lane has recent successful page-ingest evidence.",
    observedAt: lastSuccessfulPageIngestAt,
    supportingEvidence: {
      providerKey: acceptedProviderLane.providerKey,
      adapterKey: acceptedProviderLane.adapterKey,
      displayName: acceptedProviderLane.displayName,
      executionAgeHours,
    },
  };
}

function getLatestScheduledEvidenceAt(
  schedule: IngestLaunchValidationScheduleEvidence | null,
): Date | null {
  if (!schedule) {
    return null;
  }

  return [schedule.lastIncrementalCompletedAt ?? null, schedule.lastBackfillCompletedAt ?? null]
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function buildScheduledExecutionDomain(
  checkedAt: Date,
  policy: IngestLaunchValidationPolicy,
  schedule: IngestLaunchValidationScheduleEvidence | null,
): IngestLaunchValidationDomainRecord {
  if (!schedule?.enabled) {
    return {
      domain: "scheduled_execution",
      state: "blocked",
      reasonCode: "scheduled_execution_missing",
      summary: "Scheduled ingest execution is not enabled for the accepted provider lane.",
      observedAt: null,
      supportingEvidence: {
        enabled: false,
      },
    };
  }

  const latestScheduledEvidenceAt = getLatestScheduledEvidenceAt(schedule);

  if (!latestScheduledEvidenceAt) {
    return {
      domain: "scheduled_execution",
      state: "blocked",
      reasonCode: "scheduled_execution_missing",
      summary: "Scheduled ingest execution has no durable completion evidence yet.",
      observedAt: null,
      supportingEvidence: {
        enabled: true,
        nextIncrementalAt: schedule.nextIncrementalAt?.toISOString() ?? null,
        nextBackfillAt: schedule.nextBackfillAt?.toISOString() ?? null,
      },
    };
  }

  const scheduledAgeHours = ageHours(checkedAt, latestScheduledEvidenceAt);

  if (scheduledAgeHours > policy.scheduledExecutionMaxAgeHours) {
    return {
      domain: "scheduled_execution",
      state: "degraded",
      reasonCode: "scheduled_execution_stale",
      summary: "Scheduled ingest execution exists, but the latest durable completion evidence is stale.",
      observedAt: latestScheduledEvidenceAt,
      supportingEvidence: {
        enabled: true,
        scheduledAgeHours,
        lastIncrementalCompletedAt: schedule.lastIncrementalCompletedAt?.toISOString() ?? null,
        lastBackfillCompletedAt: schedule.lastBackfillCompletedAt?.toISOString() ?? null,
      },
    };
  }

  return {
    domain: "scheduled_execution",
    state: "ready",
    reasonCode: "ready",
    summary: "Scheduled ingest execution has recent durable completion evidence.",
    observedAt: latestScheduledEvidenceAt,
    supportingEvidence: {
      enabled: true,
      scheduledAgeHours,
      lastIncrementalCompletedAt: schedule.lastIncrementalCompletedAt?.toISOString() ?? null,
      lastBackfillCompletedAt: schedule.lastBackfillCompletedAt?.toISOString() ?? null,
    },
  };
}

function buildQueueTelemetryDomain(
  failures: IngestLaunchValidationQueueFailureEvidence[],
): IngestLaunchValidationDomainRecord {
  const alertReadyFailure = failures.find((failure) => failure.alertSignal?.alertReady);

  if (alertReadyFailure) {
    return {
      domain: "queue_telemetry",
      state: "blocked",
      reasonCode: "queue_operator_action_required",
      summary: "Queue telemetry shows an ingest failure that requires operator action.",
      observedAt: null,
      supportingEvidence: {
        failingJobType: alertReadyFailure.jobType,
        escalationReason: alertReadyFailure.alertSignal?.escalationReason ?? null,
        severity: alertReadyFailure.alertSignal?.severity ?? null,
        lastErrorSummary: alertReadyFailure.lastErrorSummary ?? null,
      },
    };
  }

  const retryingFailure = failures.find((failure) => failure.alertSignal?.severity === "degraded_attention" || failure.alertSignal?.severity === "retrying_noise");

  if (retryingFailure) {
    return {
      domain: "queue_telemetry",
      state: "degraded",
      reasonCode: "queue_retrying",
      summary: "Queue telemetry shows retrying or degraded ingest failures.",
      observedAt: null,
      supportingEvidence: {
        failingJobType: retryingFailure.jobType,
        escalationReason: retryingFailure.alertSignal?.escalationReason ?? null,
        severity: retryingFailure.alertSignal?.severity ?? null,
        lastErrorSummary: retryingFailure.lastErrorSummary ?? null,
      },
    };
  }

  return {
    domain: "queue_telemetry",
    state: "ready",
    reasonCode: "ready",
    summary: "Queue telemetry shows no retrying or operator-action ingest failures.",
    observedAt: null,
    supportingEvidence: {
      failureCount: failures.length,
    },
  };
}

function getLatestProbeEvidence(
  probeRecovery: IngestLaunchValidationProbeRecoveryEvidence | null,
): { observedAt: Date | null; observedState: SourceHealthState | null } {
  const refreshObservedAt = probeRecovery?.latestRefreshObservedAt ?? null;
  const probeObservedAt = probeRecovery?.latestProbeObservedAt ?? null;

  if (refreshObservedAt && probeObservedAt) {
    if (refreshObservedAt.getTime() >= probeObservedAt.getTime()) {
      return {
        observedAt: refreshObservedAt,
        observedState: probeRecovery?.latestRefreshObservedState ?? null,
      };
    }

    return {
      observedAt: probeObservedAt,
      observedState: probeRecovery?.latestProbeObservedState ?? null,
    };
  }

  if (refreshObservedAt) {
    return {
      observedAt: refreshObservedAt,
      observedState: probeRecovery?.latestRefreshObservedState ?? null,
    };
  }

  return {
    observedAt: probeObservedAt,
    observedState: probeRecovery?.latestProbeObservedState ?? null,
  };
}

function buildProbeRecoveryDomain(
  checkedAt: Date,
  policy: IngestLaunchValidationPolicy,
  probeRecovery: IngestLaunchValidationProbeRecoveryEvidence | null,
): IngestLaunchValidationDomainRecord {
  const latestProbeEvidence = getLatestProbeEvidence(probeRecovery);

  if (!latestProbeEvidence.observedAt) {
    return {
      domain: "probe_recovery",
      state: "blocked",
      reasonCode: "probe_evidence_missing",
      summary: "The accepted provider lane has no refresh or probe evidence yet.",
      observedAt: null,
      supportingEvidence: {
        openRepairCount: probeRecovery?.openRepairCount ?? 0,
      },
    };
  }

  const evidenceAgeHours = ageHours(checkedAt, latestProbeEvidence.observedAt);
  const observedState = latestProbeEvidence.observedState ?? "healthy";

  if (observedState === "broken" || observedState === "offline" || observedState === "replaced") {
    return {
      domain: "probe_recovery",
      state: "blocked",
      reasonCode: "probe_health_blocked",
      summary: "The latest refresh/probe evidence shows blocked source health for the accepted provider lane.",
      observedAt: latestProbeEvidence.observedAt,
      supportingEvidence: {
        observedState,
        evidenceAgeHours,
        openRepairCount: probeRecovery?.openRepairCount ?? 0,
      },
    };
  }

  if (
    observedState === "degraded" ||
    (probeRecovery?.openRepairCount ?? 0) > 0 ||
    evidenceAgeHours > policy.probeEvidenceMaxAgeHours
  ) {
    return {
      domain: "probe_recovery",
      state: "degraded",
      reasonCode: observedState === "degraded" || evidenceAgeHours > policy.probeEvidenceMaxAgeHours
        ? "probe_health_degraded"
        : "repair_queue_open",
      summary:
        observedState === "degraded" || evidenceAgeHours > policy.probeEvidenceMaxAgeHours
          ? "The latest refresh/probe evidence shows degraded or stale source health."
          : "Repair queue entries remain open for the accepted provider lane.",
      observedAt: latestProbeEvidence.observedAt,
      supportingEvidence: {
        observedState,
        evidenceAgeHours,
        openRepairCount: probeRecovery?.openRepairCount ?? 0,
      },
    };
  }

  return {
    domain: "probe_recovery",
    state: "ready",
    reasonCode: "ready",
    summary: "Refresh/probe evidence is recent and healthy, with no open repair backlog.",
    observedAt: latestProbeEvidence.observedAt,
    supportingEvidence: {
      observedState,
      evidenceAgeHours,
      openRepairCount: probeRecovery?.openRepairCount ?? 0,
    },
  };
}

function rankState(state: IngestLaunchValidationState): number {
  switch (state) {
    case "blocked":
      return 2;
    case "degraded":
      return 1;
    default:
      return 0;
  }
}

export function buildIngestLaunchValidationEvidence(
  input: BuildIngestLaunchValidationEvidenceInput = {},
): IngestLaunchValidationEvidenceRecord {
  const checkedAt = input.checkedAt ?? new Date();
  const policy: IngestLaunchValidationPolicy = {
    ...defaultPolicy,
    ...input.policy,
  };

  const domains = [
    buildProviderLaneDomain(checkedAt, policy, input.acceptedProviderLane ?? null, input.providerExecution ?? null),
    buildScheduledExecutionDomain(checkedAt, policy, input.schedule ?? null),
    buildQueueTelemetryDomain(input.queueTelemetry?.failures ?? []),
    buildProbeRecoveryDomain(checkedAt, policy, input.probeRecovery ?? null),
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
    acceptedProviderLane: input.acceptedProviderLane ?? null,
    policy,
    contributingReasonCodes: contributingReasonCodes.length > 0 ? contributingReasonCodes : ["ready"],
    domains,
  };
}
