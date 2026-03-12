import "server-only";

import { requirePrivilegedAdminAccess } from "./access";
import type { PendingNormalizedCandidateListItemRecord } from "../../db/repositories/normalization/types";
import type {
  AdminReviewPublicationScheduleActionRequest,
  AdminBackendDependencies,
  AdminFinalLaunchValidationPageRecord,
  AdminMigrationSafetyPageRecord,
  AdminQueueFailureMonitoringPageRecord,
  AdminRecoveryReadinessPageRecord,
  AdminManualSourceSubmissionPageRecord,
  AdminManualTitleSubmissionPageRecord,
  AdminModerationActionRequest,
  AdminModerationQueuePageRecord,
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogPageRecord,
  AdminPublishedCatalogQuery,
  AdminRepairQueueActionRequest,
  AdminRepairQueuePageRecord,
  AdminSourceInventoryPageRecord,
  AdminPendingNormalizedCandidateSummary,
  AdminPendingNormalizedCandidatesPageRecord,
  AdminQueueNormalizedCandidateRequest,
} from "./types";
import type { AdminQueueFailureQuery, RepairQueueQuery, RepairQueueStatus } from "../health";
import type {
  CreateManualSourceSubmissionInput,
  ManualSourceSubmissionQuery,
  ManualSourceSubmissionStatusUpdateInput,
  ReorderPublishedSourcesInput,
  ReorderPublishedSourcesResult,
  ReplacePublishedSourceInput,
  ReplacePublishedSourceResult,
  SourceInventoryQuery,
  SourceOrderingUpdate,
} from "../source";
import type {
  CreateManualTitleSubmissionInput,
  ManualSubmissionStatus,
  ManualTitleSubmissionQuery,
  ModerationReportQuery,
} from "../review";
import type {
  HidePublishedCatalogInput,
  HidePublishedCatalogResult,
  RestorePublishedCatalogVisibilityInput,
  RestorePublishedCatalogVisibilityResult,
  UnpublishPublishedCatalogInput,
  UnpublishPublishedCatalogResult,
} from "../catalog";

async function getDefaultAdminDependencies(): Promise<AdminBackendDependencies> {
  const catalog = await import("../catalog");
  const review = await import("../review");
  const source = await import("../source");
  const health = await import("../health");

  return {
    catalog: {
      getPublishedCatalogMigrationPreflight: catalog.getPublishedCatalogMigrationPreflight,
      getFinalLaunchValidation: catalog.getFinalLaunchValidation,
      queryAdminPublishedCatalog: catalog.getAdminPublishedCatalogPage,
      getAdminPublishedCatalogDetailByPublicId: catalog.getAdminPublishedCatalogDetailByPublicId,
      unpublishPublishedCatalogRecord: catalog.unpublishPublishedCatalogRecord,
      hidePublishedCatalogRecord: catalog.hidePublishedCatalogRecord,
      restorePublishedCatalogVisibility: catalog.restorePublishedCatalogVisibility,
    },
    review: {
      listModerationReports: review.listModerationReports,
      getModerationReportDetailByPublicId: review.getModerationReportDetailByPublicId,
      updateModerationReportStatus: review.updateModerationReportStatus,
      listManualTitleSubmissions: review.listManualTitleSubmissions,
      getManualTitleSubmissionDetailByPublicId: review.getManualTitleSubmissionDetailByPublicId,
      createManualTitleSubmission: review.createManualTitleSubmission,
      updateManualTitleSubmissionStatus: review.updateManualTitleSubmissionStatus,
      scheduleReviewPublication: review.scheduleReviewPublication,
      clearScheduledReviewPublication: review.clearScheduledReviewPublication,
      listPendingNormalizedCandidates: review.listPendingNormalizedCandidates,
      queueNormalizedCandidateForReview: review.queueNormalizedCandidateForReview,
    },
    source: {
      listAdminSourceInventory: source.listAdminSourceInventory,
      updateSourceOrdering: source.updateSourceOrdering,
      reorderPublishedSources: source.reorderPublishedSources,
      replacePublishedSource: source.replacePublishedSource,
      listManualSourceSubmissions: source.listManualSourceSubmissions,
      getManualSourceSubmissionDetailByPublicId: source.getManualSourceSubmissionDetailByPublicId,
      createManualSourceSubmission: source.createManualSourceSubmission,
      updateManualSourceSubmissionStatus: source.updateManualSourceSubmissionStatus,
    },
    health: {
      getRecoveryReadiness: health.getRecoveryReadiness,
      listAdminQueueFailures: health.listAdminQueueFailures,
      listAdminRepairQueue: health.listAdminRepairQueue,
      updateRepairQueueEntryStatus: health.updateRepairQueueEntryStatus,
    },
  };
}

