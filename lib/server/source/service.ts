import "server-only";

import { createDefaultSourceInventoryRepository } from "../../db/repositories/source";

import type { SourceInventoryRecord, SourceOrderingUpdate, UpsertSourceInventoryInput } from "./types";

export async function listSourceInventory(filters?: {
  mediaId?: string;
  episodeId?: string;
  kind?: SourceInventoryRecord["kind"];
}): Promise<SourceInventoryRecord[]> {
  return createDefaultSourceInventoryRepository().listSourceInventory(filters);
}

export async function getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null> {
  return createDefaultSourceInventoryRepository().getSourceInventoryByPublicId(publicId);
}

export async function upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord> {
  return createDefaultSourceInventoryRepository().upsertSourceInventory(input);
}

export async function updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]> {
  return createDefaultSourceInventoryRepository().updateSourceOrdering(updates);
}
