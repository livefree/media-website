import "server-only";

import type { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";
import { BackendError } from "../../../server/errors";
import {
  attachListContext,
  buildListItemNavigationReference,
  buildPublishedCompatibilityHref,
  buildPublishedListCountLabel,
  buildPublishedListDirectoryHref,
  buildPublishedListHref,
  buildPublishedListItemSubtitle,
  buildPublishedWatchHref,
  buildPublishedWatchQuery,
} from "../../../server/catalog/identity";
import type {
  AdminPublishedCatalogAuditRecord,
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogListItemRecord,
  AdminPublishedCatalogPageRecord,
  AdminPublishedCatalogQuery,
  AdminPublishedCatalogSort,
  AdminPublishedEpisodeDiagnosticRecord,
  AdminPublishedResourceRecord,
} from "../../../server/admin";

import type {
  PublishedCatalogCard,
  PublishedCatalogPageRecord,
  PublishedCatalogQueryInput,
  PublishedCatalogScope,
  PublishedCatalogSort,
  PublishedDetailRecord,
  PublishedEpisodeRecord,
  PublishedFacetOption,
  PublishedListDirectoryRecord,
  PublishedListItemRecord,
  PublishedListQueueItem,
  PublishedListQueueRecord,
  PublishedListRecord,
  PublishedListSummaryRecord,
  PublishedMediaIdentityRecord,
  PublishedMediaStatus,
  PublishedMediaType,
  PublishedPlaybackResourceRecord,
  PublishedResourceKind,
  PublishedResourceProvider,
  PublishedResourceStatus,
  PublishedSeasonRecord,
  UnpublishPublishedCatalogInput,
  UnpublishPublishedCatalogResult,
  PublishedWatchQuery,
  PublishedWatchRecord,
} from "../../../server/catalog";
import type { PublishedCatalogRepository as PublishedCatalogRepositoryContract } from "./types";

const publishedMediaInclude = {
  alternateTitles: true,
  genres: { include: { genre: true } },
  artwork: true,
  seasons: {
    include: {
      episodes: {
        include: {
          resources: {
            include: {
              replacementResource: {
                select: {
                  publicId: true,
                },
              },
            },
          },
        },
        orderBy: [{ episodeNumber: "asc" }, { title: "asc" }],
      },
    },
    orderBy: { seasonNumber: "asc" },
  },
  resources: {
    include: {
      replacementResource: {
        select: {
          publicId: true,
        },
      },
    },
  },
} satisfies Prisma.MediaTitleInclude;

type PublishedMediaPayload = Prisma.MediaTitleGetPayload<{ include: typeof publishedMediaInclude }>;

const adminPublishedMediaInclude = {
  alternateTitles: true,
  genres: { include: { genre: true } },
  artwork: true,
  seasons: {
    include: {
      episodes: {
        include: {
          resources: {
            include: {
              replacementResource: {
                select: {
                  publicId: true,
                },
              },
              providerRegistry: {
                select: {
                  displayName: true,
                },
              },
              repairQueueEntries: {
                where: {
                  status: {
                    in: ["OPEN", "IN_PROGRESS", "WAITING_PROVIDER"],
                  },
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: [{ episodeNumber: "asc" }, { title: "asc" }],
      },
    },
    orderBy: { seasonNumber: "asc" },
  },
  resources: {
    include: {
      replacementResource: {
        select: {
          publicId: true,
        },
      },
      providerRegistry: {
        select: {
          displayName: true,
        },
      },
      repairQueueEntries: {
        where: {
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_PROVIDER"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  },
  publishAuditRecords: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  },
  reviewQueueEntries: {
    orderBy: {
      updatedAt: "desc",
    },
    take: 1,
  },
} satisfies Prisma.MediaTitleInclude;

type AdminPublishedMediaPayload = Prisma.MediaTitleGetPayload<{ include: typeof adminPublishedMediaInclude }>;

const publishedListInclude = {
  items: {
    where: {
      publicRef: {
        not: null,
      },
      media: {
        publishedAt: {
          not: null,
        },
      },
    },
    include: {
      media: {
        include: {
          artwork: true,
        },
      },
      episode: true,
    },
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
  },
} satisfies Prisma.UserListInclude;

type PublishedListPayload = Prisma.UserListGetPayload<{ include: typeof publishedListInclude }>;

function mapMediaType(value: string): PublishedMediaType {
  switch (value) {
    case "MOVIE":
      return "movie";
    case "SERIES":
      return "series";
    case "ANIME":
      return "anime";
    case "VARIETY":
      return "variety";
    case "DOCUMENTARY":
      return "documentary";
    case "SPECIAL":
      return "special";
  }

  throw new Error(`Unsupported media type: ${value}`);
}

function mapMediaStatus(value: string): PublishedMediaStatus {
  switch (value) {
    case "DRAFT":
      return "draft";
    case "UPCOMING":
      return "upcoming";
    case "ONGOING":
      return "ongoing";
    case "COMPLETED":
      return "completed";
    case "HIATUS":
      return "hiatus";
    case "ARCHIVED":
      return "archived";
  }

  throw new Error(`Unsupported media status: ${value}`);
}

function mapResourceKind(value: string): PublishedResourceKind {
  switch (value) {
    case "STREAM":
      return "stream";
    case "DOWNLOAD":
      return "download";
    case "SUBTITLE":
      return "subtitle";
    case "TRAILER":
      return "trailer";
  }

  throw new Error(`Unsupported resource kind: ${value}`);
}

function mapResourceProvider(value: string): PublishedResourceProvider {
  switch (value) {
    case "INTERNAL":
      return "internal";
    case "M3U8":
      return "m3u8";
    case "MP4":
      return "mp4";
    case "QUARK":
      return "quark";
    case "BAIDU":
      return "baidu";
    case "ALIYUN":
      return "aliyun";
    case "MAGNET":
      return "magnet";
    case "OTHER":
      return "other";
  }

  throw new Error(`Unsupported resource provider: ${value}`);
}

function mapResourceStatus(value: string): PublishedResourceStatus {
  switch (value) {
    case "ONLINE":
      return "online";
    case "DEGRADED":
      return "degraded";
    case "OFFLINE":
      return "offline";
    case "REPORTED":
      return "reported";
    case "PENDING":
      return "pending";
  }

  throw new Error(`Unsupported resource status: ${value}`);
}

function mapPublishedSourceHealthState(value: string): PublishedPlaybackResourceRecord["healthState"] {
  switch (value) {
    case "HEALTHY":
      return "healthy";
    case "DEGRADED":
      return "degraded";
    case "BROKEN":
      return "broken";
    case "REPLACED":
      return "replaced";
    case "OFFLINE":
      return "offline";
  }

  throw new Error(`Unsupported source health state: ${value}`);
}

function getPrimaryArtwork(
  artwork: PublishedMediaPayload["artwork"],
  kind: "POSTER" | "BACKDROP",
): string | null {
  const preferred = artwork.find((item) => item.kind === kind && item.isPrimary) ?? artwork.find((item) => item.kind === kind);
  return preferred?.url ?? null;
}

function getAllPublishedResources(media: PublishedMediaPayload) {
  return [
    ...media.resources.map((resource) => ({ resource, episode: null as PublishedMediaPayload["seasons"][number]["episodes"][number] | null })),
    ...media.seasons.flatMap((season) =>
      season.episodes.flatMap((episode) => episode.resources.map((resource) => ({ resource, episode }))),
    ),
  ];
}

function getAllAdminPublishedResources(media: AdminPublishedMediaPayload) {
  return [
    ...media.resources.map((resource) => ({ resource, episode: null as AdminPublishedMediaPayload["seasons"][number]["episodes"][number] | null })),
    ...media.seasons.flatMap((season) =>
      season.episodes.flatMap((episode) => episode.resources.map((resource) => ({ resource, episode }))),
    ),
  ];
}

type PublishedResourceEntity =
  | PublishedMediaPayload["resources"][number]
  | PublishedMediaPayload["seasons"][number]["episodes"][number]["resources"][number];

type AdminPublishedResourceEntity =
  | AdminPublishedMediaPayload["resources"][number]
  | AdminPublishedMediaPayload["seasons"][number]["episodes"][number]["resources"][number];

function isPublicResource(resource: PublishedResourceEntity) {
  return resource.isPublic && resource.isActive;
}

function rankHealthState(value: string): number {
  switch (value) {
    case "HEALTHY":
      return 0;
    case "DEGRADED":
      return 1;
    case "BROKEN":
      return 2;
    case "REPLACED":
      return 3;
    case "OFFLINE":
      return 4;
  }

  return 5;
}

function rankResourceStatus(value: string): number {
  switch (value) {
    case "ONLINE":
      return 0;
    case "DEGRADED":
      return 1;
    case "PENDING":
      return 2;
    case "REPORTED":
      return 3;
    case "OFFLINE":
      return 4;
  }

  return 5;
}

function isUsableResource(resource: PublishedResourceEntity) {
  if (!isPublicResource(resource)) {
    return false;
  }

  const statusUsable = resource.status === "ONLINE" || resource.status === "DEGRADED";
  const healthUsable = resource.healthState === "HEALTHY" || resource.healthState === "DEGRADED";

  return statusUsable && healthUsable;
}

function comparePublishedResources(
  left: PublishedResourceEntity,
  right: PublishedResourceEntity,
) {
  const leftUsable = isUsableResource(left);
  const rightUsable = isUsableResource(right);

  if (leftUsable !== rightUsable) {
    return leftUsable ? -1 : 1;
  }

  if (left.isPreferred !== right.isPreferred) {
    return left.isPreferred ? -1 : 1;
  }

  if (left.priority !== right.priority) {
    return right.priority - left.priority;
  }

  const healthRank = rankHealthState(left.healthState) - rankHealthState(right.healthState);

  if (healthRank !== 0) {
    return healthRank;
  }

  const statusRank = rankResourceStatus(left.status) - rankResourceStatus(right.status);

  if (statusRank !== 0) {
    return statusRank;
  }

  if (left.mirrorOrder !== right.mirrorOrder) {
    return left.mirrorOrder - right.mirrorOrder;
  }

  return left.createdAt.getTime() - right.createdAt.getTime();
}

function buildAvailabilityLabel(media: PublishedMediaPayload): string {
  const allResources = getAllPublishedResources(media).filter(({ resource }) => isPublicResource(resource));
  const healthyStreams = allResources.filter(
    ({ resource }) => resource.kind === "STREAM" && resource.healthState === "HEALTHY" && resource.status === "ONLINE",
  ).length;
  const degradedStreams = allResources.filter(
    ({ resource }) =>
      resource.kind === "STREAM" &&
      (resource.healthState === "DEGRADED" || resource.status === "DEGRADED"),
  ).length;
  const downloads = allResources.filter(({ resource }) => resource.kind === "DOWNLOAD" && isUsableResource(resource)).length;

  if (healthyStreams > 0) {
    return `${healthyStreams} healthy streams`;
  }

  if (degradedStreams > 0) {
    return `${degradedStreams} degraded streams`;
  }

  if (downloads > 0) {
    return `${downloads} downloads published`;
  }

  return "No published resources";
}

function buildEpisodeCountLabel(media: PublishedMediaPayload): string | undefined {
  const episodeCount =
    media.episodeCount ??
    media.seasons.reduce((total, season) => total + season.episodes.length, 0);

  if (!episodeCount || media.type === "MOVIE") {
    return undefined;
  }

  return `${episodeCount} episodes`;
}

function mapPublishedMediaIdentity(media: PublishedMediaPayload): PublishedMediaIdentityRecord {
  return {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    title: media.title,
    originalTitle: media.originalTitle,
    summary: media.summary,
    description: media.description,
    tagline: media.tagline,
    type: mapMediaType(media.type),
    status: mapMediaStatus(media.status),
    releaseYear: media.releaseYear,
    endYear: media.endYear,
    originCountry: media.originCountry,
    language: media.language,
    runtimeMinutes: media.runtimeMinutes,
    episodeRuntimeMinutes: media.episodeRuntimeMinutes,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    ratingValue: media.ratingValue ? Number(media.ratingValue) : null,
    ratingCount: media.ratingCount,
    popularityScore: media.popularityScore,
    genres: media.genres.map((entry) => entry.genre.label),
    alternateTitles: media.alternateTitles.map((entry) => entry.value),
    posterUrl: getPrimaryArtwork(media.artwork, "POSTER"),
    backdropUrl: getPrimaryArtwork(media.artwork, "BACKDROP"),
    canonicalWatchHref: buildPublishedWatchHref(buildPublishedWatchQuery({ publicId: media.publicId })),
    compatibilityHref: buildPublishedCompatibilityHref(media.slug),
    publishedAt: (media.publishedAt ?? media.updatedAt).toISOString(),
  };
}

function mapAdminPublishedAuditAction(value: string) {
  return value.toLowerCase();
}

function mapAdminReviewStatus(value: string) {
  return value.toLowerCase();
}

function mapAdminReviewDecisionType(value?: string | null) {
  return value ? value.toLowerCase() : null;
}

function mapPublishedResource(
  media: PublishedMediaPayload,
  resource: PublishedResourceEntity,
  episode?: PublishedMediaPayload["seasons"][number]["episodes"][number] | null,
  listPublicId?: string,
  listItemPublicRef?: string,
): PublishedPlaybackResourceRecord {
  const watchQuery = buildPublishedWatchQuery(
    { publicId: media.publicId },
    {
      episodePublicId: episode?.publicId ?? undefined,
      resourcePublicId: resource.publicId,
      listPublicId,
      listItemPublicRef,
    },
  );

  return {
    id: resource.id,
    publicId: resource.publicId,
    mediaPublicId: media.publicId,
    episodePublicId: episode?.publicId ?? undefined,
    kind: mapResourceKind(resource.kind),
    provider: mapResourceProvider(resource.provider),
    format: resource.format.toLowerCase(),
    label: resource.label,
    quality: resource.quality,
    status: mapResourceStatus(resource.status),
    healthState: mapPublishedSourceHealthState(resource.healthState),
    healthSummary: resource.healthSummary,
    priority: resource.priority,
    mirrorOrder: resource.mirrorOrder,
    isPreferred: resource.isPreferred,
    isUsable: isUsableResource(resource),
    replacementPublicId: resource.replacementResource?.publicId ?? null,
    url: resource.url,
    maskedUrl: resource.maskedUrl,
    accessCode: resource.accessCode,
    canonicalWatchHref: buildPublishedWatchHref(watchQuery),
    watchQuery,
  };
}

function mapAdminPublishedResource(
  media: AdminPublishedMediaPayload,
  resource: AdminPublishedResourceEntity,
  episode?: AdminPublishedMediaPayload["seasons"][number]["episodes"][number] | null,
): AdminPublishedResourceRecord {
  const watchQuery = buildPublishedWatchQuery(
    { publicId: media.publicId },
    {
      episodePublicId: episode?.publicId ?? undefined,
      resourcePublicId: resource.publicId,
    },
  );

  return {
    id: resource.id,
    publicId: resource.publicId,
    mediaPublicId: media.publicId,
    episodePublicId: episode?.publicId ?? undefined,
    kind: mapResourceKind(resource.kind),
    provider: mapResourceProvider(resource.provider),
    format: resource.format.toLowerCase(),
    label: resource.label,
    quality: resource.quality,
    status: mapResourceStatus(resource.status),
    healthState: mapPublishedSourceHealthState(resource.healthState),
    healthSummary: resource.healthSummary,
    priority: resource.priority,
    mirrorOrder: resource.mirrorOrder,
    isPreferred: resource.isPreferred,
    isUsable: isUsableResource(resource),
    replacementPublicId: resource.replacementResource?.publicId ?? null,
    url: resource.url,
    maskedUrl: resource.maskedUrl,
    accessCode: resource.accessCode,
    canonicalWatchHref: buildPublishedWatchHref(watchQuery),
    watchQuery,
    openRepairCount: resource.repairQueueEntries.length,
    providerDisplayName: resource.providerRegistry?.displayName ?? null,
  };
}

function mapPublishedEpisode(
  media: PublishedMediaPayload,
  episode: PublishedMediaPayload["seasons"][number]["episodes"][number],
  seasonNumber?: number,
  listPublicId?: string,
  listItemPublicRef?: string,
): PublishedEpisodeRecord {
  const watchQuery = buildPublishedWatchQuery(
    { publicId: media.publicId },
    {
      episodePublicId: episode.publicId,
      listPublicId,
      listItemPublicRef,
    },
  );

  return {
    id: episode.id,
    publicId: episode.publicId,
    mediaPublicId: media.publicId,
    slug: episode.slug,
    seasonNumber,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    summary: episode.summary,
    runtimeMinutes: episode.runtimeMinutes,
    canonicalWatchHref: buildPublishedWatchHref(watchQuery),
    watchQuery,
  };
}

function mapPublishedSeason(media: PublishedMediaPayload, season: PublishedMediaPayload["seasons"][number]): PublishedSeasonRecord {
  return {
    id: season.id,
    seasonNumber: season.seasonNumber,
    title: season.title,
    releaseYear: season.releaseYear,
    episodeCount: season.episodeCount,
    episodes: season.episodes.map((episode) => mapPublishedEpisode(media, episode, season.seasonNumber)),
  };
}

function mapPublishedCatalogCard(media: PublishedMediaPayload): PublishedCatalogCard {
  const identity = mapPublishedMediaIdentity(media);

  return {
    id: identity.id,
    publicId: identity.publicId,
    slug: identity.slug,
    title: identity.title,
    originalTitle: identity.originalTitle,
    type: identity.type,
    status: identity.status,
    year: identity.releaseYear,
    endYear: identity.endYear,
    originCountry: identity.originCountry,
    language: identity.language,
    genreLabels: identity.genres,
    posterUrl: identity.posterUrl,
    backdropUrl: identity.backdropUrl,
    ratingValue: identity.ratingValue,
    ratingCount: identity.ratingCount,
    availabilityLabel: buildAvailabilityLabel(media),
    episodeCount: identity.episodeCount,
    episodeCountLabel: buildEpisodeCountLabel(media),
    canonicalWatchHref: identity.canonicalWatchHref,
    compatibilityHref: identity.compatibilityHref,
  };
}

function buildPublishedFacets(media: PublishedMediaPayload[]): PublishedCatalogPageRecord["facets"] {
  const genreCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  const regionCounts = new Map<string, number>();

  for (const item of media) {
    for (const genre of item.genres.map((entry) => entry.genre.label)) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }

    yearCounts.set(item.releaseYear, (yearCounts.get(item.releaseYear) ?? 0) + 1);

    if (item.originCountry) {
      regionCounts.set(item.originCountry, (regionCounts.get(item.originCountry) ?? 0) + 1);
    }
  }

  const toFacetOptions = <T extends string | number>(entries: Iterable<[T, number]>): PublishedFacetOption[] =>
    Array.from(entries)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([value, count]) => ({
        value: String(value),
        label: String(value),
        count,
      }));

  return {
    genres: toFacetOptions(genreCounts.entries()),
    years: toFacetOptions(Array.from(yearCounts.entries()).sort((a, b) => b[0] - a[0])),
    regions: toFacetOptions(regionCounts.entries()),
  };
}

function normalizeScope(scope?: PublishedCatalogScope): PublishedCatalogScope {
  return scope ?? "all";
}

function normalizeSort(sort?: PublishedCatalogSort): PublishedCatalogSort {
  return sort ?? "latest";
}

function buildPublishedWhere(input: PublishedCatalogQueryInput): Prisma.MediaTitleWhereInput {
  const scope = normalizeScope(input.scope);
  const q = input.q?.trim();

  const where: Prisma.MediaTitleWhereInput = {
    publishedAt: {
      not: null,
    },
  };

  if (scope !== "all") {
    where.type = scope.toUpperCase() as Prisma.MediaTitleWhereInput["type"];
  }

  if (input.genre) {
    where.genres = {
      some: {
        genre: {
          OR: [{ slug: input.genre }, { label: { equals: input.genre, mode: "insensitive" } }],
        },
      },
    };
  }

  if (input.year) {
    where.releaseYear = input.year;
  }

  if (input.region) {
    where.originCountry = {
      equals: input.region,
      mode: "insensitive",
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { originalTitle: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { alternateTitles: { some: { value: { contains: q, mode: "insensitive" } } } },
      { genres: { some: { genre: { label: { contains: q, mode: "insensitive" } } } } },
      { tags: { some: { tag: { label: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  return where;
}

function buildPublishedOrderBy(sort: PublishedCatalogSort): Prisma.MediaTitleOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ popularityScore: "desc" }, { publishedAt: "desc" }];
    case "rating":
      return [{ ratingValue: "desc" }, { ratingCount: "desc" }, { publishedAt: "desc" }];
    case "latest":
    default:
      return [{ publishedAt: "desc" }, { releaseYear: "desc" }];
  }
}

function normalizeAdminCatalogSort(sort?: AdminPublishedCatalogSort): AdminPublishedCatalogSort {
  return sort ?? "published_at";
}

function buildAdminPublishedWhere(input: AdminPublishedCatalogQuery = {}): Prisma.MediaTitleWhereInput {
  const q = input.q?.trim();
  const where: Prisma.MediaTitleWhereInput = {
    publishedAt: {
      not: null,
    },
  };

  if (input.type && input.type !== "all") {
    where.type = input.type.toUpperCase() as Prisma.MediaTitleWhereInput["type"];
  }

  if (input.status) {
    where.status = input.status.toUpperCase() as Prisma.MediaTitleWhereInput["status"];
  }

  if (input.year) {
    where.releaseYear = input.year;
  }

  if (input.region) {
    where.originCountry = {
      equals: input.region,
      mode: "insensitive",
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { originalTitle: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { alternateTitles: { some: { value: { contains: q, mode: "insensitive" } } } },
      { genres: { some: { genre: { label: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  return where;
}

function buildAdminPublishedOrderBy(sort: AdminPublishedCatalogSort): Prisma.MediaTitleOrderByWithRelationInput[] {
  switch (sort) {
    case "updated_at":
      return [{ updatedAt: "desc" }];
    case "title":
      return [{ title: "asc" }, { publishedAt: "desc" }];
    case "release_year":
      return [{ releaseYear: "desc" }, { publishedAt: "desc" }];
    case "published_at":
    default:
      return [{ publishedAt: "desc" }, { updatedAt: "desc" }];
  }
}

function countOpenRepairEntries(resources: AdminPublishedResourceEntity[]) {
  return resources.reduce((total, resource) => total + resource.repairQueueEntries.length, 0);
}

function countResourcesByKind(resources: AdminPublishedResourceEntity[], kind: PublishedResourceKind) {
  return resources.filter((resource) => mapResourceKind(resource.kind) === kind && isPublicResource(resource)).length;
}

function countHealthyStreams(resources: AdminPublishedResourceEntity[]) {
  return resources.filter(
    (resource) => mapResourceKind(resource.kind) === "stream" && isPublicResource(resource) && resource.healthState === "HEALTHY",
  ).length;
}

function countDegradedStreams(resources: AdminPublishedResourceEntity[]) {
  return resources.filter(
    (resource) =>
      mapResourceKind(resource.kind) === "stream" &&
      isPublicResource(resource) &&
      (resource.healthState === "DEGRADED" || resource.status === "DEGRADED"),
  ).length;
}

function countBrokenOrOfflineResources(resources: AdminPublishedResourceEntity[]) {
  return resources.filter(
    (resource) =>
      isPublicResource(resource) &&
      (resource.healthState === "BROKEN" ||
        resource.healthState === "OFFLINE" ||
        resource.healthState === "REPLACED" ||
        resource.status === "OFFLINE"),
  ).length;
}

function mapAdminPublishedCatalogListItem(media: AdminPublishedMediaPayload): AdminPublishedCatalogListItemRecord {
  const posterUrl = getPrimaryArtwork(media.artwork, "POSTER");
  const backdropUrl = getPrimaryArtwork(media.artwork, "BACKDROP");
  const allResources = getAllAdminPublishedResources(media).map(({ resource }) => resource);

  return {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    title: media.title,
    originalTitle: media.originalTitle,
    type: mapMediaType(media.type),
    status: mapMediaStatus(media.status),
    releaseYear: media.releaseYear,
    endYear: media.endYear,
    originCountry: media.originCountry,
    language: media.language,
    posterUrl,
    backdropUrl,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    publishedAt: (media.publishedAt ?? media.updatedAt).toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    streamCount: countResourcesByKind(allResources, "stream"),
    healthyStreamCount: countHealthyStreams(allResources),
    degradedStreamCount: countDegradedStreams(allResources),
    downloadCount: countResourcesByKind(allResources, "download"),
    subtitleCount: countResourcesByKind(allResources, "subtitle"),
    openRepairCount: countOpenRepairEntries(allResources),
    canonicalWatchHref: buildPublishedWatchHref(buildPublishedWatchQuery({ publicId: media.publicId })),
    compatibilityHref: buildPublishedCompatibilityHref(media.slug),
  };
}

function buildPublishedListQueue(list: PublishedListRecord, currentPublicRef?: string): PublishedListQueueRecord {
  const currentIndex = currentPublicRef ? list.items.findIndex((item) => item.publicRef === currentPublicRef) : 0;
  const items: PublishedListQueueItem[] = list.items.map((item, index) => ({
    publicRef: item.publicRef,
    position: item.position,
    positionLabel: item.positionLabel,
    title: item.mediaTitle,
    subtitle: item.subtitle,
    posterUrl: item.posterUrl,
    canonicalWatchHref: item.canonicalWatchHref,
    isCurrent: index === currentIndex,
    isPlayed: index < currentIndex,
    isUpNext: index === currentIndex + 1,
  }));

  return {
    listPublicId: list.publicId,
    listTitle: list.title,
    canonicalListHref: list.canonicalListHref,
    totalItems: items.length,
    totalItemsLabel: buildPublishedListCountLabel(items.length),
    currentItem: items[currentIndex],
    previousItem: currentIndex > 0 ? items[currentIndex - 1] : undefined,
    nextItem: currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : undefined,
    items,
    upcomingItems: items.slice(Math.max(currentIndex + 1, 0)),
  };
}

function mapPublishedResourceCollection(
  media: PublishedMediaPayload,
  resources: Array<{
    resource: PublishedResourceEntity;
    episode: PublishedMediaPayload["seasons"][number]["episodes"][number] | null;
  }>,
  kind: PublishedResourceKind,
  listPublicId?: string,
  listItemPublicRef?: string,
) {
  return resources
    .filter(({ resource }) => mapResourceKind(resource.kind) === kind && isPublicResource(resource))
    .sort((left, right) => comparePublishedResources(left.resource, right.resource))
    .map(({ resource, episode }) => mapPublishedResource(media, resource, episode, listPublicId, listItemPublicRef));
}

function mapAdminPublishedResourceCollection(
  media: AdminPublishedMediaPayload,
  resources: Array<{
    resource: AdminPublishedResourceEntity;
    episode: AdminPublishedMediaPayload["seasons"][number]["episodes"][number] | null;
  }>,
  kind: PublishedResourceKind,
) {
  return resources
    .filter(({ resource }) => mapResourceKind(resource.kind) === kind && isPublicResource(resource))
    .sort((left, right) => comparePublishedResources(left.resource, right.resource))
    .map(({ resource, episode }) => mapAdminPublishedResource(media, resource, episode));
}

function buildAdminPublishedEpisodeDiagnostics(
  media: AdminPublishedMediaPayload,
): AdminPublishedEpisodeDiagnosticRecord[] {
  return media.seasons.flatMap((season) =>
    season.episodes.map((episode) => {
      const publicResources = episode.resources.filter((resource) => isPublicResource(resource));

      return {
        episodePublicId: episode.publicId,
        seasonNumber: season.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        streamCount: publicResources.filter((resource) => mapResourceKind(resource.kind) === "stream").length,
        healthyStreamCount: publicResources.filter(
          (resource) => mapResourceKind(resource.kind) === "stream" && resource.healthState === "HEALTHY",
        ).length,
        openRepairCount: countOpenRepairEntries(publicResources),
      };
    }),
  );
}

function buildAdminPublishedSourceSummary(media: AdminPublishedMediaPayload) {
  const allResources = getAllAdminPublishedResources(media).map(({ resource }) => resource);

  return {
    totalResources: allResources.filter((resource) => isPublicResource(resource)).length,
    streamCount: countResourcesByKind(allResources, "stream"),
    healthyStreamCount: countHealthyStreams(allResources),
    degradedStreamCount: countDegradedStreams(allResources),
    brokenOrOfflineCount: countBrokenOrOfflineResources(allResources),
    downloadCount: countResourcesByKind(allResources, "download"),
    subtitleCount: countResourcesByKind(allResources, "subtitle"),
    openRepairCount: countOpenRepairEntries(allResources),
  };
}

function mapAdminPublishedCatalogDetail(media: AdminPublishedMediaPayload): AdminPublishedCatalogDetailRecord {
  const streamResources = mapAdminPublishedResourceCollection(media, getAllAdminPublishedResources(media), "stream");
  const downloadResources = mapAdminPublishedResourceCollection(media, getAllAdminPublishedResources(media), "download");
  const subtitleResources = mapAdminPublishedResourceCollection(media, getAllAdminPublishedResources(media), "subtitle");
  const identity = {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    title: media.title,
    originalTitle: media.originalTitle,
    summary: media.summary,
    description: media.description,
    tagline: media.tagline,
    type: mapMediaType(media.type),
    status: mapMediaStatus(media.status),
    releaseYear: media.releaseYear,
    endYear: media.endYear,
    originCountry: media.originCountry,
    language: media.language,
    runtimeMinutes: media.runtimeMinutes,
    episodeRuntimeMinutes: media.episodeRuntimeMinutes,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    posterUrl: getPrimaryArtwork(media.artwork, "POSTER"),
    backdropUrl: getPrimaryArtwork(media.artwork, "BACKDROP"),
    canonicalWatchHref: buildPublishedWatchHref(buildPublishedWatchQuery({ publicId: media.publicId })),
    compatibilityHref: buildPublishedCompatibilityHref(media.slug),
    publishedAt: (media.publishedAt ?? media.updatedAt).toISOString(),
    updatedAt: media.updatedAt.toISOString(),
  };

  return {
    media: identity,
    seasons: media.seasons.map((season) => mapPublishedSeason(media as PublishedMediaPayload, season as PublishedMediaPayload["seasons"][number])),
    streamResources,
    downloadResources,
    subtitleResources,
    sourceSummary: buildAdminPublishedSourceSummary(media),
    episodeDiagnostics: buildAdminPublishedEpisodeDiagnostics(media),
    recentAudits: media.publishAuditRecords.map(
      (audit): AdminPublishedCatalogAuditRecord => ({
        action: mapAdminPublishedAuditAction(audit.action),
        actionSummary: audit.actionSummary,
        actorId: audit.actorId,
        createdAt: audit.createdAt.toISOString(),
      }),
    ),
    reviewContext: media.reviewQueueEntries[0]
      ? {
          queueEntryId: media.reviewQueueEntries[0].id,
          status: mapAdminReviewStatus(media.reviewQueueEntries[0].status),
          latestDecisionType: mapAdminReviewDecisionType(media.reviewQueueEntries[0].latestDecisionType),
          latestDecisionSummary: media.reviewQueueEntries[0].latestDecisionSummary,
          updatedAt: media.reviewQueueEntries[0].updatedAt.toISOString(),
        }
      : undefined,
  };
}

function resolveSelectedResource(
  query: PublishedWatchQuery,
  streamResources: PublishedPlaybackResourceRecord[],
  downloadResources: PublishedPlaybackResourceRecord[],
  subtitleResources: PublishedPlaybackResourceRecord[],
) {
  const combined = [...streamResources, ...downloadResources, ...subtitleResources];
  const requested = query.resourcePublicId ? combined.find((resource) => resource.publicId === query.resourcePublicId) : undefined;

  if (requested?.isUsable) {
    return {
      selectedResource: requested,
      sourceResolutionReason: "explicit" as const,
    };
  }

  if (query.resourcePublicId && requested) {
    const sameKindFallback = combined.find(
      (resource) => resource.kind === requested.kind && resource.isUsable && resource.publicId !== requested.publicId,
    );

    if (sameKindFallback) {
      return {
        selectedResource: sameKindFallback,
        sourceResolutionReason: "fallback_unusable" as const,
      };
    }
  }

  const preferredStream = streamResources.find((resource) => resource.isUsable && resource.healthState === "healthy");

  if (preferredStream) {
    return {
      selectedResource: preferredStream,
      sourceResolutionReason: query.resourcePublicId ? ("fallback_missing" as const) : ("preferred_healthy" as const),
    };
  }

  const degradedStream = streamResources.find((resource) => resource.isUsable);

  if (degradedStream) {
    return {
      selectedResource: degradedStream,
      sourceResolutionReason: query.resourcePublicId ? ("fallback_unusable" as const) : ("preferred_degraded" as const),
    };
  }

  return {
    selectedResource: undefined,
    sourceResolutionReason: "no_usable_source" as const,
  };
}

function mapPublishedListSummary(list: PublishedListPayload): PublishedListSummaryRecord | null {
  const firstPublishedItem = list.items.find((item) => item.publicRef && item.media.publishedAt);

  if (!list.publicId || !firstPublishedItem) {
    return null;
  }

  const posterUrl =
    firstPublishedItem.media.artwork.find((art) => art.kind === "POSTER" && art.isPrimary)?.url ??
    firstPublishedItem.media.artwork.find((art) => art.kind === "POSTER")?.url ??
    null;
  const backdropUrl =
    firstPublishedItem.media.artwork.find((art) => art.kind === "BACKDROP" && art.isPrimary)?.url ??
    firstPublishedItem.media.artwork.find((art) => art.kind === "BACKDROP")?.url ??
    posterUrl;
  const itemCount = list.items.filter((item) => item.publicRef && item.media.publishedAt).length;

  return {
    id: list.id,
    publicId: list.publicId,
    title: list.name,
    description: list.description,
    canonicalListHref: buildPublishedListHref(list.publicId),
    shareHref: buildPublishedListHref(list.publicId),
    shareTitle: list.name,
    shareDescription: list.description ?? `A curated list with ${itemCount} published titles.`,
    itemCount,
    itemCountLabel: buildPublishedListCountLabel(itemCount),
    coverPosterUrl: posterUrl,
    coverBackdropUrl: backdropUrl,
  };
}

function buildLifecycleAuditSummary(title: string) {
  return `Unpublished catalog record '${title}'.`;
}

function mapPublishedList(list: PublishedListPayload): PublishedListRecord | null {
  const summary = mapPublishedListSummary(list);

  if (!summary) {
    return null;
  }

  const items = list.items
    .filter((item) => item.publicRef && item.media.publishedAt)
    .map((item, index, source) => {
      const mediaRecord: PublishedMediaIdentityRecord = {
        id: item.media.id,
        publicId: item.media.publicId,
        slug: item.media.slug,
        title: item.media.title,
        originalTitle: item.media.originalTitle,
        summary: item.media.summary,
        description: item.media.description,
        tagline: item.media.tagline,
        type: mapMediaType(item.media.type),
        status: mapMediaStatus(item.media.status),
        releaseYear: item.media.releaseYear,
        endYear: item.media.endYear,
        originCountry: item.media.originCountry,
        language: item.media.language,
        runtimeMinutes: item.media.runtimeMinutes,
        episodeRuntimeMinutes: item.media.episodeRuntimeMinutes,
        seasonCount: item.media.seasonCount,
        episodeCount: item.media.episodeCount,
        ratingValue: item.media.ratingValue ? Number(item.media.ratingValue) : null,
        ratingCount: item.media.ratingCount,
        popularityScore: item.media.popularityScore,
        genres: [],
        alternateTitles: [],
        posterUrl: item.media.artwork.find((art) => art.kind === "POSTER" && art.isPrimary)?.url ?? item.media.artwork.find((art) => art.kind === "POSTER")?.url ?? null,
        backdropUrl:
          item.media.artwork.find((art) => art.kind === "BACKDROP" && art.isPrimary)?.url ??
          item.media.artwork.find((art) => art.kind === "BACKDROP")?.url ??
          null,
        canonicalWatchHref: buildPublishedWatchHref(
          buildPublishedWatchQuery(
            { publicId: item.media.publicId },
            {
              episodePublicId: item.episode?.publicId ?? undefined,
              listPublicId: list.publicId ?? undefined,
              listItemPublicRef: item.publicRef ?? undefined,
            },
          ),
        ),
        compatibilityHref: buildPublishedCompatibilityHref(item.media.slug, item.episode?.slug ?? undefined),
        publishedAt: item.media.publishedAt?.toISOString() ?? item.media.updatedAt.toISOString(),
      };

      const record: PublishedListItemRecord = {
        publicRef: item.publicRef!,
        position: item.position ?? index + 1,
        positionLabel: `#${item.position ?? index + 1}`,
        mediaPublicId: item.media.publicId,
        mediaSlug: item.media.slug,
        mediaTitle: item.media.title,
        posterUrl: mediaRecord.posterUrl,
        episodePublicId: item.episode?.publicId ?? undefined,
        episodeTitle: item.episode?.title ?? undefined,
        subtitle: buildPublishedListItemSubtitle(mediaRecord, item.episode ? { episodeNumber: item.episode.episodeNumber, title: item.episode.title } : undefined),
        canonicalWatchHref: mediaRecord.canonicalWatchHref,
        compatibilityHref: mediaRecord.compatibilityHref,
        watchQuery: buildPublishedWatchQuery(
          { publicId: item.media.publicId },
          {
            episodePublicId: item.episode?.publicId ?? undefined,
            listPublicId: list.publicId ?? undefined,
            listItemPublicRef: item.publicRef ?? undefined,
          },
        ),
      };

      const previous = source[index - 1];
      const next = source[index + 1];

      if (previous?.publicRef) {
        const previousHref = buildPublishedWatchHref(
          buildPublishedWatchQuery(
            { publicId: previous.media.publicId },
            {
              episodePublicId: previous.episode?.publicId ?? undefined,
              listPublicId: list.publicId ?? undefined,
              listItemPublicRef: previous.publicRef,
            },
          ),
        );
        record.previousItem = {
          publicRef: previous.publicRef,
          position: previous.position ?? index,
          title: previous.media.title,
          canonicalWatchHref: previousHref,
        };
      }

      if (next?.publicRef) {
        const nextHref = buildPublishedWatchHref(
          buildPublishedWatchQuery(
            { publicId: next.media.publicId },
            {
              episodePublicId: next.episode?.publicId ?? undefined,
              listPublicId: list.publicId ?? undefined,
              listItemPublicRef: next.publicRef,
            },
          ),
        );
        record.nextItem = {
          publicRef: next.publicRef,
          position: next.position ?? index + 2,
          title: next.media.title,
          canonicalWatchHref: nextHref,
        };
      }

      return record;
    });

  return {
    ...summary,
    items,
  };
}

export class PublishedCatalogRepository extends BaseRepository implements PublishedCatalogRepositoryContract {
  private async createOperatorLifecycleAudit(input: {
    actorId?: string;
    requestId?: string;
    mediaId?: string | null;
    summary: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.operatorLifecycleMutationAudit.create({
      data: {
        action: "CATALOG_UNPUBLISHED",
        actorId: input.actorId,
        requestId: input.requestId,
        mediaId: input.mediaId ?? null,
        summary: input.summary,
        notes: input.notes ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  public constructor(context: RepositoryContext) {
    super(context);
  }

  async queryPublishedCatalog(input: PublishedCatalogQueryInput): Promise<PublishedCatalogPageRecord> {
    const scope = normalizeScope(input.scope);
    const q = input.q?.trim() ?? "";
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 48));
    const where = buildPublishedWhere(input);
    const orderBy = buildPublishedOrderBy(normalizeSort(input.sort));

    const [totalItems, allMatching, pageItems] = await Promise.all([
      this.db.mediaTitle.count({ where }),
      this.db.mediaTitle.findMany({ where, include: publishedMediaInclude, orderBy }),
      this.db.mediaTitle.findMany({
        where,
        include: publishedMediaInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      scope,
      q,
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      items: pageItems.map((media) => mapPublishedCatalogCard(media)),
      facets: buildPublishedFacets(allMatching),
    };
  }

  async queryAdminPublishedCatalog(input: AdminPublishedCatalogQuery = {}): Promise<AdminPublishedCatalogPageRecord> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 50));
    const where = buildAdminPublishedWhere(input);
    const orderBy = buildAdminPublishedOrderBy(normalizeAdminCatalogSort(input.sort));

    const [totalItems, allMatching, pageItems] = await Promise.all([
      this.db.mediaTitle.count({ where }),
      this.db.mediaTitle.findMany({ where, include: adminPublishedMediaInclude, orderBy }),
      this.db.mediaTitle.findMany({
        where,
        include: adminPublishedMediaInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const allItems = allMatching.map((media) => mapAdminPublishedCatalogListItem(media));
    const items = pageItems.map((media) => mapAdminPublishedCatalogListItem(media));

    return {
      title: "Published Catalog",
      description: "Operator view of published titles, release state, and published-source readiness.",
      appliedFilters: input,
      page,
      pageSize,
      summary: {
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        titlesWithRepairs: allItems.filter((item) => item.openRepairCount > 0).length,
        titlesWithHealthyStreams: allItems.filter((item) => item.healthyStreamCount > 0).length,
        episodicTitles: allItems.filter((item) => (item.episodeCount ?? 0) > 0).length,
      },
      items,
    };
  }

  async getPublishedDetailBySlug(slug: string): Promise<PublishedDetailRecord | null> {
    const media = await this.db.mediaTitle.findFirst({
      where: {
        slug,
        publishedAt: {
          not: null,
        },
      },
      include: publishedMediaInclude,
    });

    return media ? this.buildDetailRecord(media) : null;
  }

  async getPublishedDetailByPublicId(publicId: string): Promise<PublishedDetailRecord | null> {
    const media = await this.db.mediaTitle.findFirst({
      where: {
        publicId,
        publishedAt: {
          not: null,
        },
      },
      include: publishedMediaInclude,
    });

    return media ? this.buildDetailRecord(media) : null;
  }

  async getAdminPublishedCatalogDetailByPublicId(publicId: string): Promise<AdminPublishedCatalogDetailRecord | null> {
    const media = await this.db.mediaTitle.findFirst({
      where: {
        publicId,
        publishedAt: {
          not: null,
        },
      },
      include: adminPublishedMediaInclude,
    });

    return media ? mapAdminPublishedCatalogDetail(media) : null;
  }

  async resolvePublishedWatch(query: PublishedWatchQuery): Promise<PublishedWatchRecord | null> {
    const media = await this.db.mediaTitle.findFirst({
      where: {
        publicId: query.mediaPublicId,
        publishedAt: {
          not: null,
        },
      },
      include: publishedMediaInclude,
    });

    if (!media) {
      return null;
    }

    const identity = mapPublishedMediaIdentity(media);
    const allEpisodes = media.seasons.flatMap((season) => season.episodes);
    const selectedEpisodeEntity =
      (query.episodePublicId ? allEpisodes.find((episode) => episode.publicId === query.episodePublicId) : undefined) ??
      allEpisodes[0];

    const streamResources = mapPublishedResourceCollection(
      media,
      [
        ...media.resources.map((resource) => ({ resource, episode: null as PublishedMediaPayload["seasons"][number]["episodes"][number] | null })),
        ...(selectedEpisodeEntity
          ? selectedEpisodeEntity.resources.map((resource) => ({ resource, episode: selectedEpisodeEntity }))
          : []),
      ],
      "stream",
      query.listPublicId,
      query.listItemPublicRef,
    );
    const downloadResources = mapPublishedResourceCollection(
      media,
      [
        ...media.resources.map((resource) => ({ resource, episode: null as PublishedMediaPayload["seasons"][number]["episodes"][number] | null })),
        ...(selectedEpisodeEntity
          ? selectedEpisodeEntity.resources.map((resource) => ({ resource, episode: selectedEpisodeEntity }))
          : []),
      ],
      "download",
      query.listPublicId,
      query.listItemPublicRef,
    );
    const subtitleResources = mapPublishedResourceCollection(
      media,
      [
        ...media.resources.map((resource) => ({ resource, episode: null as PublishedMediaPayload["seasons"][number]["episodes"][number] | null })),
        ...(selectedEpisodeEntity
          ? selectedEpisodeEntity.resources.map((resource) => ({ resource, episode: selectedEpisodeEntity }))
          : []),
      ],
      "subtitle",
      query.listPublicId,
      query.listItemPublicRef,
    );

    const { selectedResource, sourceResolutionReason } = resolveSelectedResource(
      query,
      streamResources,
      downloadResources,
      subtitleResources,
    );

    const selectedEpisode = selectedEpisodeEntity
      ? mapPublishedEpisode(
          media,
          selectedEpisodeEntity,
          media.seasons.find((season) => season.episodes.some((episode) => episode.id === selectedEpisodeEntity.id))?.seasonNumber,
          query.listPublicId,
          query.listItemPublicRef,
        )
      : undefined;
    const episodeOptions = media.seasons.flatMap((season) =>
      season.episodes.map((episode) =>
        mapPublishedEpisode(media, episode, season.seasonNumber, query.listPublicId, query.listItemPublicRef),
      ),
    );
    const list = query.listPublicId ? await this.getPublishedListByPublicId(query.listPublicId) : null;
    const listItem = list?.items.find((item) => item.publicRef === query.listItemPublicRef) ?? list?.items.find((item) => item.mediaPublicId === identity.publicId && item.episodePublicId === selectedEpisode?.publicId);
    const queue = list ? buildPublishedListQueue(list, listItem?.publicRef) : undefined;
    const canonicalWatchHref = buildPublishedWatchHref(
      buildPublishedWatchQuery(
        { publicId: identity.publicId },
        {
          episodePublicId: selectedEpisode?.publicId,
          resourcePublicId: selectedResource?.publicId,
          listPublicId: list?.publicId,
          listItemPublicRef: listItem?.publicRef,
          timeSeconds: query.timeSeconds,
        },
      ),
    );

    return {
      media: identity,
      selectedEpisode,
      selectedResource,
      requestedResourcePublicId: query.resourcePublicId,
      resolvedResourcePublicId: selectedResource?.publicId,
      sourceResolutionReason,
      streamResources,
      downloadResources,
      subtitleResources,
      episodeOptions,
      canonicalWatchHref,
      compatibilityHref: buildPublishedCompatibilityHref(identity.slug, selectedEpisode?.slug),
      watchQuery: buildPublishedWatchQuery(
        { publicId: identity.publicId },
        {
          episodePublicId: selectedEpisode?.publicId,
          resourcePublicId: selectedResource?.publicId,
          listPublicId: list?.publicId,
          listItemPublicRef: listItem?.publicRef,
          timeSeconds: query.timeSeconds,
        },
      ),
      list: list ?? undefined,
      listItem: listItem ?? undefined,
      queue,
    };
  }

  async getPublishedListByPublicId(publicId: string): Promise<PublishedListRecord | null> {
    const list = await this.db.userList.findFirst({
      where: {
        publicId,
        isSystem: true,
      },
      include: publishedListInclude,
    });

    return list ? mapPublishedList(list) : null;
  }

  async getPublishedListDirectory(): Promise<PublishedListDirectoryRecord> {
    const lists = await this.db.userList.findMany({
      where: {
        publicId: {
          not: null,
        },
        isSystem: true,
      },
      include: publishedListInclude,
      orderBy: { updatedAt: "desc" },
    });

    const items = lists
      .map((list) => mapPublishedListSummary(list))
      .filter((list): list is PublishedListSummaryRecord => Boolean(list));

    return {
      title: "Public Lists",
      description: "Curated published lists backed by the canonical catalog.",
      canonicalDirectoryHref: buildPublishedListDirectoryHref(),
      listCount: items.length,
      listCountLabel: buildPublishedListCountLabel(items.length),
      items,
    };
  }

  async getPublishedFeaturedLists(limit = 3): Promise<PublishedListSummaryRecord[]> {
    const lists = await this.db.userList.findMany({
      where: {
        publicId: {
          not: null,
        },
        isSystem: true,
      },
      include: publishedListInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: Math.max(1, Math.min(limit, 12)),
    });

    return lists
      .map((list) => mapPublishedListSummary(list))
      .filter((list): list is PublishedListSummaryRecord => Boolean(list));
  }

  async unpublishPublishedCatalogRecord(input: UnpublishPublishedCatalogInput): Promise<UnpublishPublishedCatalogResult> {
    const media = await this.db.mediaTitle.findUnique({
      where: {
        publicId: input.mediaPublicId,
      },
      select: {
        id: true,
        publicId: true,
        title: true,
        publishedAt: true,
      },
    });

    if (!media) {
      throw new BackendError(`Published catalog record '${input.mediaPublicId}' was not found.`, {
        status: 404,
        code: "catalog_unpublish_not_found",
      });
    }

    if (!media.publishedAt) {
      throw new BackendError(`Catalog record '${input.mediaPublicId}' is already unpublished.`, {
        status: 409,
        code: "catalog_unpublish_already_unpublished",
      });
    }

    const updated = await this.db.mediaTitle.update({
      where: {
        id: media.id,
      },
      data: {
        status: "ARCHIVED",
        isFeatured: false,
        publishedAt: null,
      },
      select: {
        id: true,
        publicId: true,
        status: true,
      },
    });

    const audit = await this.createOperatorLifecycleAudit({
      actorId: input.actorId,
      requestId: input.requestId,
      mediaId: updated.id,
      summary: buildLifecycleAuditSummary(media.title),
      notes: input.notes,
      metadata: {
        mediaPublicId: updated.publicId,
      },
    });

    return {
      auditId: audit.id,
      summary: audit.summary,
      recordedAt: audit.createdAt.toISOString(),
      mediaId: updated.id,
      mediaPublicId: updated.publicId,
      status: mapMediaStatus(updated.status),
    };
  }

  private async buildDetailRecord(media: PublishedMediaPayload): Promise<PublishedDetailRecord> {
    const identity = mapPublishedMediaIdentity(media);
    const seasons = media.seasons.map((season) => mapPublishedSeason(media, season));
    const episodes = seasons.flatMap((season) => season.episodes);
    const allResources = getAllPublishedResources(media);

    const related = await this.db.mediaTitle.findMany({
      where: {
        id: {
          not: media.id,
        },
        publishedAt: {
          not: null,
        },
        OR: [
          {
            type: media.type,
          },
          {
            genres: {
              some: {
                genreId: {
                  in: media.genres.map((entry) => entry.genreId),
                },
              },
            },
          },
        ],
      },
      include: publishedMediaInclude,
      take: 6,
      orderBy: [{ popularityScore: "desc" }, { publishedAt: "desc" }],
    });

    return {
      media: identity,
      seasons,
      episodes,
      streamResources: mapPublishedResourceCollection(media, allResources, "stream"),
      downloadResources: mapPublishedResourceCollection(media, allResources, "download"),
      subtitleResources: mapPublishedResourceCollection(media, allResources, "subtitle"),
      defaultEpisodePublicId: episodes[0]?.publicId,
      related: related.map((item) => mapPublishedCatalogCard(item)),
    };
  }
}

export function createPublishedCatalogRepository(context: RepositoryContext) {
  return new PublishedCatalogRepository(context);
}

export function createDefaultPublishedCatalogRepository() {
  return createPublishedCatalogRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
