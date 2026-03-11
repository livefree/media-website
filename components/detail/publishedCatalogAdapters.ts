import type {
  DownloadResourceOption,
  MediaDetailMetadata,
  MediaDetailRecord,
  MediaEpisodeOption,
  MediaItem,
  PlaybackSourceOption,
  PublicListQueueRecord,
  PublicMediaListItem,
  PublicMediaListPageRecord,
  BrowseMediaCard,
  MediaType,
  MediaStatus,
  ResourceProvider,
  ResourceStatus,
} from "../../types/media";
import type {
  PublishedCatalogCard,
  PublishedDetailRecord,
  PublishedEpisodeRecord,
  PublishedListItemRecord,
  PublishedListQueueItem,
  PublishedListQueueRecord,
  PublishedListRecord,
  PublishedMediaIdentityRecord,
  PublishedPlaybackResourceRecord,
  PublishedResourceProvider,
  PublishedResourceStatus,
} from "../../lib/server/catalog/types";

function toMediaType(type: PublishedMediaIdentityRecord["type"] | PublishedCatalogCard["type"]): MediaType {
  if (type === "series") {
    return "series";
  }

  if (type === "anime") {
    return "anime";
  }

  return "movie";
}

function toMediaStatus(status: PublishedMediaIdentityRecord["status"] | PublishedCatalogCard["status"]): MediaStatus {
  if (status === "upcoming") {
    return "upcoming";
  }

  if (status === "completed") {
    return "completed";
  }

  if (status === "archived") {
    return "archived";
  }

  if (status === "draft") {
    return "draft";
  }

  return "ongoing";
}

function toResourceProvider(provider: PublishedResourceProvider): ResourceProvider {
  if (
    provider === "m3u8" ||
    provider === "mp4" ||
    provider === "quark" ||
    provider === "baidu" ||
    provider === "aliyun"
  ) {
    return provider;
  }

  return "other";
}

function toResourceStatus(status: PublishedResourceStatus): ResourceStatus {
  if (status === "offline" || status === "reported") {
    return status;
  }

  if (status === "degraded") {
    return "degraded";
  }

  return "online";
}

