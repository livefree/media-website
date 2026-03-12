import "server-only";

import type { MigrationPreflightRecord } from "../../db/migration-safety";
import type {
  FinalLaunchValidationRecord,
  HidePublishedCatalogInput,
  HidePublishedCatalogResult,
  PublishedMediaStatus,
  PublishedMediaType,
  PublishedPlaybackResourceRecord,
  PublishedVisibilityState,
  PublishedSeasonRecord,
  RestorePublishedCatalogVisibilityInput,
  RestorePublishedCatalogVisibilityResult,
  UnpublishPublishedCatalogInput,
  UnpublishPublishedCatalogResult,
} from "../catalog";
import type {
  AdminQueueFailureItemRecord,
  AdminQueueFailureQuery,
  AdminRepairQueueItemRecord,
  RecoveryReadinessRecord,
  RepairQueueQuery,
  RepairQueueStatus,
  RepairQueueStatusUpdateInput,
} from "../health";
import type {
  CreateManualTitleSubmissionInput,
  ManualSubmissionStatus,
  ManualTitleSubmissionDetailRecord,
  ManualTitleSubmissionQuery,
  ManualTitleSubmissionRecord,
  ModerationReportDetailRecord,
  ModerationReportQuery,
  ModerationReportRecord,
  ModerationReportStatus,
  ModerationReportStatusUpdateInput,
  QueueNormalizedCandidateRequest,
} from "../review";
import type {
  AdminSourceInventoryItemRecord,
  CreateManualSourceSubmissionInput,
  ManualSourceSubmissionDetailRecord,
  ManualSourceSubmissionQuery,
  ManualSourceSubmissionRecord,
  ManualSourceSubmissionStatusUpdateInput,
  ReorderPublishedSourcesInput,
  ReorderPublishedSourcesResult,
  ReplacePublishedSourceInput,
  ReplacePublishedSourceResult,
  SourceInventoryQuery,
  SourceOrderingUpdate,
} from "../source";
import type { PendingNormalizedCandidateListItemRecord } from "../../db/repositories/normalization/types";

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

export interface AdminMigrationSafetyPageRecord {
  title: string;
  description: string;
  preflight: MigrationPreflightRecord;
}

export interface AdminQueueFailureMonitoringSummary {
  totalItems: number;
  failedItems: number;
  retryingItems: number;
  providerPageIngestItems: number;
  sourceRefreshItems: number;
  sourceProbeItems: number;
}

export interface AdminQueueFailureMonitoringPageRecord {
  title: string;
  description: string;
  appliedFilters: AdminQueueFailureQuery;
  summary: AdminQueueFailureMonitoringSummary;
  items: AdminQueueFailureItemRecord[];
}

export interface AdminRecoveryReadinessPageRecord {
  title: string;
  description: string;
  readiness: RecoveryReadinessRecord;
}

export interface AdminFinalLaunchValidationPageRecord {
  title: string;
  description: string;
  validation: FinalLaunchValidationRecord;
}

export interface AdminRepairQueueActionRequest {
  entryId: string;
  actorId?: string;
  requestId?: string;
}

export interface AdminModerationQueueSummary {
  totalItems: number;
  openItems: number;
  inReviewItems: number;
  resolvedItems: number;
  dismissedItems: number;
}

export interface AdminModerationQueuePageRecord {
  title: string;
  description: string;
  appliedFilters: ModerationReportQuery;
  summary: AdminModerationQueueSummary;
  items: ModerationReportRecord[];
}

export interface AdminModerationActionRequest {
  publicId: string;
  actorId?: string;
  requestId?: string;
  notes?: string;
  linkedRepairQueueEntryId?: string;
}

export interface AdminManualTitleSubmissionSummary {
  totalItems: number;
  submittedItems: number;
  inReviewItems: number;
  acceptedItems: number;
  rejectedItems: number;
  followupItems: number;
}

export interface AdminManualTitleSubmissionPageRecord {
  title: string;
  description: string;
  appliedFilters: ManualTitleSubmissionQuery;
  summary: AdminManualTitleSubmissionSummary;
  items: ManualTitleSubmissionRecord[];
}

export interface AdminManualSourceSubmissionSummary {
  totalItems: number;
  submittedItems: number;
  inReviewItems: number;
  acceptedItems: number;
  rejectedItems: number;
  followupItems: number;
}

export interface AdminManualSourceSubmissionPageRecord {
  title: string;
  description: string;
  appliedFilters: ManualSourceSubmissionQuery;
  summary: AdminManualSourceSubmissionSummary;
  items: ManualSourceSubmissionRecord[];
}

