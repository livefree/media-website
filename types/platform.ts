import type { MediaType, ResourceMode, ResourceProvider } from "./media";

export type AccountRole = "viewer" | "editor" | "admin";
export type SubscriptionTier = "guest" | "free" | "plus" | "vip";
export type BrowseEventType =
  | "home_view"
  | "category_view"
  | "search"
  | "detail_view"
  | "player_open"
  | "resource_action";
export type DeviceType = "web" | "ios" | "android" | "tv" | "desktop";
export type ResourceAction = "open" | "copy" | "qr_scan" | "report_invalid";
export type PublicListVisibility = "public" | "unlisted";

export interface ContinueWatchingRecord {
  mediaSlug: string;
  episodeSlug?: string;
  progressPercent: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  updatedAt: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  tier: SubscriptionTier;
  locale: string;
  timezone: string;
  preferredGenres: string[];
  preferredTypes: MediaType[];
  watchlistSlugs: string[];
  favoriteSlugs: string[];
  continueWatching: ContinueWatchingRecord[];
}

export interface SearchRecord {
  id: string;
  userId?: string;
  query: string;
  scope: MediaType | "all";
  resultCount: number;
  clickedSlug?: string;
  createdAt: string;
}

export interface BrowseEventRecord {
  id: string;
  userId?: string;
  mediaSlug?: string;
  eventType: BrowseEventType;
  route: string;
  device: DeviceType;
  durationMs?: number;
  createdAt: string;
}

export interface ResourceActivityRecord {
  id: string;
  userId?: string;
  mediaSlug: string;
  episodeSlug?: string;
  provider: ResourceProvider;
  mode: ResourceMode;
  action: ResourceAction;
  createdAt: string;
}

export interface PublicListItemRecord {
  publicRef: string;
  mediaSlug: string;
  episodeSlug?: string;
}

export interface PublicListRecord {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  description: string;
  visibility: PublicListVisibility;
  discoveryRank?: number;
  shareTitle?: string;
  shareDescription?: string;
  items: PublicListItemRecord[];
}
