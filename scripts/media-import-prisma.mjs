#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_PATH = path.join(repoRoot, "import-data", "media-prisma-payload.json");
const LEGACY_FLAG = "--legacy-direct-import";

function getPositionArgs() {
  return process.argv.slice(2).filter((value) => !value.startsWith("--"));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function getFlag(flag) {
  return process.argv.includes(flag);
}

function requireLegacyDirectImportFlag() {
  if (!getFlag(LEGACY_FLAG)) {
    console.error(
      [
        "This script is a legacy direct-to-canonical import path.",
        "It is quarantined from the active Round B provider/staging workflow.",
        `Run it only with the explicit ${LEGACY_FLAG} flag.`,
      ].join(" "),
    );
    process.exit(1);
  }
}

function readPayload(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function summarizePayload(payload) {
  return {
    inputPath: toPosix(path.relative(repoRoot, inputPath)),
    importableEntryCount: payload.importableEntryCount,
    gatedEntryCount: payload.gatedEntryCount,
    skippedEntryCount: payload.skippedEntryCount,
    slugs: payload.mediaTitles.map((item) => item.slug),
  };
}

async function createMediaTitle(prisma, item) {
  const existing = await prisma.mediaTitle.findUnique({
    where: { slug: item.slug },
    select: { id: true },
  });

  if (existing) {
    return {
      slug: item.slug,
      status: "skipped-existing",
    };
  }

  const created = await prisma.mediaTitle.create({
    data: {
      slug: item.slug,
      title: item.title,
      originalTitle: item.originalTitle,
      summary: item.summary,
      description: item.description,
      tagline: item.tagline,
      type: item.type,
      status: item.status,
      releaseYear: item.releaseYear,
      endYear: item.endYear,
      originCountry: item.originCountry,
      language: item.language,
      runtimeMinutes: item.runtimeMinutes,
      episodeRuntimeMinutes: item.episodeRuntimeMinutes,
      seasonCount: item.seasonCount,
      episodeCount: item.episodeCount,
      ratingValue: item.ratingValue,
      ratingCount: item.ratingCount,
      popularityScore: item.popularityScore,
      isFeatured: item.isFeatured,
      publishedAt: item.publishedAt,
    },
  });

  if (item.alternateTitles.length > 0) {
    await prisma.mediaAlternateTitle.createMany({
      data: item.alternateTitles.map((alternateTitle) => ({
        mediaId: created.id,
        languageCode: alternateTitle.languageCode,
        value: alternateTitle.value,
      })),
    });
  }

  if (item.artwork.length > 0) {
    await prisma.artwork.createMany({
      data: item.artwork.map((artwork) => ({
        mediaId: created.id,
        kind: artwork.kind,
        url: artwork.url,
        altText: artwork.altText,
        isPrimary: artwork.isPrimary,
      })),
    });
  }

  const seasonIdByNumber = new Map();

  for (const season of item.seasons) {
    const createdSeason = await prisma.season.create({
      data: {
        mediaId: created.id,
        seasonNumber: season.seasonNumber,
        title: season.title,
        releaseYear: season.releaseYear,
        episodeCount: season.episodeCount,
      },
    });

    seasonIdByNumber.set(season.seasonNumber, createdSeason.id);
  }

  const episodeIdBySlug = new Map();

  for (const episode of item.episodes) {
    const createdEpisode = await prisma.episode.create({
      data: {
        mediaId: created.id,
        seasonId: seasonIdByNumber.get(episode.seasonNumber) ?? null,
        episodeNumber: episode.episodeNumber,
        slug: episode.slug,
        title: episode.title,
        summary: episode.summary,
        runtimeMinutes: episode.runtimeMinutes,
        airDate: episode.airDate,
      },
    });

    episodeIdBySlug.set(episode.slug, createdEpisode.id);
  }

  if (item.resources.length > 0) {
    await prisma.resource.createMany({
      data: item.resources.map((resource) => ({
        mediaId: created.id,
        kind: resource.kind,
        provider: resource.provider,
        format: resource.format,
        label: resource.label,
        quality: resource.quality,
        url: resource.url,
        maskedUrl: resource.maskedUrl,
        accessCode: resource.accessCode,
        status: resource.status,
        mirrorOrder: resource.mirrorOrder,
        reportCount: resource.reportCount,
      })),
    });
  }

  for (const episode of item.episodes) {
    const episodeId = episodeIdBySlug.get(episode.slug);
    if (!episodeId || episode.resources.length === 0) {
      continue;
    }

    await prisma.resource.createMany({
      data: episode.resources.map((resource) => ({
        mediaId: created.id,
        episodeId,
        kind: resource.kind,
        provider: resource.provider,
        format: resource.format,
        label: resource.label,
        quality: resource.quality,
        url: resource.url,
        maskedUrl: resource.maskedUrl,
        accessCode: resource.accessCode,
        status: resource.status,
        mirrorOrder: resource.mirrorOrder,
        reportCount: resource.reportCount,
      })),
    });
  }

  return {
    slug: item.slug,
    status: "created",
  };
}

const [inputArg] = getPositionArgs();
const inputPath = path.resolve(inputArg ?? DEFAULT_INPUT_PATH);
const shouldApply = getFlag("--apply");

async function main() {
  requireLegacyDirectImportFlag();

  const payload = readPayload(inputPath);

  if (!shouldApply) {
    process.stdout.write(`${JSON.stringify(summarizePayload(payload), null, 2)}\n`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when running with --apply.");
  }

  const prisma = new PrismaClient();

  try {
    const results = [];
    for (const item of payload.mediaTitles) {
      results.push(await createMediaTitle(prisma, item));
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "apply",
          inputPath: toPosix(path.relative(repoRoot, inputPath)),
          createdCount: results.filter((item) => item.status === "created").length,
          skippedExistingCount: results.filter((item) => item.status === "skipped-existing").length,
          results,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
