import "server-only";

import type {
  AdminRepairQueueItemRecord,
  RepairQueueQuery,
  RepairQueueStatus,
  RepairQueueStatusUpdateInput,
} from "../health";
import type {
  AdminSourceInventoryItemRecord,
  SourceInventoryQuery,
  SourceOrderingUpdate,
} from "../source";

export interface AdminSourceInventorySummary {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  publicItems: number;
  privateItems: number;
  unhealthyItems: number;
  openRepairItems: number;
}

export interface AdminSourceInventoryPageRecord {
  title: string;
  description: string;
  appliedFilters: SourceInventoryQuery;
  summary: AdminSourceInventorySummary;
  items: AdminSourceInventoryItemRecord[];
}

export interface AdminRepairQueueSummary {
  totalItems: number;
  openItems: number;
  inProgressItems: number;
  waitingProviderItems: number;
  resolvedItems: number;
  dismissedItems: number;
}

export interface AdminRepairQueuePageRecord {
  title: string;
  description: string;
  appliedFilters: RepairQueueQuery;
  summary: AdminRepairQueueSummary;
  items: AdminRepairQueueItemRecord[];
}

export interface AdminRepairQueueActionRequest {
  entryId: string;
  actorId?: string;
  requestId?: string;
}

export interface AdminBackendDependencies {
  source: {
    listAdminSourceInventory(query?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]>;
    updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<unknown>;
  };
  health: {
    listAdminRepairQueue(query?: RepairQueueQuery): Promise<AdminRepairQueueItemRecord[]>;
    updateRepairQueueEntryStatus(entryId: string, input: RepairQueueStatusUpdateInput): Promise<unknown>;
  };
}

export interface AdminRepairQueueStatusAction {
  status: RepairQueueStatus;
  request: AdminRepairQueueActionRequest;
}
