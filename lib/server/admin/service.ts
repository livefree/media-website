import "server-only";

import type {
  AdminBackendDependencies,
  AdminRepairQueueActionRequest,
  AdminRepairQueuePageRecord,
  AdminSourceInventoryPageRecord,
} from "./types";
import type { RepairQueueQuery, RepairQueueStatus } from "../health";
import type { SourceInventoryQuery, SourceOrderingUpdate } from "../source";

async function getDefaultAdminDependencies(): Promise<AdminBackendDependencies> {
  const source = await import("../source");
  const health = await import("../health");

  return {
    source: {
      listAdminSourceInventory: source.listAdminSourceInventory,
      updateSourceOrdering: source.updateSourceOrdering,
    },
    health: {
      listAdminRepairQueue: health.listAdminRepairQueue,
      updateRepairQueueEntryStatus: health.updateRepairQueueEntryStatus,
    },
  };
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
