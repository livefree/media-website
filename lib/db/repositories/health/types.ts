import "server-only";

import type {
  PersistSourceProbeHealthRequest,
  PersistSourceRefreshHealthRequest,
  RepairQueueEntryRecord,
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
  listRepairQueue(statuses?: RepairQueueStatus[]): Promise<RepairQueueEntryRecord[]>;
}
