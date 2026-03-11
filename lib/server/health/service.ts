import "server-only";

import { createDefaultSourceHealthRepository } from "../../db/repositories/health";

import type {
  PersistSourceProbeHealthRequest,
  PersistSourceRefreshHealthRequest,
  RepairQueueEntryRecord,
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
