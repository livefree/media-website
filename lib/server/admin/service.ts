import "server-only";

import type {
  AdminBackendDependencies,
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
} from "./types";
import type { RepairQueueQuery, RepairQueueStatus } from "../health";
import type {
  CreateManualSourceSubmissionInput,
  ManualSourceSubmissionQuery,
  ManualSourceSubmissionStatusUpdateInput,
  SourceInventoryQuery,
  SourceOrderingUpdate,
} from "../source";
import type {
  CreateManualTitleSubmissionInput,
  ManualSubmissionStatus,
  ManualTitleSubmissionQuery,
  ModerationReportQuery,
} from "../review";

async function getDefaultAdminDependencies(): Promise<AdminBackendDependencies> {
  const catalog = await import("../catalog");
  const review = await import("../review");
  const source = await import("../source");
  const health = await import("../health");

  return {
    catalog: {
      queryAdminPublishedCatalog: catalog.getAdminPublishedCatalogPage,
      getAdminPublishedCatalogDetailByPublicId: catalog.getAdminPublishedCatalogDetailByPublicId,
    },
    review: {
      listModerationReports: review.listModerationReports,
      getModerationReportDetailByPublicId: review.getModerationReportDetailByPublicId,
      updateModerationReportStatus: review.updateModerationReportStatus,
      listManualTitleSubmissions: review.listManualTitleSubmissions,
      getManualTitleSubmissionDetailByPublicId: review.getManualTitleSubmissionDetailByPublicId,
      createManualTitleSubmission: review.createManualTitleSubmission,
      updateManualTitleSubmissionStatus: review.updateManualTitleSubmissionStatus,
    },
    source: {
      listAdminSourceInventory: source.listAdminSourceInventory,
      updateSourceOrdering: source.updateSourceOrdering,
      listManualSourceSubmissions: source.listManualSourceSubmissions,
      getManualSourceSubmissionDetailByPublicId: source.getManualSourceSubmissionDetailByPublicId,
      createManualSourceSubmission: source.createManualSourceSubmission,
      updateManualSourceSubmissionStatus: source.updateManualSourceSubmissionStatus,
    },
    health: {
      listAdminRepairQueue: health.listAdminRepairQueue,
      updateRepairQueueEntryStatus: health.updateRepairQueueEntryStatus,
    },
  };
}

export async function getAdminPublishedCatalogManagementPage(
  query: AdminPublishedCatalogQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminPublishedCatalogPageRecord> {
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.catalog.queryAdminPublishedCatalog(query);
}

export async function getAdminPublishedCatalogManagementDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
): Promise<AdminPublishedCatalogDetailRecord | null> {
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

function buildModerationQueueSummary(items: AdminModerationQueuePageRecord["items"]): AdminModerationQueuePageRecord["summary"] {
  return {
    totalItems: items.length,
    openItems: items.filter((item) => item.status === "open").length,
    inReviewItems: items.filter((item) => item.status === "in_review").length,
    resolvedItems: items.filter((item) => item.status === "resolved").length,
    dismissedItems: items.filter((item) => item.status === "dismissed").length,
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

export async function getAdminModerationQueuePage(
  query: ModerationReportQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminModerationQueuePageRecord> {
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
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.getModerationReportDetailByPublicId(publicId);
}

export async function acknowledgeAdminModerationReport(
  request: AdminModerationActionRequest,
  dependencies?: AdminBackendDependencies,
) {
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
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.getManualTitleSubmissionDetailByPublicId(publicId);
}

export async function createAdminManualTitleSubmission(
  input: CreateManualTitleSubmissionInput,
  dependencies?: AdminBackendDependencies,
) {
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
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.review.updateManualTitleSubmissionStatus(publicId, input);
}

export async function getAdminManualSourceSubmissionPage(
  query: ManualSourceSubmissionQuery = {},
  dependencies?: AdminBackendDependencies,
): Promise<AdminManualSourceSubmissionPageRecord> {
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

export async function getAdminManualSourceSubmissionDetailByPublicId(
  publicId: string,
  dependencies?: AdminBackendDependencies,
) {
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.getManualSourceSubmissionDetailByPublicId(publicId);
}

export async function createAdminManualSourceSubmission(
  input: CreateManualSourceSubmissionInput,
  dependencies?: AdminBackendDependencies,
) {
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.createManualSourceSubmission(input);
}

export async function updateAdminManualSourceSubmissionStatus(
  publicId: string,
  input: ManualSourceSubmissionStatusUpdateInput,
  dependencies?: AdminBackendDependencies,
) {
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());
  return resolvedDependencies.source.updateManualSourceSubmissionStatus(publicId, input);
}

export async function acknowledgeAdminRepairQueueEntry(
  request: AdminRepairQueueActionRequest,
  dependencies?: AdminBackendDependencies,
) {
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
  const resolvedDependencies = dependencies ?? (await getDefaultAdminDependencies());

  return resolvedDependencies.source.updateSourceOrdering(updates);
}
