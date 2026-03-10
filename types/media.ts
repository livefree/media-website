export type MediaType = "movie" | "series" | "anime";
export type CatalogScope = MediaType | "all";
export type MediaStatus = "draft" | "upcoming" | "ongoing" | "completed" | "archived";
export type CatalogBadgeTone = "new" | "hot" | "updated" | "staff-pick" | "classic";
export type ResourceMode = "stream" | "download";
export type ResourceProvider = "m3u8" | "mp4" | "quark" | "baidu" | "aliyun" | "other";
export type ResourceStatus = "online" | "degraded" | "offline" | "reported";
export type CreditRole = "director" | "actor" | "writer" | "producer" | "creator" | "voice";
export type CatalogSortValue = "latest" | "popular" | "rating";
export type CatalogFacetKey = "type" | "genre" | "year" | "region";

export interface PublicWatchQuery {
  mediaPublicId: string;
  episodePublicId?: string;
  resourcePublicId?: string;
  listPublicId?: string;
  listItemPublicRef?: string;
  timeSeconds?: number;
}

export interface PublicListContext {
  listPublicId: string;
  listItemPublicRef?: string;
}

export interface ResolvedPublicPlayback {
  media: MediaItem;
  episode?: EpisodeItem;
  resource?: MediaResourceLink;
  list?: PublicMediaListPageRecord;
  listItem?: PublicMediaListItem;
}

export interface RatingSnapshot {
  source: string;
  value: number;
  count?: number;
}

export interface MediaBadge {
  label: string;
  tone: CatalogBadgeTone;
}

export interface PersonCredit {
  name: string;
  role: CreditRole;
  characterName?: string;
}

export interface MediaResourceLink {
  id: string;
  publicId: string;
  label: string;
  mode: ResourceMode;
  provider: ResourceProvider;
  format: string;
  quality?: string;
  url: string;
  maskedUrl?: string;
  accessCode?: string;
  status: ResourceStatus;
  reportCount?: number;
  canonicalWatchHref: string;
}

export interface EpisodeItem {
  id: string;
  publicId: string;
  slug: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  summary?: string;
  runtimeMinutes?: number;
  canonicalWatchHref: string;
  streamLinks: MediaResourceLink[];
  downloadLinks: MediaResourceLink[];
}

export interface SeasonItem {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: EpisodeItem[];
}

export interface MediaResourceSummary {
  streamCount: number;
  downloadCount: number;
  episodeCount: number;
  availabilityLabel: string;
}

export interface MediaMetrics {
  weeklyViews: number;
  weeklySearches: number;
  saves: number;
  completionRate: number;
}

export interface MediaItem {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  originalTitle?: string;
  tagline: string;
  synopsis: string;
  type: MediaType;
  status: MediaStatus;
  year: number;
  endYear?: number;
  originCountry: string;
  genres: string[];
  tags: string[];
  rating: RatingSnapshot;
  posterUrl: string;
  backdropUrl?: string;
  badge: MediaBadge;
  credits: PersonCredit[];
  seasons: SeasonItem[];
  resources: MediaResourceLink[];
  resourceSummary: MediaResourceSummary;
  metrics: MediaMetrics;
  isFeatured: boolean;
  isHotSearch: boolean;
  canonicalWatchHref: string;
  compatibilityHref: string;
}

export interface CatalogCategory {
  slug: string;
  label: string;
  href: string;
  mediaType?: MediaType;
  description: string;
}

export interface CatalogFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface CatalogFilterGroup {
  id: "sort" | CatalogFacetKey;
  label: string;
  options: CatalogFilterOption[];
}

export interface SearchSuggestion {
  slug: string;
  href: string;
  publicId: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchContext: PublicWatchQuery;
  title: string;
  type: MediaType;
  year: number;
  rating?: number;
}

export interface CatalogQueryState {
  q: string;
  type: CatalogScope;
  genre?: string;
  year?: number;
  region?: string;
  sort: CatalogSortValue;
  page: number;
  pageSize: number;
}

