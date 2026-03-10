import type {
  BrowseMediaCard,
  CatalogBadgeTone,
  DownloadResourceOption,
  EpisodeItem,
  MediaDetailMetadata,
  MediaEpisodeOption,
  MediaItem,
  MediaResourceLink,
  MediaStatus,
  MediaType,
  PlaybackSourceOption,
  PublicWatchQuery,
  ResourceProvider,
} from "../types/media";

const badgePriority: Record<CatalogBadgeTone, number> = {
  hot: 5,
  new: 4,
  updated: 3,
  "staff-pick": 2,
  classic: 1,
};

const mediaTypeLabels: Record<MediaType, string> = {
  movie: "Movie",
  series: "Series",
  anime: "Anime",
};

const mediaStatusLabels: Record<MediaStatus, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  archived: "Archived",
};

const providerLabels: Record<ResourceProvider, string> = {
  m3u8: "M3U8",
  mp4: "MP4",
  quark: "Quark",
  baidu: "Baidu",
  aliyun: "Aliyun",
  other: "Other",
};

export function buildWatchHref({
  mediaPublicId,
  episodePublicId,
  resourcePublicId,
  listPublicId,
  listItemPublicRef,
  timeSeconds,
}: PublicWatchQuery): string {
  const params = new URLSearchParams();
  params.set("v", mediaPublicId);

  if (episodePublicId) {
    params.set("e", episodePublicId);
  }

  if (resourcePublicId) {
    params.set("r", resourcePublicId);
  }

  if (listPublicId) {
    params.set("list", listPublicId);
  }

  if (listItemPublicRef) {
    params.set("li", listItemPublicRef);
  }

  if (typeof timeSeconds === "number" && Number.isFinite(timeSeconds) && timeSeconds > 0) {
    params.set("t", String(Math.floor(timeSeconds)));
  }

  return `/watch?${params.toString()}`;
}

export function buildPublicListHref(publicId: string): string {
  return `/list/${publicId}`;
}

export function buildPublicListDirectoryHref(): string {
  return "/lists";
}

export function buildMediaWatchContext(
  media: Pick<MediaItem, "publicId">,
  options?: Omit<PublicWatchQuery, "mediaPublicId">,
): PublicWatchQuery {
  return {
    mediaPublicId: media.publicId,
    episodePublicId: options?.episodePublicId,
    resourcePublicId: options?.resourcePublicId,
    listPublicId: options?.listPublicId,
    listItemPublicRef: options?.listItemPublicRef,
    timeSeconds: options?.timeSeconds,
  };
}

export function buildCompatibilityWatchHref(
  media: Pick<MediaItem, "slug">,
  options?: {
    episodeSlug?: string;
  },
): string {
  const params = new URLSearchParams();

  if (options?.episodeSlug) {
    params.set("episode", options.episodeSlug);
  }

  const query = params.toString();
  return query ? `/media/${media.slug}?${query}` : `/media/${media.slug}`;
}

export function buildListItemSubtitle(media: Pick<MediaItem, "type" | "year" | "originalTitle">, episode?: Pick<EpisodeItem, "episodeNumber" | "title">): string {
  if (episode) {
    const episodeLabel = episode.episodeNumber ? `E${String(episode.episodeNumber).padStart(2, "0")}` : "Episode";
    return [String(media.year), episodeLabel, episode.title].filter(Boolean).join(" · ");
  }

  return [media.originalTitle, String(media.year), getMediaTypeLabel(media.type)].filter(Boolean).join(" · ");
}

export function getPublicListVisibilityLabel(visibility: "public" | "unlisted"): string {
  return visibility === "unlisted" ? "Unlisted" : "Public";
}

export function buildListCountLabel(count: number): string {
  return `${count} titles`;
}

export function getCompatibilityMediaHref(media: Pick<MediaItem, "slug">): string {
  return buildCompatibilityWatchHref(media);
}

// Legacy helper retained so current slug routes can remain compatibility entry points.
export function getMediaHref(media: Pick<MediaItem, "slug">): string {
  return getCompatibilityMediaHref(media);
}