export async function getAdminPublishedCatalogManagementPage(
  query: AdminPublishedCatalogQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminPublishedCatalogPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.queryAdminPublishedCatalog(query);
}

export async function getAdminMigrationSafetyPage(
  dependencies?: AdminBackendDependencies,
): Promise<AdminMigrationSafetyPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const preflight = await resolvedDependencies.catalog.getPublishedCatalogMigrationPreflight();

  return {
    title: "Migration Safety",
    description: "Privileged rollout guardrail state for the published catalog runtime.",
    preflight,
  };
}

export async function getAdminRecoveryReadinessPage(
  dependencies?: AdminBackendDependencies,
): Promise<AdminRecoveryReadinessPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const readiness = await resolvedDependencies.health.getRecoveryReadiness();

  return {
    title: "Recovery Readiness",
    description: "Operator recovery guardrail state for backup freshness and restore rehearsal health.",
    readiness,
  };
}

export async function getAdminFinalLaunchValidationPage(
  dependencies?: AdminBackendDependencies,
): Promise<AdminFinalLaunchValidationPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const validation = await resolvedDependencies.catalog.getFinalLaunchValidation();

  return {
    title: "Final Launch Validation",
    description: "Bounded launch-validation summary for the accepted backend scope and operator guardrails.",
    validation,
  };
}

export async function getAdminPublishedCatalogManagementDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
): Promise<AdminPublishedCatalogDetailRecord | null> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.getAdminPublishedCatalogDetailByPublicId(publicId);
}

function buildSourceInventorySummary(items: AdminSourceInventoryPageRecord["items"]): AdminSourceInventoryPageRecord["summary"] {
  return {
    totalItems: items.length,
    activeItems: items.filter((item) => item.isActive).length,
    inactiveItems: items.filter((item) => !item.isActive).length,
    publicItems: items.filter((item) => item.isPublic).length,
    privateItems: items.filter((item) => !item.isPublic).length,
    unhealthyItems: items.filter((item) => item.healthState !== "healthy").length,
    openRepairItems: items.filter((item) => item.repairOpenCount > 0).length,
  };
}

function buildRepairQueueSummary(items: AdminRepairQueuePageRecord["items"]): AdminRepairQueuePageRecord["summary"] {
  return {
    totalItems: items.length,
    openItems: items.filter((item) => item.status === "open").length,
    inProgressItems: items.filter((item) => item.status === "in_progress").length,
    waitingProviderItems: items.filter((item) => item.status === "waiting_provider").length,
    resolvedItems: items.filter((item) => item.status === "resolved").length,
    dismissedItems: items.filter((item) => item.status === "dismissed").length,
  };
}

function buildQueueFailureMonitoringSummary(
  items: AdminQueueFailureMonitoringPageRecord["items"],
): AdminQueueFailureMonitoringPageRecord["summary"] {
  return {
    totalItems: items.length,
    failedItems: items.filter((item) => item.visibilityState === "failed").length,
    retryingItems: items.filter((item) => item.visibilityState === "retrying").length,
    providerPageIngestItems: items.filter((item) => item.jobType === "provider_page_ingest").length,
    sourceRefreshItems: items.filter((item) => item.jobType === "scheduled_source_refresh").length,
    sourceProbeItems: items.filter((item) => item.jobType === "scheduled_source_probe").length,
  };
}

function buildModerationQueueSummary(items: AdminModerationQueuePageRecord["items"]): AdminModerationQueuePageRecord["summary"] {
  return {
    totalItems: items.length,
    openItems: items.filter((item) => item.status === "open").length,
    inReviewItems: items.filter((item) => item.status === "in_review").length,
    resolvedItems: items.filter((item) => item.status === "resolved").length,
    dismissedItems: items.filter((item) => item.status === "dismissed").length,
  };
}