export interface BrowseMediaStat {
  label: string;
  value: string;
}

export interface BrowseMediaCard {
  id: string;
  publicId: string;
  slug: string;
  href: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchContext: PublicWatchQuery;
  title: string;
  originalTitle?: string;
  year: number;
  yearLabel: string;
  type: MediaType;
  typeLabel: string;
  posterUrl: string;
  ratingValue: number;
  ratingLabel: string;
  badge: MediaBadge;
  status: MediaStatus;
  statusLabel: string;
  genres: string[];
  availabilityLabel: string;
  stats: BrowseMediaStat[];
}

export interface CatalogFacetSummary {
  genres: CatalogFilterOption[];
  years: CatalogFilterOption[];
  regions: CatalogFilterOption[];
}

export interface CatalogCoverageSummary {
  totalTitles: number;
  pageSize: number;
  totalPages: number;
  byType: Record<MediaType, number>;
  uniqueGenreCount: number;
  uniqueRegionCount: number;
  uniqueYearCount: number;
  typeGenrePairCount: number;
  typeRegionPairCount: number;
  typeYearPairCount: number;
}

export interface CatalogFeed {
  scope: CatalogScope;
  title: string;
  description: string;
  href: string;
  items: BrowseMediaCard[];
}

export interface PlaybackSourceOption {
  id: string;
  publicId: string;
  mediaSlug: string;
  mediaPublicId: string;
  episodeSlug?: string;
  episodePublicId?: string;
  label: string;
  provider: ResourceProvider;
  providerLabel: string;
  quality?: string;
  format: string;
  status: ResourceStatus;
  url: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  canonicalWatchHref: string;
  watchContext: PublicWatchQuery;
}

export interface DownloadResourceOption {
  id: string;
  publicId: string;
  mediaSlug: string;
  mediaPublicId: string;
  episodeSlug?: string;
  episodePublicId?: string;
  label: string;
  provider: ResourceProvider;
  providerLabel: string;
  quality?: string;
  format: string;
  status: ResourceStatus;
  url: string;
  maskedUrl?: string;
  accessCode?: string;
  reportCount?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  canonicalWatchHref: string;
  watchContext: PublicWatchQuery;
}

export interface MediaEpisodeOption {
  id: string;
  publicId: string;
  slug: string;
  mediaPublicId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  runtimeMinutes?: number;
  summary?: string;
  streamCount: number;
  downloadCount: number;
  isDefault: boolean;
  canonicalWatchHref: string;
  watchContext: PublicWatchQuery;
}

export interface MediaDetailMetadata {
  title: string;
  originalTitle?: string;
  yearLabel: string;
  countryLabel: string;
  genreLabel: string;
  ratingLabel: string;
  credits: PersonCredit[];
  directors: string[];
  cast: string[];
}

export interface MediaDetailRecord {
  media: MediaItem;
  href: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchContext: PublicWatchQuery;
  metadata: MediaDetailMetadata;
  playbackSources: PlaybackSourceOption[];
  downloads: DownloadResourceOption[];
  episodes: MediaEpisodeOption[];
  defaultEpisodeSlug?: string;
  defaultEpisodePublicId?: string;
  relatedCards: BrowseMediaCard[];
}

export interface PublicMediaListItem {
  publicRef: string;
  position: number;
  positionLabel: string;
  mediaSlug: string;
  mediaPublicId: string;
  posterUrl: string;
  mediaTitle: string;
  title: string;
  subtitle: string;
  episodeSlug?: string;
  episodePublicId?: string;
  canonicalWatchHref: string;
  compatibilityHref: string;
  watchContext: PublicWatchQuery;
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

export interface PublicMediaList {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  description: string;
  visibility: "public" | "unlisted";
  canonicalListHref: string;
  itemCount: number;
  coverPosterUrl?: string;
  firstItemPublicRef?: string;
  firstItemWatchHref?: string;
}

export interface PublicMediaListPageRecord extends PublicMediaList {
  items: PublicMediaListItem[];
}
