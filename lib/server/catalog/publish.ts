import "server-only";

import { randomUUID } from "node:crypto";

import { BackendError } from "../errors";

import type { DbExecutor } from "../../db/repositories/types";
import type { CatalogPublishInput, CatalogPublishResult } from "./types";

function slugify(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "media";
}

function buildOpaquePublicId(prefix: "med" | "ep"): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function mapMediaType(value: CatalogPublishInput["normalizedCandidate"]["mediaType"]) {
  switch (value) {
    case "movie":
      return "MOVIE";
    case "series":
      return "SERIES";
    case "anime":
      return "ANIME";
    case "variety":
      return "VARIETY";
    case "documentary":
      return "DOCUMENTARY";
    case "special":
      return "SPECIAL";
    case "unknown":
      return null;
  }
}

async function createUniqueMediaSlug(db: DbExecutor, value: string): Promise<string> {
  const base = slugify(value);

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await db.mediaTitle.findUnique({
      where: {
        slug: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

async function ensureSeasonEpisodeStructure(
  db: DbExecutor,
  mediaId: string,
  hints: NonNullable<CatalogPublishInput["normalizedCandidate"]["seasonEpisodeHints"]>,
): Promise<{ seasonCountDelta: number; episodeCountDelta: number }> {
  if (!hints.isEpisodic) {
    return { seasonCountDelta: 0, episodeCountDelta: 0 };
  }

  const seasonNumbers = hints.seasonNumbers.length > 0 ? Array.from(new Set(hints.seasonNumbers)).sort((a, b) => a - b) : [1];
  const targetEpisodeNumbers =
    hints.episodeNumbers.length > 0
      ? Array.from(new Set(hints.episodeNumbers)).sort((a, b) => a - b)
      : Array.from({ length: Math.max(hints.totalEpisodeCount ?? 0, 0) }, (_, index) => index + 1);

  const existingSeasons = await db.season.findMany({
    where: {
      mediaId,
    },
    select: {
      id: true,
      seasonNumber: true,
    },
  });

  const seasonIdByNumber = new Map<number, string>(existingSeasons.map((season) => [season.seasonNumber, season.id]));
  let createdSeasons = 0;

  for (const seasonNumber of seasonNumbers) {
    if (seasonIdByNumber.has(seasonNumber)) {
      continue;
    }

    const season = await db.season.create({
      data: {
        mediaId,
        seasonNumber,
        title: `Season ${seasonNumber}`,
        episodeCount: targetEpisodeNumbers.length || undefined,
      },
      select: {
        id: true,
        seasonNumber: true,
      },
    });

    seasonIdByNumber.set(season.seasonNumber, season.id);
    createdSeasons += 1;
  }

  const existingEpisodes = await db.episode.findMany({
    where: {
      mediaId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const existingEpisodeSlugs = new Set(existingEpisodes.map((episode) => episode.slug));
  let createdEpisodes = 0;

  for (const seasonNumber of seasonNumbers) {
    const seasonId = seasonIdByNumber.get(seasonNumber) ?? null;

    for (const episodeNumber of targetEpisodeNumbers) {
      const slug = seasonNumbers.length > 1 ? `s${seasonNumber}-e${episodeNumber}` : `episode-${episodeNumber}`;

      if (existingEpisodeSlugs.has(slug)) {
        continue;
      }

      await db.episode.create({
        data: {
          publicId: buildOpaquePublicId("ep"),
          mediaId,
          seasonId,
          episodeNumber,
          slug,
          title: `Episode ${episodeNumber}`,
        },
      });

      existingEpisodeSlugs.add(slug);
      createdEpisodes += 1;
    }
  }

  await db.mediaTitle.update({
    where: {
      id: mediaId,
    },
    data: {
      seasonCount: seasonNumbers.length,
      episodeCount: targetEpisodeNumbers.length > 0 ? targetEpisodeNumbers.length : undefined,
    },
  });

  return {
    seasonCountDelta: createdSeasons,
    episodeCountDelta: createdEpisodes,
  };
}

async function syncAlternateTitles(
  db: DbExecutor,
  mediaId: string,
  aliases: CatalogPublishInput["aliases"],
): Promise<number> {
  const existing = await db.mediaAlternateTitle.findMany({
    where: {
      mediaId,
    },
    select: {
      value: true,
    },
  });

  const existingValues = new Set(existing.map((record) => record.value.normalize("NFKC").trim().toLowerCase()));
  let inserted = 0;

  for (const alias of aliases) {
    const normalized = alias.displayValue.normalize("NFKC").trim().toLowerCase();

    if (!normalized || existingValues.has(normalized)) {
      continue;
    }

    await db.mediaAlternateTitle.create({
      data: {
        mediaId,
        value: alias.displayValue,
      },
    });

    existingValues.add(normalized);
    inserted += 1;
  }

  return inserted;
}

async function requireTargetMedia(db: DbExecutor, id?: string) {
  if (!id) {
    throw new BackendError("Review decision requires a canonical target media record.", {
      status: 400,
      code: "review_target_media_required",
    });
  }

  const media = await db.mediaTitle.findUnique({
    where: {
      id,
    },
  });

  if (!media) {
    throw new BackendError(`Canonical media '${id}' was not found.`, {
      status: 404,
      code: "catalog_publish_target_not_found",
    });
  }

  return media;
}

function requirePublishableMediaType(input: CatalogPublishInput) {
  const mediaType = mapMediaType(input.normalizedCandidate.mediaType);

  if (!mediaType) {
    throw new BackendError("Normalized candidate media type must be resolved before publish.", {
      status: 400,
      code: "catalog_publish_media_type_unresolved",
    });
  }

  return mediaType;
}

function requireReleaseYear(input: CatalogPublishInput) {
  if (!input.normalizedCandidate.releaseYear) {
    throw new BackendError("Normalized candidate release year is required before publish.", {
      status: 400,
      code: "catalog_publish_release_year_required",
    });
  }

  return input.normalizedCandidate.releaseYear;
}

export async function applyCatalogPublication(
  db: DbExecutor,
  input: CatalogPublishInput,
): Promise<CatalogPublishResult> {
  switch (input.decisionType) {
    case "approve": {
      const mediaType = requirePublishableMediaType(input);
      const releaseYear = requireReleaseYear(input);
      const slug = await createUniqueMediaSlug(db, input.normalizedCandidate.title.display);
      const created = await db.mediaTitle.create({
        data: {
          publicId: buildOpaquePublicId("med"),
          slug,
          title: input.normalizedCandidate.title.display,
          originalTitle: input.normalizedCandidate.originalTitle?.display,
          summary: input.normalizedCandidate.summary ?? "",
          description: input.normalizedCandidate.summary ?? undefined,
          type: mediaType,
          status: "DRAFT",
          releaseYear,
          originCountry: input.normalizedCandidate.region,
          language: input.normalizedCandidate.language,
          publishedAt: input.performedAt,
        },
      });

      const alternateTitleCount = await syncAlternateTitles(db, created.id, input.aliases);
      const seasonEpisodeResult = input.normalizedCandidate.seasonEpisodeHints
        ? await ensureSeasonEpisodeStructure(db, created.id, input.normalizedCandidate.seasonEpisodeHints)
        : { seasonCountDelta: 0, episodeCountDelta: 0 };

      return {
        mediaId: created.id,
        action: "created",
        alternateTitleCount,
        ...seasonEpisodeResult,
      };
    }

    case "merge": {
      const target = await requireTargetMedia(db, input.targetCanonicalMediaId);

      await db.mediaTitle.update({
        where: { id: target.id },
        data: {
          originalTitle: target.originalTitle ?? input.normalizedCandidate.originalTitle?.display,
          summary: target.summary || input.normalizedCandidate.summary ? target.summary || input.normalizedCandidate.summary || "" : target.summary,
          description: target.description ?? input.normalizedCandidate.summary ?? undefined,
          originCountry: target.originCountry ?? input.normalizedCandidate.region,
          language: target.language ?? input.normalizedCandidate.language,
          publishedAt: target.publishedAt ?? input.performedAt,
        },
      });

      const alternateTitleCount = await syncAlternateTitles(db, target.id, input.aliases);
      const seasonEpisodeResult = input.normalizedCandidate.seasonEpisodeHints
        ? await ensureSeasonEpisodeStructure(db, target.id, input.normalizedCandidate.seasonEpisodeHints)
        : { seasonCountDelta: 0, episodeCountDelta: 0 };

      return {
        mediaId: target.id,
        action: "merged",
        alternateTitleCount,
        ...seasonEpisodeResult,
      };
    }

    case "replace": {
      const target = await requireTargetMedia(db, input.targetCanonicalMediaId);
      const mediaType = mapMediaType(input.normalizedCandidate.mediaType) ?? target.type;
      const releaseYear = input.normalizedCandidate.releaseYear ?? target.releaseYear;

      await db.mediaTitle.update({
        where: { id: target.id },
        data: {
          title: input.normalizedCandidate.title.display,
          originalTitle: input.normalizedCandidate.originalTitle?.display ?? target.originalTitle,
          summary: input.normalizedCandidate.summary ?? target.summary,
          description: input.normalizedCandidate.summary ?? target.description ?? undefined,
          type: mediaType,
          releaseYear,
          originCountry: input.normalizedCandidate.region ?? target.originCountry,
          language: input.normalizedCandidate.language ?? target.language,
          publishedAt: target.publishedAt ?? input.performedAt,
        },
      });

      const alternateTitleCount = await syncAlternateTitles(db, target.id, input.aliases);
      const seasonEpisodeResult = input.normalizedCandidate.seasonEpisodeHints
        ? await ensureSeasonEpisodeStructure(db, target.id, input.normalizedCandidate.seasonEpisodeHints)
        : { seasonCountDelta: 0, episodeCountDelta: 0 };

      return {
        mediaId: target.id,
        action: "replaced",
        alternateTitleCount,
        ...seasonEpisodeResult,
      };
    }

    case "unpublish": {
      const target = await requireTargetMedia(db, input.targetCanonicalMediaId);

      await db.mediaTitle.update({
        where: { id: target.id },
        data: {
          status: "ARCHIVED",
          publishedAt: null,
        },
      });

      return {
        mediaId: target.id,
        action: "unpublished",
        alternateTitleCount: 0,
        seasonCountDelta: 0,
        episodeCountDelta: 0,
      };
    }
  }

  throw new BackendError("Unsupported publish decision type.", {
    status: 400,
    code: "catalog_publish_decision_not_supported",
  });
}