export interface AdminPendingNormalizedCandidateSummary {
  totalCandidates: number;
  normalizedCandidates: number;
  warningCandidates: number;
  totalAliases: number;
  totalMatchSuggestions: number;
  totalDuplicateSignals: number;
}

export interface AdminPendingNormalizedCandidatesPageRecord {
  title: string;
  description: string;
  summary: AdminPendingNormalizedCandidateSummary;
  items: PendingNormalizedCandidateListItemRecord[];
}

export interface AdminQueueNormalizedCandidateRequest {
  normalizedCandidateId: string;
  assignedReviewerId?: string;
  actorId?: string;
  requestId?: string;
}

export type AdminPublishedCatalogSort = "published_at" | "updated_at" | "title" | "release_year";

export interface AdminPublishedCatalogQuery {
  q?: string;
  type?: PublishedMediaType | "all";
  status?: PublishedMediaStatus;
  year?: number;
  region?: string;
  sort?: AdminPublishedCatalogSort;
  page?: number;
  pageSize?: number;
}

export interface AdminPublishedCatalogListItemRecord {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  originalTitle?: string | null;
  type: PublishedMediaType;
  status: PublishedMediaStatus;
  releaseYear: number;
  endYear?: number | null;
  originCountry?: string | null;
  language?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
  visibilityState: PublishedVisibilityState;
  publishedAt: string;
  updatedAt: string;
  streamCount: number;
  healthyStreamCount: number;
  degradedStreamCount: number;
  downloadCount: number;
  subtitleCount: number;
  openRepairCount: number;
  canonicalWatchHref: string;
  compatibilityHref: string;
}

export interface AdminPublishedCatalogListSummary {
  totalItems: number;
  totalPages: number;
  titlesWithRepairs: number;
  titlesWithHealthyStreams: number;
  episodicTitles: number;
}

export interface AdminPublishedCatalogPageRecord {
  title: string;
  description: string;
  appliedFilters: AdminPublishedCatalogQuery;
  page: number;
  pageSize: number;
  summary: AdminPublishedCatalogListSummary;
  items: AdminPublishedCatalogListItemRecord[];
}

export interface AdminPublishedCatalogAuditRecord {
  action: string;
  actionSummary: string;
  actorId?: string | null;
  createdAt: string;
}

export interface AdminPublishedCatalogReviewContextRecord {
  queueEntryId: string;
  status: string;
  latestDecisionType?: string | null;
  latestDecisionSummary?: string | null;
  scheduledPublishAt?: string | null;
  updatedAt: string;
}

export interface AdminPublishedCatalogSourceSummary {
  totalResources: number;
  streamCount: number;
  healthyStreamCount: number;
  degradedStreamCount: number;
  brokenOrOfflineCount: number;
  downloadCount: number;
  subtitleCount: number;
  openRepairCount: number;
}

export interface AdminPublishedEpisodeDiagnosticRecord {
  episodePublicId: string;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  title: string;
  streamCount: number;
  healthyStreamCount: number;
  openRepairCount: number;
}

export interface AdminPublishedResourceRecord extends PublishedPlaybackResourceRecord {
  openRepairCount: number;
  providerDisplayName?: string | null;
}

export interface AdminPublishedCatalogDetailRecord {
  media: {
    id: string;
    publicId: string;
    slug: string;
    title: string;
    originalTitle?: string | null;
    summary: string;
    description?: string | null;
    tagline?: string | null;
    type: PublishedMediaType;
    status: PublishedMediaStatus;
    releaseYear: number;
    endYear?: number | null;
    originCountry?: string | null;
    language?: string | null;
    runtimeMinutes?: number | null;
    episodeRuntimeMinutes?: number | null;
    seasonCount?: number | null;
    episodeCount?: number | null;
    visibilityState: PublishedVisibilityState;
    posterUrl?: string | null;
    backdropUrl?: string | null;
    canonicalWatchHref: string;
    compatibilityHref: string;
    publishedAt: string;
    updatedAt: string;
  };
  seasons: PublishedSeasonRecord[];
  streamResources: AdminPublishedResourceRecord[];
  downloadResources: AdminPublishedResourceRecord[];
  subtitleResources: AdminPublishedResourceRecord[];
  sourceSummary: AdminPublishedCatalogSourceSummary;
  episodeDiagnostics: AdminPublishedEpisodeDiagnosticRecord[];
  recentAudits: AdminPublishedCatalogAuditRecord[];
  reviewContext?: AdminPublishedCatalogReviewContextRecord;
}

