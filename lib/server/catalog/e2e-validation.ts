import "server-only";

import type { DbExecutor } from "../../db/repositories/types";
import type {
  PersistedCandidateAliasRecord,
  PersistedNormalizedCandidateRecord,
} from "../../db/repositories/normalization/types";
import type { NormalizedCandidateDraft, StagingNormalizationRecord } from "../normalize";
import type { StagingProviderItem } from "../provider";
import type {
  PublishedCatalogCard,
  PublishedCatalogPageRecord,
  PublishedDetailRecord,
  PublishedEpisodeRecord,
  PublishedMediaIdentityRecord,
  PublishedPlaybackResourceRecord,
  PublishedWatchRecord,
} from "./types";

interface ValidationMediaTitle {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  originalTitle?: string | null;
  summary: string;
  description?: string | null;
  type: "MOVIE" | "SERIES" | "ANIME" | "VARIETY" | "DOCUMENTARY" | "SPECIAL";
  status: "DRAFT" | "ARCHIVED";
  releaseYear: number;
  originCountry?: string | null;
  language?: string | null;
  publishedAt: Date | null;
  seasonCount?: number | null;
  episodeCount?: number | null;
}

interface ValidationSeason {
  id: string;
  mediaId: string;
  seasonNumber: number;
  title?: string | null;
  episodeCount?: number | null;
}

interface ValidationEpisode {
  id: string;
  publicId: string;
  mediaId: string;
  seasonId?: string | null;
  episodeNumber?: number | null;
  slug: string;
  title: string;
}

interface ValidationAlternateTitle {
  id: string;
  mediaId: string;
  value: string;
}

export interface GoldenPathCatalogState {
  mediaTitles: ValidationMediaTitle[];
  seasons: ValidationSeason[];
  episodes: ValidationEpisode[];
  alternateTitles: ValidationAlternateTitle[];
}

export interface GoldenPathPublishedFixtures {
  page: PublishedCatalogPageRecord;
  detail: PublishedDetailRecord;
  watch: PublishedWatchRecord;
}

function buildCanonicalWatchHref(mediaPublicId: string, episodePublicId?: string, resourcePublicId?: string) {
  const params = new URLSearchParams({ v: mediaPublicId });

  if (episodePublicId) {
    params.set("e", episodePublicId);
  }

  if (resourcePublicId) {
    params.set("r", resourcePublicId);
  }

  return `/watch?${params.toString()}`;
}

function mapPublishedMediaType(value: ValidationMediaTitle["type"]): PublishedMediaIdentityRecord["type"] {
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
}

function mapStatus(value: ValidationMediaTitle["status"]): PublishedMediaIdentityRecord["status"] {
  return value === "ARCHIVED" ? "archived" : "draft";
}

export function buildGoldenPathNormalizationRecord(
  providerId: string,
  item: StagingProviderItem,
  providerKey = "jszyapi_vod_json",
): StagingNormalizationRecord {
  return {
    stagingCandidateId: `staging-${item.providerItemId}`,
    providerId,
    providerKey,
    providerItemId: item.providerItemId,
    title: item.title,
    originalTitle: item.originalTitle ?? null,
    summary: item.summary ?? null,
    releaseYear: item.releaseYear ?? null,
    region: item.region ?? null,
    language: item.language ?? null,
    rawCategory: item.rawCategory ?? null,
    rawEpisodeText: item.rawEpisodeText ?? null,
    typeHint: item.typeHint ?? "unknown",
    sourceFragments: item.sourceFragments,
    warnings: item.warnings,
    providerUpdatedAt: item.providerUpdatedAt ?? null,
  };
}

export function buildPersistedNormalizationArtifacts(
  draft: NormalizedCandidateDraft,
  now = new Date("2026-03-11T12:00:00.000Z"),
): {
  candidate: PersistedNormalizedCandidateRecord;
  aliases: PersistedCandidateAliasRecord[];
} {
  const candidateId = `normalized-${draft.providerItemId}`;

  return {
    candidate: {
      id: candidateId,
      stagingCandidateId: draft.stagingCandidateId,
      providerId: draft.providerId,
      providerItemId: draft.providerItemId,
      status: draft.warnings.length > 0 ? "warning" : "normalized",
      title: draft.title,
      originalTitle: draft.originalTitle ?? null,
      summary: draft.summary ?? null,
      mediaType: draft.mediaType,
      releaseYear: draft.releaseYear ?? null,
      region: draft.region ?? null,
      language: draft.language ?? null,
      seasonEpisodeHints: draft.seasonEpisodeHints,
      sourceSummary: draft.sourceSummary,
      evidence: draft.evidence,
      warnings: draft.warnings,
      normalizationNotes: [],
      failureSummary: null,
      createdAt: now,
      updatedAt: now,
    },
    aliases: draft.aliases.map((alias, index) => ({
      id: `alias-${index + 1}`,
      normalizedCandidateId: candidateId,
      source: alias.source,
      displayValue: alias.display,
      comparableValue: alias.comparable,
      note: null,
      createdAt: now,
    })),
  };
}

