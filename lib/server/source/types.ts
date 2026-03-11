import "server-only";

import type { SourceHealthState } from "../provider";
import type { ManualSubmissionActionType, ManualSubmissionStatus } from "../review";

export const sourceOrderingOrigins = ["automated", "manual"] as const;

export type SourceOrderingOrigin = (typeof sourceOrderingOrigins)[number];

export interface SourceInventoryRecord {
  id: string;
  publicId: string;
  mediaId: string;
  episodeId?: string | null;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  kind: "stream" | "download" | "subtitle" | "trailer";
  provider: "internal" | "m3u8" | "mp4" | "quark" | "baidu" | "aliyun" | "magnet" | "other";
  format: string;
  label: string;
  quality?: string | null;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  status: "online" | "degraded" | "offline" | "reported" | "pending";
  healthState: SourceHealthState;
  healthSummary?: string | null;
  priority: number;
  mirrorOrder: number;
  isPreferred: boolean;
  orderingOrigin: SourceOrderingOrigin;
  isActive: boolean;
  isPublic: boolean;
  replacementResourceId?: string | null;
  replacementPublicId?: string | null;
  lastCheckedAt?: Date | null;
  lastHealthyAt?: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSourceInventoryInput {
  id?: string;
  publicId?: string;
  mediaId: string;
  episodeId?: string | null;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  kind: SourceInventoryRecord["kind"];
  provider: SourceInventoryRecord["provider"];
  format: string;
  label: string;
  quality?: string | null;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  status?: SourceInventoryRecord["status"];
  healthState?: SourceHealthState;
  healthSummary?: string | null;
  priority?: number;
  mirrorOrder?: number;
  isPreferred?: boolean;
  orderingOrigin?: SourceOrderingOrigin;
  isActive?: boolean;
  isPublic?: boolean;
  replacementResourceId?: string | null;
  lastCheckedAt?: string;
  lastHealthyAt?: string;
  failureCount?: number;
}

export interface SourceOrderingUpdate {
  resourceId: string;
  priority: number;
  mirrorOrder?: number;
  isPreferred?: boolean;
  orderingOrigin?: SourceOrderingOrigin;
}

export interface SourceInventoryQuery {
  mediaId?: string;
  episodeId?: string;
  kind?: SourceInventoryRecord["kind"];
  providerId?: string;
  healthStates?: SourceHealthState[];
  statuses?: SourceInventoryRecord["status"][];
  includeInactive?: boolean;
  includePrivate?: boolean;
  search?: string;
}

export interface AdminSourceInventoryItemRecord extends SourceInventoryRecord {
  mediaPublicId: string;
  mediaTitle: string;
  mediaSlug: string;
  episodePublicId?: string | null;
  episodeTitle?: string | null;
  episodeLabel?: string | null;
  providerAdapterKey?: string | null;
  providerDisplayName?: string | null;
  repairOpenCount: number;
}

export interface ManualSourceSubmissionQuery {
  q?: string;
  statuses?: ManualSubmissionStatus[];
  kinds?: SourceInventoryRecord["kind"][];
  mediaPublicId?: string;
}

export interface ManualSourceSubmissionActionRecord {
  id: string;
  submissionId: string;
  actorId?: string | null;
  actionType: ManualSubmissionActionType;
  summary: string;
  notes?: string | null;
  statusAfter?: ManualSubmissionStatus | null;
  createdAt: Date;
}

export interface ManualSourceSubmissionRecord {
  id: string;
  publicId: string;
  status: ManualSubmissionStatus;
  mediaId?: string | null;
  mediaPublicId?: string | null;
  mediaTitle?: string | null;
  mediaSlug?: string | null;
  episodeId?: string | null;
  episodePublicId?: string | null;
  episodeTitle?: string | null;
  targetTitleText?: string | null;
  targetEpisodeText?: string | null;
  kind: SourceInventoryRecord["kind"];
  provider: SourceInventoryRecord["provider"];
  format: string;
  label: string;
  quality?: string | null;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  notes?: string | null;
  sourceUrl?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  linkedResourceId?: string | null;
  linkedResourcePublicId?: string | null;
  linkedRepairQueueEntryId?: string | null;
  latestActionSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date | null;
}

export interface ManualSourceSubmissionDetailRecord {
  submission: ManualSourceSubmissionRecord;
  actions: ManualSourceSubmissionActionRecord[];
}

export interface CreateManualSourceSubmissionInput {
  mediaId?: string;
  episodeId?: string;
  targetTitleText?: string;
  targetEpisodeText?: string;
  kind: SourceInventoryRecord["kind"];
  provider: SourceInventoryRecord["provider"];
  format: string;
  label: string;
  quality?: string;
  url: string;
  maskedUrl?: string;
  accessCode?: string;
  notes?: string;
  sourceUrl?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  actorId?: string;
  requestId?: string;
}

export interface ManualSourceSubmissionStatusUpdateInput {
  status: ManualSubmissionStatus;
  actorId?: string;
  requestId?: string;
  notes?: string;
  linkedResourceId?: string;
  linkedRepairQueueEntryId?: string;
}