export function getCanonicalWatchHref(
  media: Pick<MediaItem, "publicId">,
  options?: {
    episode?: Pick<EpisodeItem, "publicId">;
    resource?: Pick<MediaResourceLink, "publicId">;
    listPublicId?: string;
    listItemPublicRef?: string;
    timeSeconds?: number;
  },
): string {
  return buildWatchHref(
    buildMediaWatchContext(media, {
      episodePublicId: options?.episode?.publicId,
      resourcePublicId: options?.resource?.publicId,
      listPublicId: options?.listPublicId,
      listItemPublicRef: options?.listItemPublicRef,
      timeSeconds: options?.timeSeconds,
    }),
  );
}

export function getMediaTypeLabel(type: MediaType): string {
  return mediaTypeLabels[type];
}

export function getMediaStatusLabel(status: MediaStatus): string {
  return mediaStatusLabels[status];
}

export function getProviderLabel(provider: ResourceProvider): string {
  return providerLabels[provider];
}

export function flattenMediaResources(media: MediaItem): MediaResourceLink[] {
  const episodeResources = media.seasons.flatMap((season) =>
    season.episodes.flatMap((episode) => [...episode.streamLinks, ...episode.downloadLinks]),
  );

  return [...media.resources, ...episodeResources];
}

export function getEpisodeCount(media: MediaItem): number {
  return media.seasons.reduce((total, season) => total + season.episodes.length, 0);
}

export function getResourceCounts(media: MediaItem) {
  return flattenMediaResources(media).reduce(
    (totals, resource) => {
      if (resource.mode === "stream") {
        totals.streamCount += 1;
      } else {
        totals.downloadCount += 1;
      }

      return totals;
    },
    { streamCount: 0, downloadCount: 0 },
  );
}