export function createGoldenPathPublishMemoryDb(): {
  db: DbExecutor;
  state: GoldenPathCatalogState;
} {
  const state: GoldenPathCatalogState = {
    mediaTitles: [],
    seasons: [],
    episodes: [],
    alternateTitles: [],
  };

  let mediaIndex = 1;
  let seasonIndex = 1;
  let episodeIndex = 1;
  let alternateIndex = 1;

  const db = {
    mediaTitle: {
      async findUnique(input: { where: { id?: string; slug?: string } }) {
        if (input.where.id) {
          return state.mediaTitles.find((record) => record.id === input.where.id) ?? null;
        }

        if (input.where.slug) {
          return state.mediaTitles.find((record) => record.slug === input.where.slug) ?? null;
        }

        return null;
      },
      async create(input: { data: Omit<ValidationMediaTitle, "id"> }) {
        const created: ValidationMediaTitle = {
          id: `media-${mediaIndex++}`,
          ...input.data,
        };
        state.mediaTitles.push(created);
        return created;
      },
      async update(input: { where: { id: string }; data: Partial<ValidationMediaTitle> }) {
        const record = state.mediaTitles.find((candidate) => candidate.id === input.where.id);

        if (!record) {
          throw new Error(`Missing media ${input.where.id}`);
        }

        Object.assign(record, input.data);
        return record;
      },
    },
    mediaAlternateTitle: {
      async findMany(input: { where: { mediaId: string } }) {
        return state.alternateTitles.filter((record) => record.mediaId === input.where.mediaId);
      },
      async create(input: { data: { mediaId: string; value: string } }) {
        const created: ValidationAlternateTitle = {
          id: `alternate-${alternateIndex++}`,
          mediaId: input.data.mediaId,
          value: input.data.value,
        };
        state.alternateTitles.push(created);
        return created;
      },
    },
    season: {
      async findMany(input: { where: { mediaId: string } }) {
        return state.seasons.filter((record) => record.mediaId === input.where.mediaId);
      },
      async create(input: { data: Omit<ValidationSeason, "id"> }) {
        const created: ValidationSeason = {
          id: `season-${seasonIndex++}`,
          ...input.data,
        };
        state.seasons.push(created);
        return created;
      },
    },
    episode: {
      async findMany(input: { where: { mediaId: string } }) {
        return state.episodes.filter((record) => record.mediaId === input.where.mediaId);
      },
      async create(input: { data: Omit<ValidationEpisode, "id"> }) {
        const created: ValidationEpisode = {
          id: `episode-${episodeIndex++}`,
          ...input.data,
        };
        state.episodes.push(created);
        return created;
      },
    },
  };

  return {
    db: db as unknown as DbExecutor,
    state,
  };
}

