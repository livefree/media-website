import "server-only";

import type {
  AdminQueueFailureItemRecord,
  AdminQueueFailureQuery,
  AdminRepairQueueItemRecord,
  PersistSourceProbeHealthRequest,
  PersistSourceRefreshHealthRequest,
  RepairQueueQuery,
  RepairQueueEntryRecord,
  RepairQueueStatusUpdateInput,
  RepairQueueStatus,
  SourceProbeRunRecord,
} from "../../../server/health";

export interface SourceHealthRepository {
  recordSourceRefreshHealth(
    request: PersistSourceRefreshHealthRequest,
  ): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }>;
  recordSourceProbeHealth(
    request: PersistSourceProbeHealthRequest,
  ): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }>;
  listAdminQueueFailures(query?: AdminQueueFailureQuery): Promise<AdminQueueFailureItemRecord[]>;
  listRepairQueue(statuses?: RepairQueueStatus[]): Promise<RepairQueueEntryRecord[]>;
  listAdminRepairQueue(query?: RepairQueueQuery): Promise<AdminRepairQueueItemRecord[]>;
  updateRepairQueueEntryStatus(entryId: string, input: RepairQueueStatusUpdateInput): Promise<RepairQueueEntryRecord>;
}