export function buildMediaSearchText(media: MediaItem): string {
  return [
    media.title,
    media.originalTitle,
    media.tagline,
    media.synopsis,
    media.originCountry,
    ...media.genres,
    ...media.tags,
    ...media.credits.map((credit) => credit.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function compareFeaturedMedia(left: MediaItem, right: MediaItem): number {
  const featuredDelta = Number(right.isFeatured) - Number(left.isFeatured);
  if (featuredDelta !== 0) {
    return featuredDelta;
  }

  const badgeDelta = badgePriority[right.badge.tone] - badgePriority[left.badge.tone];
  if (badgeDelta !== 0) {
    return badgeDelta;
  }

  const demandDelta =
    right.metrics.weeklyViews +
    right.metrics.weeklySearches -
    (left.metrics.weeklyViews + left.metrics.weeklySearches);

  if (demandDelta !== 0) {
    return demandDelta;
  }

  return right.rating.value - left.rating.value;
}

export function buildBrowseMediaCard(media: MediaItem): BrowseMediaCard {
  const watchContext = buildMediaWatchContext(media);

  return {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    href: media.canonicalWatchHref,
    canonicalWatchHref: media.canonicalWatchHref,
    compatibilityHref: media.compatibilityHref,
    watchContext,
    title: media.title,
    originalTitle: media.originalTitle,
    year: media.year,
    yearLabel: media.endYear ? `${media.year}-${media.endYear}` : String(media.year),
    type: media.type,
    typeLabel: getMediaTypeLabel(media.type),
    posterUrl: media.posterUrl,
    ratingValue: media.rating.value,
    ratingLabel: `${media.rating.value.toFixed(1)} ${media.rating.source}`,
    badge: media.badge,
    status: media.status,
    statusLabel: getMediaStatusLabel(media.status),
    genres: media.genres,
    availabilityLabel: media.resourceSummary.availabilityLabel,
    stats: [
      { label: "Streams", value: String(media.resourceSummary.streamCount) },
      { label: "Downloads", value: String(media.resourceSummary.downloadCount) },
      { label: "Weekly views", value: String(media.metrics.weeklyViews) },
    ],
  };
}

export function getPlaybackSources(media: MediaItem): PlaybackSourceOption[] {
  const titleSources = media.resources
    .filter((resource) => resource.mode === "stream")
    .map((resource) => {
      const watchContext = buildMediaWatchContext(media, {
        resourcePublicId: resource.publicId,
      });

      return {
        id: resource.id,
        publicId: resource.publicId,
        mediaSlug: media.slug,
        mediaPublicId: media.publicId,
        label: resource.label,
        provider: resource.provider,
        providerLabel: getProviderLabel(resource.provider),
        quality: resource.quality,
        format: resource.format,
        status: resource.status,
        url: resource.url,
        canonicalWatchHref: resource.canonicalWatchHref,
        watchContext,
      };
    });

  const episodeSources = media.seasons.flatMap((season) =>
    season.episodes.flatMap((episode) =>
      episode.streamLinks.map((resource) => {
        const watchContext = buildMediaWatchContext(media, {
          episodePublicId: episode.publicId,
          resourcePublicId: resource.publicId,
        });

        return {
          id: resource.id,
          publicId: resource.publicId,
          mediaSlug: media.slug,
          mediaPublicId: media.publicId,
          episodeSlug: episode.slug,
          episodePublicId: episode.publicId,
          label: resource.label,
          provider: resource.provider,
          providerLabel: getProviderLabel(resource.provider),
          quality: resource.quality,
          format: resource.format,
          status: resource.status,
          url: resource.url,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.title,
          canonicalWatchHref: resource.canonicalWatchHref,
          watchContext,
        };
      }),
    ),
  );

  return [...titleSources, ...episodeSources];
}

export function getDownloadResources(media: MediaItem): DownloadResourceOption[] {
  const titleDownloads = media.resources
    .filter((resource) => resource.mode === "download")
    .map((resource) => {
      const watchContext = buildMediaWatchContext(media, {
        resourcePublicId: resource.publicId,
      });

      return {
        id: resource.id,
        publicId: resource.publicId,
        mediaSlug: media.slug,
        mediaPublicId: media.publicId,
        label: resource.label,
        provider: resource.provider,
        providerLabel: getProviderLabel(resource.provider),
        quality: resource.quality,
        format: resource.format,
        status: resource.status,
        url: resource.url,
        maskedUrl: resource.maskedUrl,
        accessCode: resource.accessCode,
        reportCount: resource.reportCount,
        canonicalWatchHref: resource.canonicalWatchHref,
        watchContext,
      };
    });

  const episodeDownloads = media.seasons.flatMap((season) =>
    season.episodes.flatMap((episode) =>
      episode.downloadLinks.map((resource) => {
        const watchContext = buildMediaWatchContext(media, {
          episodePublicId: episode.publicId,
          resourcePublicId: resource.publicId,
        });

        return {
          id: resource.id,
          publicId: resource.publicId,
          mediaSlug: media.slug,
          mediaPublicId: media.publicId,
          episodeSlug: episode.slug,
          episodePublicId: episode.publicId,
          label: resource.label,
          provider: resource.provider,
          providerLabel: getProviderLabel(resource.provider),
          quality: resource.quality,
          format: resource.format,
          status: resource.status,
          url: resource.url,
          maskedUrl: resource.maskedUrl,
          accessCode: resource.accessCode,
          reportCount: resource.reportCount,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.title,
          canonicalWatchHref: resource.canonicalWatchHref,
          watchContext,
        };
      }),
    ),
  );

  return [...titleDownloads, ...episodeDownloads];
}

export function getEpisodeOptions(media: MediaItem): MediaEpisodeOption[] {
  return media.seasons.flatMap((season, seasonIndex) =>
    season.episodes.map((episode, episodeIndex) => {
      const watchContext = buildMediaWatchContext(media, {
        episodePublicId: episode.publicId,
      });

      return {
        id: episode.id,
        publicId: episode.publicId,
        slug: episode.slug,
        mediaPublicId: media.publicId,
        seasonNumber: season.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        runtimeMinutes: episode.runtimeMinutes,
        summary: episode.summary,
        streamCount: episode.streamLinks.length,
        downloadCount: episode.downloadLinks.length,
        isDefault: seasonIndex === 0 && episodeIndex === 0,
        canonicalWatchHref: episode.canonicalWatchHref,
        watchContext,
      };
    }),
  );
}

export function buildDetailMetadata(media: MediaItem): MediaDetailMetadata {
  return {
    title: media.title,
    originalTitle: media.originalTitle,
    yearLabel: media.endYear ? `${media.year}-${media.endYear}` : String(media.year),
    countryLabel: media.originCountry,
    genreLabel: media.genres.join(" / "),
    ratingLabel: `${media.rating.value.toFixed(1)} ${media.rating.source}`,
    credits: media.credits,
    directors: media.credits.filter((credit) => credit.role === "director" || credit.role === "creator").map((credit) => credit.name),
    cast: media.credits.filter((credit) => credit.role === "actor" || credit.role === "voice").map((credit) => credit.name),
  };
}
