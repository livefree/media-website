import "server-only";

import type {
  AdminSourceInventoryItemRecord,
  SourceInventoryQuery,
  SourceInventoryRecord,
  SourceOrderingUpdate,
  UpsertSourceInventoryInput,
} from "../../../server/source";

export interface SourceInventoryRepository {
  listSourceInventory(filters?: SourceInventoryQuery): Promise<SourceInventoryRecord[]>;
  listAdminSourceInventory(filters?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]>;
  getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null>;
  upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord>;
  updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]>;
}
