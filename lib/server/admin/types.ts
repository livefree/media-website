import "server-only";

import type {
  PublishedMediaStatus,
  PublishedMediaType,
  PublishedPlaybackResourceRecord,
  PublishedSeasonRecord,
} from "../catalog";
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
    queryAdminPublishedCatalog(query?: AdminPublishedCatalogQuery): Promise<AdminPublishedCatalogPageRecord>;
    getAdminPublishedCatalogDetailByPublicId(publicId: string): Promise<AdminPublishedCatalogDetailRecord | null>;
  };
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
