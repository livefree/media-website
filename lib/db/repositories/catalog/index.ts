import "server-only";

import { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";
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
          resources: true,
        },
        orderBy: [{ episodeNumber: "asc" }, { title: "asc" }],
      },
    },
    orderBy: { seasonNumber: "asc" },
  },
  resources: true,
} satisfies Prisma.MediaTitleInclude;

type PublishedMediaPayload = Prisma.MediaTitleGetPayload<{ include: typeof publishedMediaInclude }>;

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

function buildAvailabilityLabel(media: PublishedMediaPayload): string {
  const allResources = getAllPublishedResources(media);
  const onlineStreams = allResources.filter(({ resource }) => resource.kind === "STREAM" && resource.status === "ONLINE").length;
  const degradedStreams = allResources.filter(({ resource }) => resource.kind === "STREAM" && resource.status === "DEGRADED").length;
  const downloads = allResources.filter(({ resource }) => resource.kind === "DOWNLOAD").length;

  if (onlineStreams > 0) {
    return `${onlineStreams} streams live`;
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

function mapPublishedResource(
  media: PublishedMediaPayload,
  resource: PublishedMediaPayload["resources"][number],
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
    url: resource.url,
    maskedUrl: resource.maskedUrl,
    accessCode: resource.accessCode,
    canonicalWatchHref: buildPublishedWatchHref(watchQuery),
    watchQuery,
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

    const streamResources = [
      ...media.resources.filter((resource) => resource.kind === "STREAM").map((resource) => mapPublishedResource(media, resource, null, query.listPublicId, query.listItemPublicRef)),
      ...(selectedEpisodeEntity
        ? selectedEpisodeEntity.resources
            .filter((resource) => resource.kind === "STREAM")
            .map((resource) => mapPublishedResource(media, resource, selectedEpisodeEntity, query.listPublicId, query.listItemPublicRef))
        : []),
    ];
    const downloadResources = [
      ...media.resources
        .filter((resource) => resource.kind === "DOWNLOAD")
        .map((resource) => mapPublishedResource(media, resource, null, query.listPublicId, query.listItemPublicRef)),
      ...(selectedEpisodeEntity
        ? selectedEpisodeEntity.resources
            .filter((resource) => resource.kind === "DOWNLOAD")
            .map((resource) => mapPublishedResource(media, resource, selectedEpisodeEntity, query.listPublicId, query.listItemPublicRef))
        : []),
    ];
    const subtitleResources = [
      ...media.resources
        .filter((resource) => resource.kind === "SUBTITLE")
        .map((resource) => mapPublishedResource(media, resource, null, query.listPublicId, query.listItemPublicRef)),
      ...(selectedEpisodeEntity
        ? selectedEpisodeEntity.resources
            .filter((resource) => resource.kind === "SUBTITLE")
            .map((resource) => mapPublishedResource(media, resource, selectedEpisodeEntity, query.listPublicId, query.listItemPublicRef))
        : []),
    ];

    const selectedResource =
      (query.resourcePublicId
        ? [...streamResources, ...downloadResources, ...subtitleResources].find((resource) => resource.publicId === query.resourcePublicId)
        : undefined) ?? streamResources[0];

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

  private async buildDetailRecord(media: PublishedMediaPayload): Promise<PublishedDetailRecord> {
    const identity = mapPublishedMediaIdentity(media);
    const seasons = media.seasons.map((season) => mapPublishedSeason(media, season));
    const episodes = seasons.flatMap((season) => season.episodes);
    const allResources = getAllPublishedResources(media);
    const streamResources = allResources
      .filter(({ resource }) => resource.kind === "STREAM")
      .map(({ resource, episode }) => mapPublishedResource(media, resource, episode));
    const downloadResources = allResources
      .filter(({ resource }) => resource.kind === "DOWNLOAD")
      .map(({ resource, episode }) => mapPublishedResource(media, resource, episode));
    const subtitleResources = allResources
      .filter(({ resource }) => resource.kind === "SUBTITLE")
      .map(({ resource, episode }) => mapPublishedResource(media, resource, episode));

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
      streamResources,
      downloadResources,
      subtitleResources,
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
