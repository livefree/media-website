export type MediaType = "movie" | "series" | "anime";
export type MediaStatus = "draft" | "upcoming" | "ongoing" | "completed" | "archived";
export type CatalogBadgeTone = "new" | "hot" | "updated" | "staff-pick" | "classic";
export type ResourceMode = "stream" | "download";
export type ResourceProvider = "m3u8" | "mp4" | "quark" | "baidu" | "aliyun" | "other";
export type ResourceStatus = "online" | "degraded" | "offline" | "reported";

export type CreditRole = "director" | "actor" | "writer" | "producer" | "creator" | "voice";

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
}

export interface EpisodeItem {
  id: string;
  slug: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  summary?: string;
  runtimeMinutes?: number;
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
}

export interface CatalogFilterGroup {
  id: string;
  label: string;
  options: CatalogFilterOption[];
}

export interface SearchSuggestion {
  slug: string;
  title: string;
  type: MediaType;
  year: number;
  rating?: number;
}