function buildAvailabilityLabel(streamCount: number, downloadCount: number, episodeCount?: number | null) {
  const parts = [
    `${streamCount} stream${streamCount === 1 ? "" : "s"}`,
    `${downloadCount} download${downloadCount === 1 ? "" : "s"}`,
  ];

  if (episodeCount && episodeCount > 0) {
    parts.push(`${episodeCount} episode${episodeCount === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

function buildYearLabel(media: PublishedMediaIdentityRecord) {
  if (media.endYear && media.endYear !== media.releaseYear) {
    return `${media.releaseYear}-${media.endYear}`;
  }

  return String(media.releaseYear);
}

function buildRatingLabel(media: PublishedMediaIdentityRecord) {
  if (typeof media.ratingValue === "number") {
    return `Douban ${media.ratingValue.toFixed(1)}`;
  }

  return "Douban 暂无评分";
}

function buildBaseMedia(
  media: PublishedMediaIdentityRecord,
  resourceCounts: {
    streamCount: number;
    downloadCount: number;
  },
): MediaItem {
  const type = toMediaType(media.type);
  const episodeCount = media.episodeCount ?? 0;

  return {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    title: media.title,
    originalTitle: media.originalTitle ?? undefined,
    tagline: media.tagline ?? "",
    synopsis: media.description ?? media.summary,
    type,
    status: toMediaStatus(media.status),
    year: media.releaseYear,
    endYear: media.endYear ?? undefined,
    originCountry: media.originCountry ?? "Unknown",
    genres: media.genres,
    tags: [],
    rating: {
      source: "Douban",
      value: media.ratingValue ?? 0,
      count: media.ratingCount,
    },
    posterUrl: media.posterUrl ?? "",
    backdropUrl: media.backdropUrl ?? undefined,
    badge: {
      label: type.toUpperCase(),
      tone: typeof media.ratingValue === "number" && media.ratingValue >= 8 ? "hot" : "updated",
    },
    credits: [],
    seasons: [],
    resources: [],
    resourceSummary: {
      streamCount: resourceCounts.streamCount,
      downloadCount: resourceCounts.downloadCount,
      episodeCount,
      availabilityLabel: buildAvailabilityLabel(resourceCounts.streamCount, resourceCounts.downloadCount, episodeCount),
    },
    metrics: {
      weeklyViews: 0,
      weeklySearches: 0,
      saves: 0,
      completionRate: 0,
    },
    isFeatured: false,
    isHotSearch: false,
    canonicalWatchHref: media.canonicalWatchHref,
    compatibilityHref: media.compatibilityHref,
  };
}

export function mapPublishedMetadata(media: PublishedMediaIdentityRecord): MediaDetailMetadata {
  return {
    title: media.title,
    originalTitle: media.originalTitle ?? undefined,
    yearLabel: buildYearLabel(media),
    countryLabel: media.originCountry ?? "Unknown",
    genreLabel: media.genres.length > 0 ? media.genres.join(" / ") : "未分类",
    ratingLabel: buildRatingLabel(media),
    credits: [],
    directors: [],
    cast: [],
  };
}

function mapPublishedPlaybackSource(resource: PublishedPlaybackResourceRecord): PlaybackSourceOption {
  return {
    id: resource.id,
    publicId: resource.publicId,
    mediaSlug: "",
    mediaPublicId: resource.mediaPublicId,
    episodeSlug: undefined,
    episodePublicId: resource.episodePublicId,
    label: resource.label,
    provider: toResourceProvider(resource.provider),
    providerLabel: resource.provider.toUpperCase(),
    quality: resource.quality ?? undefined,
    format: resource.format,
    status: toResourceStatus(resource.status),
    url: resource.url,
    seasonNumber: undefined,
    episodeNumber: undefined,
    episodeTitle: undefined,
    canonicalWatchHref: resource.canonicalWatchHref,
    watchContext: resource.watchQuery,
  };
}

function mapPublishedDownloadResource(resource: PublishedPlaybackResourceRecord): DownloadResourceOption {
  return {
    id: resource.id,
    publicId: resource.publicId,
    mediaSlug: "",
    mediaPublicId: resource.mediaPublicId,
    episodeSlug: undefined,
    episodePublicId: resource.episodePublicId,
    label: resource.label,
    provider: toResourceProvider(resource.provider),
    providerLabel: resource.provider.toUpperCase(),
    quality: resource.quality ?? undefined,
    format: resource.format,
    status: toResourceStatus(resource.status),
    url: resource.url,
    maskedUrl: resource.maskedUrl ?? undefined,
    accessCode: resource.accessCode ?? undefined,
    reportCount: 0,
    seasonNumber: undefined,
    episodeNumber: undefined,
    episodeTitle: undefined,
    canonicalWatchHref: resource.canonicalWatchHref,
    watchContext: resource.watchQuery,
  };
}

function countEpisodeResources(resources: PublishedPlaybackResourceRecord[], episodePublicId: string | undefined) {
  return resources.filter((resource) => resource.episodePublicId === episodePublicId || !resource.episodePublicId).length;
}

function mapPublishedEpisodeOption(
  episode: PublishedEpisodeRecord,
  streamResources: PublishedPlaybackResourceRecord[],
  downloadResources: PublishedPlaybackResourceRecord[],
  defaultEpisodePublicId?: string,
): MediaEpisodeOption {
  return {
    id: episode.id,
    publicId: episode.publicId,
    slug: episode.slug,
    mediaPublicId: episode.mediaPublicId,
    seasonNumber: episode.seasonNumber ?? 1,
    episodeNumber: episode.episodeNumber ?? 0,
    title: episode.title,
    runtimeMinutes: episode.runtimeMinutes ?? undefined,
    summary: episode.summary ?? undefined,
    streamCount: countEpisodeResources(streamResources, episode.publicId),
    downloadCount: countEpisodeResources(downloadResources, episode.publicId),
    isDefault: defaultEpisodePublicId === episode.publicId,
    canonicalWatchHref: episode.canonicalWatchHref,
    watchContext: episode.watchQuery,
  };
}

function mapPublishedRelatedCard(item: PublishedCatalogCard): BrowseMediaCard {
  const type = toMediaType(item.type);

  return {
    id: item.id,
    publicId: item.publicId,
    slug: item.slug,
    href: item.canonicalWatchHref,
    canonicalWatchHref: item.canonicalWatchHref,
    compatibilityHref: item.compatibilityHref,
    watchContext: {
      mediaPublicId: item.publicId,
    },
    title: item.title,
    originalTitle: item.originalTitle ?? undefined,
    year: item.year,
    yearLabel: String(item.year),
    type,
    typeLabel: type,
    posterUrl: item.posterUrl ?? "",
    ratingValue: item.ratingValue ?? 0,
    ratingLabel: typeof item.ratingValue === "number" ? item.ratingValue.toFixed(1) : "—",
    badge: {
      label: type.toUpperCase(),
      tone: typeof item.ratingValue === "number" && item.ratingValue >= 8 ? "hot" : "updated",
    },
    status: toMediaStatus(item.status),
    statusLabel: item.status,
    genres: item.genreLabels,
    availabilityLabel: item.availabilityLabel,
    episodeCountLabel: item.episodeCountLabel,
    stats: [],
  };
}

function mapPublishedListItem(item: PublishedListItemRecord): PublicMediaListItem {
  return {
    publicRef: item.publicRef,
    position: item.position,
    positionLabel: item.positionLabel,
    mediaSlug: item.mediaSlug,
    mediaPublicId: item.mediaPublicId,
    posterUrl: item.posterUrl ?? "",
    mediaTitle: item.mediaTitle,
    title: item.mediaTitle,
    subtitle: item.subtitle,
    episodeSlug: undefined,
    episodePublicId: item.episodePublicId,
    canonicalWatchHref: item.canonicalWatchHref,
    compatibilityHref: item.compatibilityHref,
    watchContext: item.watchQuery,
    previousItem: item.previousItem,
    nextItem: item.nextItem,
  };
}

export function mapPublishedList(list: PublishedListRecord): PublicMediaListPageRecord {
  return {
    id: list.id,
    publicId: list.publicId,
    slug: list.publicId,
    title: list.title,
    description: list.description ?? "",
    visibility: "public",
    canonicalListHref: list.canonicalListHref,
    shareHref: list.shareHref,
    shareTitle: list.shareTitle,
    shareDescription: list.shareDescription,
    visibilityLabel: "公开列表",
    itemCount: list.itemCount,
    itemCountLabel: list.itemCountLabel,
    coverPosterUrl: list.coverPosterUrl ?? undefined,
    coverBackdropUrl: list.coverBackdropUrl ?? undefined,
    firstItemPublicRef: list.items[0]?.publicRef,
    firstItemWatchHref: list.items[0]?.canonicalWatchHref,
    items: list.items.map(mapPublishedListItem),
  };
}

function mapPublishedQueueItem(item: PublishedListQueueItem) {
  return {
    publicRef: item.publicRef,
    position: item.position,
    positionLabel: item.positionLabel,
    title: item.title,
    subtitle: item.subtitle,
    posterUrl: item.posterUrl ?? "",
    canonicalWatchHref: item.canonicalWatchHref,
    isCurrent: item.isCurrent,
    isPlayed: item.isPlayed,
    isUpNext: item.isUpNext,
  };
}

export function mapPublishedQueue(queue: PublishedListQueueRecord): PublicListQueueRecord {
  return {
    listPublicId: queue.listPublicId,
    listTitle: queue.listTitle,
    canonicalListHref: queue.canonicalListHref,
    totalItems: queue.totalItems,
    totalItemsLabel: queue.totalItemsLabel,
    currentItem: queue.currentItem ? mapPublishedQueueItem(queue.currentItem) : undefined,
    previousItem: queue.previousItem ? mapPublishedQueueItem(queue.previousItem) : undefined,
    nextItem: queue.nextItem ? mapPublishedQueueItem(queue.nextItem) : undefined,
    items: queue.items.map(mapPublishedQueueItem),
    upcomingItems: queue.upcomingItems.map(mapPublishedQueueItem),
  };
}

export function mapPublishedDetailRecord(detail: PublishedDetailRecord): MediaDetailRecord {
  const media = buildBaseMedia(detail.media, {
    streamCount: detail.streamResources.length,
    downloadCount: detail.downloadResources.length,
  });

  return {
    media,
    href: detail.media.canonicalWatchHref,
    canonicalWatchHref: detail.media.canonicalWatchHref,
    compatibilityHref: detail.media.compatibilityHref,
    watchContext: {
      mediaPublicId: detail.media.publicId,
    },
    metadata: mapPublishedMetadata(detail.media),
    playbackSources: detail.streamResources.map(mapPublishedPlaybackSource),
    downloads: detail.downloadResources.map(mapPublishedDownloadResource),
    episodes: detail.episodes.map((episode) =>
      mapPublishedEpisodeOption(episode, detail.streamResources, detail.downloadResources, detail.defaultEpisodePublicId),
    ),
    defaultEpisodePublicId: detail.defaultEpisodePublicId,
    relatedCards: detail.related.map(mapPublishedRelatedCard),
  };
}

export function getStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getTimeSeconds(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const raw = getStringParam(searchParams?.t);
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
