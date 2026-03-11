import "server-only";

import type {
  AdminSourceInventoryItemRecord,
  CreateManualSourceSubmissionInput,
  ManualSourceSubmissionActionRecord,
  ManualSourceSubmissionDetailRecord,
  ManualSourceSubmissionQuery,
  ManualSourceSubmissionRecord,
  ManualSourceSubmissionStatusUpdateInput,
  ReorderPublishedSourcesInput,
  ReorderPublishedSourcesResult,
  ReplacePublishedSourceInput,
  ReplacePublishedSourceResult,
  SourceInventoryQuery,
  SourceInventoryRecord,
  SourceOrderingUpdate,
  UpsertSourceInventoryInput,
} from "../../../server/source";
import type { ManualSubmissionActionType, ManualSubmissionStatus } from "../../../server/review";

export interface ManualSourceSubmissionActionCreateInput {
  submissionId: string;
  actorId?: string;
  actionType: ManualSubmissionActionType;
  summary: string;
  notes?: string;
  statusAfter?: ManualSubmissionStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface SourceInventoryRepository {
  listSourceInventory(filters?: SourceInventoryQuery): Promise<SourceInventoryRecord[]>;
  listAdminSourceInventory(filters?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]>;
  getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null>;
  upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord>;
  updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]>;
  reorderPublishedSources(input: ReorderPublishedSourcesInput): Promise<ReorderPublishedSourcesResult>;
  replacePublishedSource(input: ReplacePublishedSourceInput): Promise<ReplacePublishedSourceResult>;
  createManualSourceSubmission(input: CreateManualSourceSubmissionInput): Promise<ManualSourceSubmissionRecord>;
  updateManualSourceSubmissionStatus(
    publicId: string,
    input: ManualSourceSubmissionStatusUpdateInput,
  ): Promise<ManualSourceSubmissionRecord>;
  createManualSourceSubmissionAction(input: ManualSourceSubmissionActionCreateInput): Promise<ManualSourceSubmissionActionRecord>;
  listManualSourceSubmissions(query?: ManualSourceSubmissionQuery): Promise<ManualSourceSubmissionRecord[]>;
  getManualSourceSubmissionDetailByPublicId(publicId: string): Promise<ManualSourceSubmissionDetailRecord | null>;
}
