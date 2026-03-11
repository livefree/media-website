import "server-only";

import type { PersistedCandidateAliasRecord, PersistedNormalizedCandidateRecord } from "../../db/repositories/normalization/types";
import type { ReviewDecisionType } from "../review";

export type PublishedCatalogScope = "all" | "movie" | "series" | "anime";
export type PublishedCatalogSort = "latest" | "popular" | "rating";
export type PublishedMediaType = "movie" | "series" | "anime" | "variety" | "documentary" | "special";
export type PublishedMediaStatus = "draft" | "upcoming" | "ongoing" | "completed" | "hiatus" | "archived";
export type PublishedResourceKind = "stream" | "download" | "subtitle" | "trailer";
export type PublishedResourceProvider = "internal" | "m3u8" | "mp4" | "quark" | "baidu" | "aliyun" | "magnet" | "other";
export type PublishedResourceStatus = "online" | "degraded" | "offline" | "reported" | "pending";

export interface PublishedWatchQuery {
  mediaPublicId: string;
  episodePublicId?: string;
  resourcePublicId?: string;
  listPublicId?: string;
  listItemPublicRef?: string;
  timeSeconds?: number;
}

export interface PublishedCatalogQueryInput {
  q?: string;
  scope?: PublishedCatalogScope;
  genre?: string;
  year?: number;
  region?: string;
  sort?: PublishedCatalogSort;
  page?: number;
  pageSize?: number;
}

export interface PublishedFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface PublishedFacetSummary {
  genres: PublishedFacetOption[];
  years: PublishedFacetOption[];
  regions: PublishedFacetOption[];
}

export interface PublishedCatalogCard {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  originalTitle?: string | null;
  type: PublishedMediaType;
  status: PublishedMediaStatus;
  year: number;
  endYear?: number | null;
  originCountry?: string | null;
  language?: string | null;
  genreLabels: string[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
  ratingValue?: number | null;
  ratingCount: number;
  availabilityLabel: string;
  episodeCount?: number | null;
  episodeCountLabel?: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
}

export interface PublishedCatalogPageRecord {
  scope: PublishedCatalogScope;
  q: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: PublishedCatalogCard[];
  facets: PublishedFacetSummary;
}

export interface PublishedMediaIdentityRecord {
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
  ratingValue?: number | null;
  ratingCount: number;
  popularityScore: number;
  genres: string[];
  alternateTitles: string[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
  canonicalWatchHref: string;
  compatibilityHref: string;
  publishedAt: string;
}

export interface PublishedPlaybackResourceRecord {
  id: string;
  publicId: string;
  mediaPublicId: string;
  episodePublicId?: string;
  kind: PublishedResourceKind;
  provider: PublishedResourceProvider;
  format: string;
  label: string;
  quality?: string | null;
  status: PublishedResourceStatus;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  canonicalWatchHref: string;
  watchQuery: PublishedWatchQuery;
}

export interface PublishedEpisodeRecord {
  id: string;
  publicId: string;
  mediaPublicId: string;
  slug: string;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  title: string;
  summary?: string | null;
  runtimeMinutes?: number | null;
  canonicalWatchHref: string;
  watchQuery: PublishedWatchQuery;
}

export interface PublishedSeasonRecord {
  id: string;
  seasonNumber: number;
  title?: string | null;
  releaseYear?: number | null;
  episodeCount?: number | null;
  episodes: PublishedEpisodeRecord[];
}

export interface PublishedDetailRecord {
  media: PublishedMediaIdentityRecord;
  seasons: PublishedSeasonRecord[];
  episodes: PublishedEpisodeRecord[];
  streamResources: PublishedPlaybackResourceRecord[];
  downloadResources: PublishedPlaybackResourceRecord[];
  subtitleResources: PublishedPlaybackResourceRecord[];
  defaultEpisodePublicId?: string;
  related: PublishedCatalogCard[];
}

export interface PublishedListItemRecord {
  publicRef: string;
  position: number;
  positionLabel: string;
  mediaPublicId: string;
  mediaSlug: string;
  mediaTitle: string;
  posterUrl?: string | null;
  episodePublicId?: string;
  episodeTitle?: string;
  subtitle: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchQuery: PublishedWatchQuery;
  previousItem?: {
    publicRef: string;
    position: number;
    title: string;
    canonicalWatchHref: string;
  };
  nextItem?: {
    publicRef: string;
    position: number;
    title: string;
    canonicalWatchHref: string;
  };
}

export interface PublishedListSummaryRecord {
  id: string;
  publicId: string;
  title: string;
  description?: string | null;
  canonicalListHref: string;
  shareHref: string;
  shareTitle: string;
  shareDescription: string;
  itemCount: number;
  itemCountLabel: string;
  coverPosterUrl?: string | null;
  coverBackdropUrl?: string | null;
}

export interface PublishedListRecord extends PublishedListSummaryRecord {
  items: PublishedListItemRecord[];
}

export interface PublishedListDirectoryRecord {
  title: string;
  description: string;
  canonicalDirectoryHref: string;
  listCount: number;
  listCountLabel: string;
  items: PublishedListSummaryRecord[];
}

export interface PublishedListQueueItem {
  publicRef: string;
  position: number;
  positionLabel: string;
  title: string;
  subtitle: string;
  posterUrl?: string | null;
  canonicalWatchHref: string;
  isCurrent: boolean;
  isPlayed: boolean;
  isUpNext: boolean;
}

export interface PublishedListQueueRecord {
  listPublicId: string;
  listTitle: string;
  canonicalListHref: string;
  totalItems: number;
  totalItemsLabel: string;
  currentItem?: PublishedListQueueItem;
  previousItem?: PublishedListQueueItem;
  nextItem?: PublishedListQueueItem;
  items: PublishedListQueueItem[];
  upcomingItems: PublishedListQueueItem[];
}

export interface PublishedWatchRecord {
  media: PublishedMediaIdentityRecord;
  selectedEpisode?: PublishedEpisodeRecord;
  selectedResource?: PublishedPlaybackResourceRecord;
  streamResources: PublishedPlaybackResourceRecord[];
  downloadResources: PublishedPlaybackResourceRecord[];
  subtitleResources: PublishedPlaybackResourceRecord[];
  episodeOptions: PublishedEpisodeRecord[];
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchQuery: PublishedWatchQuery;
  list?: PublishedListRecord;
  listItem?: PublishedListItemRecord;
  queue?: PublishedListQueueRecord;
}

export interface PublishedFeaturedListDiscoveryRecord {
  title: string;
  description: string;
  items: PublishedListSummaryRecord[];
}

export interface CatalogPublishInput {
  decisionType: Exclude<ReviewDecisionType, "reject">;
  normalizedCandidate: PersistedNormalizedCandidateRecord;
  aliases: PersistedCandidateAliasRecord[];
  targetCanonicalMediaId?: string;
  actorId?: string;
  performedAt: Date;
}

export interface CatalogPublishResult {
  mediaId: string;
  action: "created" | "merged" | "replaced" | "unpublished";
  alternateTitleCount: number;
  seasonCountDelta: number;
  episodeCountDelta: number;
}