function buildPendingNormalizedSummary(
  items: PendingNormalizedCandidateListItemRecord[],
): AdminPendingNormalizedCandidateSummary {
  return {
    totalCandidates: items.length,
    normalizedCandidates: items.filter((item) => item.candidate.status === "normalized").length,
    warningCandidates: items.filter((item) => item.candidate.status === "warning").length,
    totalAliases: items.reduce((sum, item) => sum + item.aliasCount, 0),
    totalMatchSuggestions: items.reduce((sum, item) => sum + item.matchSuggestionCount, 0),
    totalDuplicateSignals: items.reduce((sum, item) => sum + item.duplicateSignalCount, 0),
  };
}

function buildManualSubmissionSummary<T extends { status: ManualSubmissionStatus }>(
  items: T[],
): AdminManualTitleSubmissionPageRecord["summary"] {
  return {
    totalItems: items.length,
    submittedItems: items.filter((item) => item.status === "submitted").length,
    inReviewItems: items.filter((item) => item.status === "in_review").length,
    acceptedItems: items.filter((item) => item.status === "accepted").length,
    rejectedItems: items.filter((item) => item.status === "rejected").length,
    followupItems: items.filter((item) => item.status === "needs_followup").length,
  };
}

export async function getAdminSourceInventoryPage(
  query: SourceInventoryQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminSourceInventoryPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.source.listAdminSourceInventory(query);

  return {
    title: "Source Inventory",
    description: "Operator view of published sources, ordering, and current health state.",
    appliedFilters: query,
    summary: buildSourceInventorySummary(items),
    items,
  };
}

export async function getAdminRepairQueuePage(
  query: RepairQueueQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminRepairQueuePageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.health.listAdminRepairQueue(query);

  return {
    title: "Repair Queue",
    description: "Operator queue for degraded, broken, offline, or replaced published sources.",
    appliedFilters: query,
    summary: buildRepairQueueSummary(items),
    items,
  };
}

export async function getAdminQueueFailureMonitoringPage(
  query: AdminQueueFailureQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminQueueFailureMonitoringPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.health.listAdminQueueFailures(query);

  return {
    title: "Queue Failures",
    description: "Operator triage view for failed and retrying ingest, refresh, and probe jobs.",
    appliedFilters: query,
    summary: buildQueueFailureMonitoringSummary(items),
    items,
  };
}

export async function getAdminModerationQueuePage(
  query: ModerationReportQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminModerationQueuePageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.review.listModerationReports(query);

  return {
    title: "Moderation Reports",
    description: "Operator queue for broken-source and closely related reports.",
    appliedFilters: query,
    summary: buildModerationQueueSummary(items),
    items,
  };
}

export async function getAdminModerationReportDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.getModerationReportDetailByPublicId(publicId);
}

export async function acknowledgeAdminModerationReport(
  request: AdminModerationActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.review.updateModerationReportStatus(request.publicId, {
    status: "in_review",
    actorId: request.actorId,
    requestId: request.requestId,
    notes: request.notes,
    linkedRepairQueueEntryId: request.linkedRepairQueueEntryId,
  });
}

export async function resolveAdminModerationReport(
  request: AdminModerationActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.review.updateModerationReportStatus(request.publicId, {
    status: "resolved",
    actorId: request.actorId,
    requestId: request.requestId,
    notes: request.notes,
    linkedRepairQueueEntryId: request.linkedRepairQueueEntryId,
  });
}

export async function dismissAdminModerationReport(
  request: AdminModerationActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.review.updateModerationReportStatus(request.publicId, {
    status: "dismissed",
    actorId: request.actorId,
    requestId: request.requestId,
    notes: request.notes,
  });
}

export async function getAdminManualTitleSubmissionPage(
  query: ManualTitleSubmissionQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminManualTitleSubmissionPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.review.listManualTitleSubmissions(query);

  return {
    title: "Manual Title Submissions",
    description: "Operator intake queue for manually submitted title candidates.",
    appliedFilters: query,
    summary: buildManualSubmissionSummary(items),
    items,
  };
}

export async function getAdminManualTitleSubmissionDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.getManualTitleSubmissionDetailByPublicId(publicId);
}

export async function createAdminManualTitleSubmission(
  input: CreateManualTitleSubmissionInput,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.createManualTitleSubmission(input);
}