export interface AdminBackendDependencies {
  catalog: {
    getPublishedCatalogMigrationPreflight(): Promise<MigrationPreflightRecord>;
    getFinalLaunchValidation(): Promise<FinalLaunchValidationRecord>;
    queryAdminPublishedCatalog(query?: AdminPublishedCatalogQuery): Promise<AdminPublishedCatalogPageRecord>;
    getAdminPublishedCatalogDetailByPublicId(publicId: string): Promise<AdminPublishedCatalogDetailRecord | null>;
    hidePublishedCatalogRecord(input: HidePublishedCatalogInput): Promise<HidePublishedCatalogResult>;
    restorePublishedCatalogVisibility(input: RestorePublishedCatalogVisibilityInput): Promise<RestorePublishedCatalogVisibilityResult>;
    unpublishPublishedCatalogRecord(input: UnpublishPublishedCatalogInput): Promise<UnpublishPublishedCatalogResult>;
  };
  review: {
    listModerationReports(query?: ModerationReportQuery): Promise<ModerationReportRecord[]>;
    getModerationReportDetailByPublicId(publicId: string): Promise<ModerationReportDetailRecord | null>;
    updateModerationReportStatus(
      publicId: string,
      input: ModerationReportStatusUpdateInput,
    ): Promise<ModerationReportDetailRecord>;
    listManualTitleSubmissions(query?: ManualTitleSubmissionQuery): Promise<ManualTitleSubmissionRecord[]>;
    getManualTitleSubmissionDetailByPublicId(publicId: string): Promise<ManualTitleSubmissionDetailRecord | null>;
    createManualTitleSubmission(input: CreateManualTitleSubmissionInput): Promise<ManualTitleSubmissionDetailRecord>;
    updateManualTitleSubmissionStatus(
      publicId: string,
      input: {
        status: ManualSubmissionStatus;
        actorId?: string;
        requestId?: string;
        notes?: string;
        canonicalMediaId?: string;
        reviewQueueEntryId?: string;
      },
    ): Promise<ManualTitleSubmissionDetailRecord>;
    scheduleReviewPublication(input: {
      queueEntryId: string;
      publishAt: string;
      actorId?: string;
      requestId?: string;
      notes?: string;
    }): Promise<unknown>;
    clearScheduledReviewPublication(input: {
      queueEntryId: string;
      actorId?: string;
      requestId?: string;
      notes?: string;
    }): Promise<unknown>;
    listPendingNormalizedCandidates(): Promise<PendingNormalizedCandidateListItemRecord[]>;
    queueNormalizedCandidateForReview(request: QueueNormalizedCandidateRequest): Promise<unknown>;
  };
  source: {
    listAdminSourceInventory(query?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]>;
    updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<unknown>;
    reorderPublishedSources(input: ReorderPublishedSourcesInput): Promise<ReorderPublishedSourcesResult>;
    replacePublishedSource(input: ReplacePublishedSourceInput): Promise<ReplacePublishedSourceResult>;
    listManualSourceSubmissions(query?: ManualSourceSubmissionQuery): Promise<ManualSourceSubmissionRecord[]>;
    getManualSourceSubmissionDetailByPublicId(publicId: string): Promise<ManualSourceSubmissionDetailRecord | null>;
    createManualSourceSubmission(input: CreateManualSourceSubmissionInput): Promise<ManualSourceSubmissionDetailRecord>;
    updateManualSourceSubmissionStatus(
      publicId: string,
      input: ManualSourceSubmissionStatusUpdateInput,
    ): Promise<ManualSourceSubmissionDetailRecord>;
  };
  health: {
    getRecoveryReadiness(): Promise<RecoveryReadinessRecord>;
    listAdminQueueFailures(query?: AdminQueueFailureQuery): Promise<AdminQueueFailureItemRecord[]>;
    listAdminRepairQueue(query?: RepairQueueQuery): Promise<AdminRepairQueueItemRecord[]>;
    updateRepairQueueEntryStatus(entryId: string, input: RepairQueueStatusUpdateInput): Promise<unknown>;
  };
}

export interface AdminRepairQueueStatusAction {
  status: RepairQueueStatus;
  request: AdminRepairQueueActionRequest;
}

export interface AdminReviewPublicationScheduleActionRequest {
  queueEntryId: string;
  publishAt: string;
  actorId?: string;
  requestId?: string;
  notes?: string;
}
