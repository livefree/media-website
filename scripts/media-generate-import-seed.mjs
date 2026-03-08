#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INGEST_PATH = path.join(repoRoot, "import-data", "media-ingest-manifest.json");
const DEFAULT_REVIEW_PATH = path.join(repoRoot, "import-data", "media-metadata-reviewed.json");
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, "import-data", "media-import-seed.json");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function readJsonWithHash(filePath) {
  const content = readFileSync(filePath, "utf8");
  return {
    data: JSON.parse(content),
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

function safeEpisodeSort(left, right) {
  return (left.season ?? 1) - (right.season ?? 1) || (left.episode ?? 0) - (right.episode ?? 0) || left.relativePath.localeCompare(right.relativePath, "en");
}

function safeFileSort(left, right) {
  return left.relativePath.localeCompare(right.relativePath, "en");
}

function inferPosterCandidates(entry) {
  return entry.files.images
    .slice()
    .sort(safeFileSort)
    .map((image, index) => ({
      relativePath: image.relativePath,
      kind: index === 0 ? "poster-candidate" : "image-candidate",
      fileName: image.baseName,
    }));
}

function buildMovieBreakdown(entry) {
  const features = entry.files.videos
    .filter((file) => file.kind === "feature")
    .slice()
    .sort(safeFileSort)
    .map((file) => ({
      relativePath: file.relativePath,
      fileName: file.baseName,
      ffprobe: file.ffprobe ?? null,
    }));

  return {
    kind: "movie",
    featureCount: features.length,
    featureFiles: features,
  };
}

function buildEpisodeRecord(entryEpisode, sourceDirectory, index) {
  return {
    sequence: index + 1,
    seasonNumber: entryEpisode.season ?? 1,
    episodeNumber: entryEpisode.episode ?? index + 1,
    localTitle: entryEpisode.titleCandidate,
    relativePath: entryEpisode.relativePath,
    absoluteSourceHint: toPosix(path.join(sourceDirectory, entryEpisode.relativePath)),
    ffprobe: entryEpisode.ffprobe ?? null,
    resourceMapping: {
      playbackProvider: null,
      downloadProvider: null,
      subtitleProvider: null,
      mappingStatus: "pending",
    },
  };
}

function buildEpisodicBreakdown(entry, sourceDirectory) {
  const episodes = entry.episodes
    .slice()
    .sort(safeEpisodeSort)
    .map((episode, index) => buildEpisodeRecord(episode, sourceDirectory, index));

  return {
    kind: "episodic",
    episodeCount: episodes.length,
    seasonNumbers: [...new Set(episodes.map((episode) => episode.seasonNumber))].sort((left, right) => left - right),
    episodes,
    specials: entry.specials
      .slice()
      .sort(safeFileSort)
      .map((special) => ({
        relativePath: special.relativePath,
        tag: special.tag,
        localTitle: special.titleCandidate,
        ffprobe: special.ffprobe ?? null,
      })),
  };
}

function buildResourcePlaceholders() {
  return {
    streaming: {
      provider: null,
      mode: "pending",
      mappingNotes: [],
    },
    downloads: {
      provider: null,
      mode: "pending",
      mappingNotes: [],
    },
    subtitles: {
      provider: null,
      mode: "pending",
      mappingNotes: [],
    },
  };
}

function buildSeedEntry(ingestEntry, reviewEntry, sourceRoot) {
  const review = reviewEntry.resolved;
  const reviewStatus = reviewEntry.reviewStatus;
  const inScope = reviewStatus === "matched" || reviewStatus === "manual-review";
  const isEpisodic = review.type === "series" || review.type === "anime" || ingestEntry.episodes.length > 0;

  return {
    relativeDirectory: ingestEntry.relativeDirectory,
    localSourceDirectory: toPosix(path.join(sourceRoot, ingestEntry.relativeDirectory)),
    reviewStatus,
    importStatus: reviewStatus === "matched" ? "ready" : reviewStatus === "manual-review" ? "needs-review" : "skipped",
    inScope,
    identity: {
      canonicalTitle: review.canonicalTitle,
      originalTitle: review.originalTitle,
      year: review.year,
      type: review.type,
    },
    review: {
      confidence: review.confidence,
      notes: review.notes,
      matchedSources: review.sources,
    },
    artworkCandidates: inferPosterCandidates(ingestEntry),
    localAssets: {
      subtitleFiles: ingestEntry.files.subtitles.slice().sort(safeFileSort).map((subtitle) => ({
        relativePath: subtitle.relativePath,
        fileName: subtitle.baseName,
      })),
      sidecarFiles: ingestEntry.files.sidecars.slice().sort(safeFileSort).map((sidecar) => ({
        relativePath: sidecar.relativePath,
        fileName: sidecar.baseName,
      })),
    },
    content: isEpisodic ? buildEpisodicBreakdown(ingestEntry, sourceRoot) : buildMovieBreakdown(ingestEntry),
    resourcePlaceholders: buildResourcePlaceholders(),
  };
}

function main() {
  const ingestPath = path.resolve(process.argv[2] ?? DEFAULT_INGEST_PATH);
  const reviewPath = path.resolve(process.argv[3] ?? DEFAULT_REVIEW_PATH);
  const outputPath = path.resolve(process.argv[4] ?? DEFAULT_OUTPUT_PATH);

  const { data: ingestManifest, sha256: ingestSha } = readJsonWithHash(ingestPath);
  const { data: reviewOverlay, sha256: reviewSha } = readJsonWithHash(reviewPath);

  const reviewByDirectory = new Map(reviewOverlay.entries.map((entry) => [entry.relativeDirectory, entry]));

  const entries = [];
  const skippedEntries = [];

  for (const ingestEntry of ingestManifest.entries) {
    const reviewEntry = reviewByDirectory.get(ingestEntry.relativeDirectory);
    if (!reviewEntry) {
      skippedEntries.push({
        relativeDirectory: ingestEntry.relativeDirectory,
        reason: "missing-reviewed-overlay",
      });
      continue;
    }

    const seedEntry = buildSeedEntry(ingestEntry, reviewEntry, ingestManifest.sourceRoot);
    if (seedEntry.importStatus === "skipped") {
      skippedEntries.push({
        relativeDirectory: seedEntry.relativeDirectory,
        reason: reviewEntry.resolved.notes,
        reviewStatus: reviewEntry.reviewStatus,
      });
      continue;
    }

    entries.push(seedEntry);
  }

  const output = {
    manifestVersion: 1,
    sourceIngestPath: toPosix(path.relative(repoRoot, ingestPath)),
    sourceIngestSha256: ingestSha,
    sourceReviewPath: toPosix(path.relative(repoRoot, reviewPath)),
    sourceReviewSha256: reviewSha,
    generatedEntryCount: entries.length,
    skippedEntryCount: skippedEntries.length,
    entries,
    skippedEntries,
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        outputPath: toPosix(path.relative(repoRoot, outputPath)),
        generatedEntryCount: output.generatedEntryCount,
        skippedEntryCount: output.skippedEntryCount,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
