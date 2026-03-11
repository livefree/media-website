import "server-only";

import { requirePrivilegedAdminAccess } from "../admin/access";

import { createDefaultSourceHealthRepository } from "../../db/repositories/health";

import type {
  AdminRepairQueueItemRecord,
  PersistSourceProbeHealthRequest,
  PersistSourceRefreshHealthRequest,
  RepairQueueQuery,
  RepairQueueEntryRecord,
  RepairQueueStatusUpdateInput,
  RepairQueueStatus,
  SourceProbeRunRecord,
} from "./types";

export async function persistSourceRefreshHealth(
  request: PersistSourceRefreshHealthRequest,
): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }> {
  return createDefaultSourceHealthRepository().recordSourceRefreshHealth(request);
}

export async function persistSourceProbeHealth(
  request: PersistSourceProbeHealthRequest,
): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }> {
  return createDefaultSourceHealthRepository().recordSourceProbeHealth(request);
}

export async function listRepairQueue(statuses?: RepairQueueStatus[]): Promise<RepairQueueEntryRecord[]> {
  return createDefaultSourceHealthRepository().listRepairQueue(statuses);
}

export async function listAdminRepairQueue(query?: RepairQueueQuery): Promise<AdminRepairQueueItemRecord[]> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceHealthRepository().listAdminRepairQueue(query);
}

export async function updateRepairQueueEntryStatus(
  entryId: string,
  input: RepairQueueStatusUpdateInput,
): Promise<RepairQueueEntryRecord> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceHealthRepository().updateRepairQueueEntryStatus(entryId, input);
}
