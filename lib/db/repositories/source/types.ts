import "server-only";

import type { SourceInventoryRecord, SourceOrderingUpdate, UpsertSourceInventoryInput } from "../../../server/source";

export interface SourceInventoryRepository {
  listSourceInventory(filters?: {
    mediaId?: string;
    episodeId?: string;
    kind?: SourceInventoryRecord["kind"];
  }): Promise<SourceInventoryRecord[]>;
  getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null>;
  upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord>;
  updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]>;
}