export async function updateAdminManualTitleSubmissionStatus(
  publicId: string,
  input: {
    status: ManualSubmissionStatus;
    actorId?: string;
    requestId?: string;
    notes?: string;
    canonicalMediaId?: string;
    reviewQueueEntryId?: string;
  },
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.updateManualTitleSubmissionStatus(publicId, input);
}

export async function getAdminManualSourceSubmissionPage(
  query: ManualSourceSubmissionQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminManualSourceSubmissionPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const items = await resolvedDependencies.source.listManualSourceSubmissions(query);

  return {
    title: "Manual Source Submissions",
    description: "Operator intake queue for manually submitted source candidates.",
    appliedFilters: query,
    summary: buildManualSubmissionSummary(items),
    items,
  };
}

export async function getAdminPendingNormalizedCandidatesPage(
  dependencies?: AdminBackendDependencies,
): Promise<AdminPendingNormalizedCandidatesPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  const pending = await resolvedDependencies.review.listPendingNormalizedCandidates();

  return {
    title: "Pending Normalized Candidates",
    description: "Normalized candidates awaiting operator review queue placement.",
    summary: buildPendingNormalizedSummary(pending),
    items: pending,
  };
}

export async function queueAdminNormalizedCandidateForReview(
  request: AdminQueueNormalizedCandidateRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.review.queueNormalizedCandidateForReview({
    normalizedCandidateId: request.normalizedCandidateId,
    assignedReviewerId: request.assignedReviewerId,
    actorId: request.actorId,
    requestId: request.requestId,
  });
}

export async function getAdminManualSourceSubmissionDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.getManualSourceSubmissionDetailByPublicId(publicId);
}

export async function createAdminManualSourceSubmission(
  input: CreateManualSourceSubmissionInput,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.createManualSourceSubmission(input);
}

export async function updateAdminManualSourceSubmissionStatus(
  publicId: string,
  input: ManualSourceSubmissionStatusUpdateInput,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.updateManualSourceSubmissionStatus(publicId, input);
}

export async function acknowledgeAdminRepairQueueEntry(
  request: AdminRepairQueueActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.health.updateRepairQueueEntryStatus(request.entryId, {
    status: "in_progress",
    actorId: request.actorId,
    requestId: request.requestId,
  });
}

export async function resolveAdminRepairQueueEntry(
  request: AdminRepairQueueActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.health.updateRepairQueueEntryStatus(request.entryId, {
    status: "resolved",
    actorId: request.actorId,
    requestId: request.requestId,
  });
}

export async function updateAdminSourceOrdering(
  updates: SourceOrderingUpdate[],
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.source.updateSourceOrdering(updates);
}

export async function reorderAdminPublishedSources(
  input: ReorderPublishedSourcesInput,
  dependencies?: AdminBackendDependencies,
): Promise<ReorderPublishedSourcesResult> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.reorderPublishedSources(input);
}

export async function replaceAdminPublishedSource(
  input: ReplacePublishedSourceInput,
  dependencies?: AdminBackendDependencies,
): Promise<ReplacePublishedSourceResult> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.replacePublishedSource(input);
}

export async function unpublishAdminPublishedCatalogRecord(
  input: UnpublishPublishedCatalogInput,
  dependencies?: AdminBackendDependencies,
): Promise<UnpublishPublishedCatalogResult> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.unpublishPublishedCatalogRecord(input);
}

export async function hideAdminPublishedCatalogRecord(
  input: HidePublishedCatalogInput,
  dependencies?: AdminBackendDependencies,
): Promise<HidePublishedCatalogResult> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.hidePublishedCatalogRecord(input);
}

export async function restoreAdminPublishedCatalogVisibility(
  input: RestorePublishedCatalogVisibilityInput,
  dependencies?: AdminBackendDependencies,
): Promise<RestorePublishedCatalogVisibilityResult> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.restorePublishedCatalogVisibility(input);
}

export async function scheduleAdminReviewPublication(
  request: AdminReviewPublicationScheduleActionRequest,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.scheduleReviewPublication(request);
}

export async function clearAdminScheduledReviewPublication(
  request: Omit<AdminReviewPublicationScheduleActionRequest, "publishAt">,
  dependencies?: AdminBackendDependencies,
) {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.clearScheduledReviewPublication(request);
}
