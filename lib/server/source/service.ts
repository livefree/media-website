import "server-only";

import { createDefaultSourceInventoryRepository } from "../../db/repositories/source";

import type {
  AdminSourceInventoryItemRecord,
  SourceInventoryQuery,
  SourceInventoryRecord,
  SourceOrderingUpdate,
  UpsertSourceInventoryInput,
} from "./types";

export async function listSourceInventory(filters?: SourceInventoryQuery): Promise<SourceInventoryRecord[]> {
  return createDefaultSourceInventoryRepository().listSourceInventory(filters);
}

export async function listAdminSourceInventory(filters?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]> {
  return createDefaultSourceInventoryRepository().listAdminSourceInventory(filters);
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
