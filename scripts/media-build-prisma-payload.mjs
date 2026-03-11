#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INPUT_PATH = path.join(repoRoot, "import-data", "media-import-seed.json");
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, "import-data", "media-prisma-payload.json");
const LEGACY_FLAG = "--legacy-direct-import";

function getPositionArgs() {
  return process.argv.slice(2).filter((value) => !value.startsWith("--"));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function readJsonWithHash(filePath) {
  const content = readFileSync(filePath, "utf8");
  return {
    data: JSON.parse(content),
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

function requireLegacyDirectImportFlag() {
  if (!process.argv.includes(LEGACY_FLAG)) {
    console.error(
      [
        "This script is a legacy direct-import helper.",
        "It is not part of the active Round B provider/staging ingest workflow.",
        `Run it only via an explicit legacy path using ${LEGACY_FLAG}.`,
      ].join(" "),
    );
    process.exit(1);
  }
}

function mapMediaType(type) {
  if (type === "movie") {
    return "MOVIE";
  }

  if (type === "series") {
    return "SERIES";
  }

  if (type === "anime") {
    return "ANIME";
  }

  return "SPECIAL";
}

function mapResourceFormat(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".mp4" || extension === ".m4v" || extension === ".mov") {
    return "MP4";
  }

  if (extension === ".mkv") {
    return "MKV";
  }

  if (extension === ".m3u8") {
    return "HLS";
  }

  return "TEXT";
}

function secondsToMinutes(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.max(1, Math.round(seconds / 60));
}

function dedupeByValue(values) {
  const seen = new Set();
  const items = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    items.push(value);
  }

  return items;
}

function buildAlternateTitles(entry) {
  const values = dedupeByValue([
    entry.identity.originalTitle,
    entry.identity.canonicalTitle,
    ...(entry.review.matchedSources || []).map((source) => source.title),
  ]);

  return values
    .filter((value) => value && value !== entry.identity.canonicalTitle)
    .map((value) => ({
      languageCode: /[A-Za-z]/.test(value) && !/[\u4e00-\u9fff]/.test(value) ? "en" : "zh-CN",
      value,
    }));
}

function buildArtwork(entry) {
  return entry.artworkCandidates.map((artwork, index) => ({
    kind: index === 0 ? "POSTER" : "THUMBNAIL",
    url: `local://${artwork.relativePath}`,
    altText: `${entry.identity.canonicalTitle} ${artwork.kind}`,
    isPrimary: index === 0,
    sourceFile: artwork.relativePath,
  }));
}

function buildExternalReferences(entry) {
  return (entry.review.matchedSources || []).map((source) => ({
    provider: source.provider,
    providerId: source.id,
    title: source.title,
    url: source.url,
    status: source.status,
  }));
}

function buildMovieResources(entry) {
  return entry.content.featureFiles.map((file, index) => ({
    kind: "STREAM",
    provider: "OTHER",
    format: mapResourceFormat(file.fileName),
    label: index === 0 ? "Local feature file" : `Local feature file ${index + 1}`,
    quality:
      file.ffprobe?.video?.height && file.ffprobe?.video?.width
        ? `${file.ffprobe.video.width}x${file.ffprobe.video.height}`
        : null,
    url: `local://${file.relativePath}`,
    maskedUrl: null,
    accessCode: null,
    status: "PENDING",
    mirrorOrder: index,
    reportCount: 0,
    localFile: file.relativePath,
    notes: ["Local file placeholder generated from import seed."],
  }));
}

function buildEpisodeResources(episode) {
  return [
    {
      kind: "STREAM",
      provider: "OTHER",
      format: mapResourceFormat(episode.relativePath),
      label: `Local episode file S${episode.seasonNumber}E${episode.episodeNumber}`,
      quality:
        episode.ffprobe?.video?.height && episode.ffprobe?.video?.width
          ? `${episode.ffprobe.video.width}x${episode.ffprobe.video.height}`
          : null,
      url: `local://${episode.relativePath}`,
      maskedUrl: null,
      accessCode: null,
      status: "PENDING",
      mirrorOrder: 0,
      reportCount: 0,
      localFile: episode.relativePath,
      notes: ["Local file placeholder generated from import seed."],
    },
  ];
}

function buildEpisodes(entry, mediaSlug) {
  if (entry.content.kind !== "episodic") {
    return [];
  }

  return entry.content.episodes.map((episode) => ({
    slug: `${mediaSlug}-s${String(episode.seasonNumber).padStart(2, "0")}e${String(episode.episodeNumber).padStart(2, "0")}`,
    title: episode.localTitle || `Episode ${episode.episodeNumber}`,
    summary: null,
    runtimeMinutes: secondsToMinutes(episode.ffprobe?.durationSeconds ?? null),
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
    airDate: null,
    localFile: episode.relativePath,
    resources: buildEpisodeResources(episode),
  }));
}

function buildSeasons(entry, episodes) {
  if (entry.content.kind !== "episodic") {
    return [];
  }

  return entry.content.seasonNumbers.map((seasonNumber) => {
    const seasonEpisodes = episodes.filter((episode) => episode.seasonNumber === seasonNumber);
    return {
      seasonNumber,
      title: `Season ${seasonNumber}`,
      releaseYear: entry.identity.year,
      episodeCount: seasonEpisodes.length,
    };
  });
}

function buildMediaTitle(entry) {
  const mediaSlug = slugify(`${entry.identity.canonicalTitle}-${entry.identity.year ?? "unknown"}`) || slugify(entry.relativeDirectory);
  const episodes = buildEpisodes(entry, mediaSlug);
  const seasons = buildSeasons(entry, episodes);
  const movieRuntime =
    entry.content.kind === "movie" ? secondsToMinutes(entry.content.featureFiles[0]?.ffprobe?.durationSeconds ?? null) : null;
  const episodeRuntime =
    entry.content.kind === "episodic" ? secondsToMinutes(entry.content.episodes[0]?.ffprobe?.durationSeconds ?? null) : null;

  return {
    slug: mediaSlug,
    title: entry.identity.canonicalTitle,
    originalTitle: entry.identity.originalTitle,
    summary: `Imported from local library staging: ${entry.identity.canonicalTitle}.`,
    description: null,
    tagline: null,
    type: mapMediaType(entry.identity.type),
    status: "DRAFT",
    releaseYear: entry.identity.year,
    endYear: null,
    originCountry: null,
    language: null,
    runtimeMinutes: movieRuntime,
    episodeRuntimeMinutes: episodeRuntime,
    seasonCount: seasons.length || null,
    episodeCount: episodes.length || null,
    ratingValue: null,
    ratingCount: 0,
    popularityScore: 0,
    isFeatured: false,
    publishedAt: null,
    importGate: {
      reviewStatus: entry.reviewStatus,
      importStatus: entry.importStatus,
      confidence: entry.review.confidence,
      requiresManualReview: entry.importStatus !== "ready",
      notes: entry.review.notes,
    },
    alternateTitles: buildAlternateTitles(entry),
    artwork: buildArtwork(entry),
    externalReferences: buildExternalReferences(entry),
    seasons,
    episodes,
    resources: entry.content.kind === "movie" ? buildMovieResources(entry) : [],
    localAssets: entry.localAssets,
  };
}

function main() {
  requireLegacyDirectImportFlag();

  const [inputArg, outputArg] = getPositionArgs();
  const inputPath = path.resolve(inputArg ?? DEFAULT_INPUT_PATH);
  const outputPath = path.resolve(outputArg ?? DEFAULT_OUTPUT_PATH);

  const { data: seed, sha256 } = readJsonWithHash(inputPath);
  const importableEntries = seed.entries.filter((entry) => entry.importStatus === "ready");
  const gatedEntries = seed.entries.filter((entry) => entry.importStatus !== "ready");

  const output = {
    manifestVersion: 1,
    sourceSeedPath: toPosix(path.relative(repoRoot, inputPath)),
    sourceSeedSha256: sha256,
    importableEntryCount: importableEntries.length,
    gatedEntryCount: gatedEntries.length,
    skippedEntryCount: seed.skippedEntryCount,
    mediaTitles: importableEntries.map(buildMediaTitle),
    gatedEntries: gatedEntries.map((entry) => ({
      relativeDirectory: entry.relativeDirectory,
      reviewStatus: entry.reviewStatus,
      importStatus: entry.importStatus,
      canonicalTitle: entry.identity.canonicalTitle,
      year: entry.identity.year,
      type: entry.identity.type,
      notes: entry.review.notes,
    })),
    skippedEntries: seed.skippedEntries,
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        outputPath: toPosix(path.relative(repoRoot, outputPath)),
        importableEntryCount: output.importableEntryCount,
        gatedEntryCount: output.gatedEntryCount,
        skippedEntryCount: output.skippedEntryCount,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