export function buildGoldenPathPublishedFixtures(state: GoldenPathCatalogState): GoldenPathPublishedFixtures {
  const media = state.mediaTitles[0];

  if (!media) {
    throw new Error("Golden path published fixtures require one created media title.");
  }

  const episodes = [...state.episodes].sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0));
  const selectedEpisode = episodes.at(-1);

  if (!selectedEpisode) {
    throw new Error("Golden path published fixtures require episodic output.");
  }

  const publishedEpisodes: PublishedEpisodeRecord[] = episodes.map((episode) => ({
    id: episode.id,
    publicId: episode.publicId,
    mediaPublicId: media.publicId,
    slug: episode.slug,
    seasonNumber: 1,
    episodeNumber: episode.episodeNumber ?? null,
    title: episode.title,
    summary: `Episode ${episode.episodeNumber} of ${media.title}.`,
    runtimeMinutes: 24,
    canonicalWatchHref: buildCanonicalWatchHref(media.publicId, episode.publicId),
    watchQuery: {
      mediaPublicId: media.publicId,
      episodePublicId: episode.publicId,
    },
  }));

  const mediaIdentity: PublishedMediaIdentityRecord = {
    id: media.id,
    publicId: media.publicId,
    slug: media.slug,
    title: media.title,
    originalTitle: media.originalTitle ?? null,
    summary: media.summary,
    description: media.description ?? null,
    tagline: "Golden path validation item.",
    type: mapPublishedMediaType(media.type),
    status: mapStatus(media.status),
    releaseYear: media.releaseYear,
    endYear: null,
    originCountry: media.originCountry ?? null,
    language: media.language ?? null,
    runtimeMinutes: null,
    episodeRuntimeMinutes: 24,
    seasonCount: media.seasonCount ?? null,
    episodeCount: media.episodeCount ?? null,
    ratingValue: 8.8,
    ratingCount: 1200,
    popularityScore: 92,
    genres: ["热血", "冒险"],
    alternateTitles: state.alternateTitles.map((alias) => alias.value),
    posterUrl: "https://images.example.com/xingyu-poster.jpg",
    backdropUrl: "https://images.example.com/xingyu-backdrop.jpg",
    canonicalWatchHref: buildCanonicalWatchHref(media.publicId),
    compatibilityHref: `/media/${media.slug}`,
    publishedAt: (media.publishedAt ?? new Date("2026-03-11T12:00:00.000Z")).toISOString(),
  };

  const degradedResource: PublishedPlaybackResourceRecord = {
    id: "resource-stream-primary",
    publicId: "res_stream_primary",
    mediaPublicId: media.publicId,
    episodePublicId: selectedEpisode.publicId,
    kind: "stream",
    provider: "m3u8",
    format: "hls",
    label: "Primary line",
    quality: "1080p",
    status: "degraded",
    healthState: "degraded",
    healthSummary: "Manifest checks are degraded on the primary line.",
    priority: 20,
    mirrorOrder: 0,
    isPreferred: true,
    isUsable: false,
    replacementPublicId: "res_stream_backup",
    url: "https://cdn.example.com/xingyu/3-primary.m3u8",
    maskedUrl: null,
    accessCode: null,
    canonicalWatchHref: buildCanonicalWatchHref(media.publicId, selectedEpisode.publicId, "res_stream_primary"),
    watchQuery: {
      mediaPublicId: media.publicId,
      episodePublicId: selectedEpisode.publicId,
      resourcePublicId: "res_stream_primary",
    },
  };

  const healthyResource: PublishedPlaybackResourceRecord = {
    id: "resource-stream-backup",
    publicId: "res_stream_backup",
    mediaPublicId: media.publicId,
    episodePublicId: selectedEpisode.publicId,
    kind: "stream",
    provider: "m3u8",
    format: "hls",
    label: "Backup line",
    quality: "1080p",
    status: "online",
    healthState: "healthy",
    healthSummary: null,
    priority: 10,
    mirrorOrder: 1,
    isPreferred: false,
    isUsable: true,
    replacementPublicId: null,
    url: "https://cdn.example.com/xingyu/3-backup.m3u8",
    maskedUrl: null,
    accessCode: null,
    canonicalWatchHref: buildCanonicalWatchHref(media.publicId, selectedEpisode.publicId, "res_stream_backup"),
    watchQuery: {
      mediaPublicId: media.publicId,
      episodePublicId: selectedEpisode.publicId,
      resourcePublicId: "res_stream_backup",
    },
  };

  return {
    page: {
      scope: "anime",
      q: "",
      page: 1,
      pageSize: 24,
      totalItems: 1,
      totalPages: 1,
      items: [
        {
          id: media.id,
          publicId: media.publicId,
          slug: media.slug,
          title: media.title,
          originalTitle: media.originalTitle ?? null,
          type: "anime",
          status: mapStatus(media.status),
          year: media.releaseYear,
          endYear: null,
          originCountry: media.originCountry ?? null,
          language: media.language ?? null,
          genreLabels: ["热血", "冒险"],
          posterUrl: mediaIdentity.posterUrl,
          backdropUrl: mediaIdentity.backdropUrl,
          ratingValue: mediaIdentity.ratingValue,
          ratingCount: mediaIdentity.ratingCount,
          availabilityLabel: "Healthy backup line available",
          episodeCount: media.episodeCount ?? null,
          episodeCountLabel: `${media.episodeCount ?? 0} episodes`,
          canonicalWatchHref: mediaIdentity.canonicalWatchHref,
          compatibilityHref: mediaIdentity.compatibilityHref,
        } satisfies PublishedCatalogCard,
      ],
      facets: {
        genres: [{ value: "热血", label: "热血", count: 1 }],
        years: [{ value: String(media.releaseYear), label: String(media.releaseYear), count: 1 }],
        regions: [{ value: media.originCountry ?? "大陆", label: media.originCountry ?? "大陆", count: 1 }],
      },
    },
    detail: {
      media: mediaIdentity,
      seasons: [
        {
          id: state.seasons[0]?.id ?? "season-1",
          seasonNumber: 1,
          title: state.seasons[0]?.title ?? "Season 1",
          releaseYear: media.releaseYear,
          episodeCount: publishedEpisodes.length,
          episodes: publishedEpisodes,
        },
      ],
      episodes: publishedEpisodes,
      streamResources: [degradedResource, healthyResource],
      downloadResources: [],
      subtitleResources: [],
      defaultEpisodePublicId: selectedEpisode.publicId,
      related: [],
    },
    watch: {
      media: mediaIdentity,
      selectedEpisode: publishedEpisodes.at(-1),
      selectedResource: healthyResource,
      requestedResourcePublicId: degradedResource.publicId,
      resolvedResourcePublicId: healthyResource.publicId,
      sourceResolutionReason: "preferred_healthy",
      streamResources: [degradedResource, healthyResource],
      downloadResources: [],
      subtitleResources: [],
      episodeOptions: publishedEpisodes,
      canonicalWatchHref: healthyResource.canonicalWatchHref,
      compatibilityHref: mediaIdentity.compatibilityHref,
      watchQuery: {
        mediaPublicId: media.publicId,
        episodePublicId: selectedEpisode.publicId,
        resourcePublicId: degradedResource.publicId,
      },
    },
  };
}
