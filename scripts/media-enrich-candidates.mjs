#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INPUT_PATH = path.join(repoRoot, "import-data", "media-ingest-manifest.json");
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, "import-data", "media-metadata-candidates.json");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map((value) => normalizeWhitespace(value)))].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function hasCjk(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

function hasLatin(value) {
  return /[A-Za-z]/.test(value);
}

function cleanLookupTitle(value) {
  return normalizeWhitespace(
    value
      .replace(/[【】[\]()]/g, " ")
      .replace(/[._]+/g, " ")
      .replace(/[-–]+/g, " ")
      .replace(/\bS\d{1,2}E\d{1,3}\b/gi, " ")
      .replace(/\b(?:19|20)\d{2}\b/g, " "),
  );
}

function trimTitleEdgePunctuation(value) {
  return normalizeWhitespace(value.replace(/^[\s:：|/-]+|[\s:：|/-]+$/g, ""));
}

function extractLatinTail(value) {
  const cleaned = cleanLookupTitle(value);
  const match = cleaned.match(/([A-Za-z][A-Za-z0-9'"&.,:;!?+\- ]{1,80})$/);
  if (!match) {
    return null;
  }

  const candidate = trimTitleEdgePunctuation(match[1]);
  const wordCount = candidate.split(/\s+/).filter(Boolean).length;
  return wordCount >= 1 && wordCount <= 8 ? candidate : null;
}

function extractEnglishFromVideos(entry) {
  const englishTitles = entry.files.videos
    .map((video) => extractLatinTail(video.inferredTitle))
    .filter(Boolean)
    .filter((title) => title.toLowerCase() !== cleanLookupTitle(entry.inferredTitle).toLowerCase())
    .sort((left, right) => right.length - left.length || left.localeCompare(right, "en"));

  return englishTitles[0] ?? null;
}

function splitBilingualTitle(title, fallbackEnglish) {
  const cleaned = cleanLookupTitle(title);
  const cjkLeadMatch = cleaned.match(/^([\u3040-\u30ff\u3400-\u9fff0-9·・\s:：]+)\s+([A-Za-z][A-Za-z0-9'"&.,:;!?+\- ]+)$/u);
  if (cjkLeadMatch) {
    const canonicalTitle = trimTitleEdgePunctuation(cjkLeadMatch[1]);
    const originalTitle = trimTitleEdgePunctuation(cjkLeadMatch[2]);

    return {
      canonicalTitle,
      originalTitle: originalTitle || fallbackEnglish,
      alternateTitles: uniqueSorted([cleaned, fallbackEnglish, canonicalTitle, originalTitle]),
    };
  }

  const segments = cleaned
    .split(/\s{2,}|\/|：|:|\|/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);

  const cjkSegments = segments.filter(hasCjk);
  const latinSegments = segments.filter(hasLatin);

  const canonicalTitle = trimTitleEdgePunctuation(cjkSegments[0] ?? segments[0] ?? cleaned);
  const originalTitle =
    trimTitleEdgePunctuation(latinSegments[0] ?? fallbackEnglish ?? (hasLatin(cleaned) && !hasCjk(cleaned) ? cleaned : ""));

  return {
    canonicalTitle,
    originalTitle: originalTitle && originalTitle !== canonicalTitle ? originalTitle : null,
    alternateTitles: uniqueSorted([cleaned, fallbackEnglish, ...segments]),
  };
}

function inferStatus(entry, localType, year, alternateTitles) {
  if (localType === "unknown") {
    return {
      status: "skipped",
      confidence: 0.2,
      notes: ["Local ingest could not confidently classify this folder as movie, series, or anime."],
    };
  }

  const notes = [];
  let status = "manual-review";
  let confidence = 0.6;

  if (year === null) {
    status = "ambiguous";
    confidence = 0.45;
    notes.push("Release year could not be inferred from local filenames.");
  }

  if (entry.counts.videoFiles > 1 && entry.counts.episodeVideos === 0 && entry.counts.specialVideos === 0) {
    status = "skipped";
    confidence = 0.2;
    notes.push("Folder looks like a collection of standalone clips instead of one catalog title.");
  }

  if (alternateTitles.length > 3) {
    notes.push("Multiple local title variants were detected and may need manual consolidation.");
  }

  return {
    status,
    confidence,
    notes,
  };
}

function buildQueryVariants(canonicalTitle, originalTitle, year) {
  const variants = [];

  if (canonicalTitle) {
    variants.push(canonicalTitle);
  }

  if (originalTitle) {
    variants.push(originalTitle);
  }

  if (canonicalTitle && year) {
    variants.push(`${canonicalTitle} ${year}`);
  }

  if (originalTitle && year) {
    variants.push(`${originalTitle} ${year}`);
  }

  if (canonicalTitle && originalTitle) {
    variants.push(`${canonicalTitle} ${originalTitle}`);
  }

  return uniqueSorted(variants);
}

function buildCandidateSources(canonicalTitle, originalTitle, year, localType, statusNotes) {
  const variants = buildQueryVariants(canonicalTitle, originalTitle, year);

  return ["douban", "imdb", "tmdb"].map((provider) => ({
    provider,
    lookupStatus: "pending",
    query: variants[0] ?? canonicalTitle ?? originalTitle ?? "",
    queryVariants: variants,
    candidateId: null,
    notes: [
      provider === "douban" && hasCjk(canonicalTitle ?? "") ? "Chinese title should usually be tried first." : null,
      provider === "imdb" && originalTitle ? "Original/Latin title is likely the strongest IMDb lookup key." : null,
      localType === "anime" ? "Anime titles may require alternate romanization during review." : null,
      ...statusNotes,
    ].filter(Boolean),
  }));
}

function buildCandidateEntry(entry) {
  const fallbackEnglish = extractEnglishFromVideos(entry);
  const splitTitle = splitBilingualTitle(entry.inferredTitle, fallbackEnglish);
  const alternateTitles = uniqueSorted([
    splitTitle.canonicalTitle,
    splitTitle.originalTitle,
    ...splitTitle.alternateTitles,
    cleanLookupTitle(entry.directoryName),
    fallbackEnglish,
  ]);
  const statusInfo = inferStatus(entry, entry.inferredType, entry.inferredYear, alternateTitles);

  return {
    relativeDirectory: entry.relativeDirectory,
    local: {
      inferredTitle: entry.inferredTitle,
      inferredYear: entry.inferredYear,
      inferredType: entry.inferredType,
      parserNotes: entry.parserNotes,
      counts: entry.counts,
    },
    normalized: {
      canonicalTitle: splitTitle.canonicalTitle,
      originalTitle: splitTitle.originalTitle,
      alternateTitles,
      lookupTitle: splitTitle.originalTitle ?? splitTitle.canonicalTitle,
      episodeCount: entry.counts.episodeVideos,
      specialCount: entry.counts.specialVideos,
    },
    candidateSources: buildCandidateSources(
      splitTitle.canonicalTitle,
      splitTitle.originalTitle,
      entry.inferredYear,
      entry.inferredType,
      statusInfo.notes,
    ),
    selectedCandidate: {
      canonicalTitle: splitTitle.canonicalTitle,
      originalTitle: splitTitle.originalTitle,
      year: entry.inferredYear,
      type: entry.inferredType,
      confidence: statusInfo.confidence,
      status: statusInfo.status,
      notes: uniqueSorted([...entry.parserNotes, ...statusInfo.notes]),
    },
  };
}

function buildOutput(inputPath, manifest) {
  const sourceManifestContent = readFileSync(inputPath, "utf8");
  const sourceManifestSha256 = createHash("sha256").update(sourceManifestContent).digest("hex");

  return {
    manifestVersion: 1,
    sourceManifestPath: toPosix(path.relative(repoRoot, inputPath)),
    sourceManifestSha256,
    entryCount: manifest.entryCount,
    entries: manifest.entries.map(buildCandidateEntry),
  };
}

function main() {
  const inputPath = path.resolve(process.argv[2] ?? DEFAULT_INPUT_PATH);
  const outputPath = path.resolve(process.argv[3] ?? DEFAULT_OUTPUT_PATH);

  const manifest = JSON.parse(readFileSync(inputPath, "utf8"));
  const output = buildOutput(inputPath, manifest);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        sourceManifestPath: output.sourceManifestPath,
        outputPath: toPosix(path.relative(repoRoot, outputPath)),
        entryCount: output.entryCount,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
