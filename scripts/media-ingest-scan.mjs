#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_SOURCE_ROOT = path.join(repoRoot, "import-video");
const DEFAULT_OUTPUT_PATH = path.join(repoRoot, "import-data", "media-ingest-manifest.json");

const VIDEO_EXTENSIONS = new Set([".mkv", ".mp4", ".m4v", ".mov", ".avi", ".ts", ".webm", ".mpeg", ".mpg"]);
const SUBTITLE_EXTENSIONS = new Set([".ass", ".ssa", ".srt", ".vtt", ".sub"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const HIDDEN_FILE_NAMES = new Set([".ds_store", "thumbs.db"]);

const TECH_TOKENS = [
  "2160p",
  "1080p",
  "720p",
  "4k",
  "sdr",
  "hdr",
  "web-dl",
  "webrip",
  "bdrip",
  "bluray",
  "hmax",
  "h.265",
  "h265",
  "h.264",
  "h264",
  "x264",
  "x265",
  "hi10p",
  "ddp5.1",
  "ddp5",
  "ddp",
  "dts",
  "atmos",
  "chs",
  "eng",
  "it",
  "quickio",
  "bobo",
];

const GENERIC_TAGS = [
  "无字片源",
  "国语中字",
  "中文字幕",
  "国语配音",
  "国宴大师",
  "国产剧",
];

const FFPROBE_AVAILABLE = (() => {
  const result = spawnSync("ffprobe", ["-version"], { encoding: "utf8" });
  return result.status === 0;
})();

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function classifyExtension(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  if (SUBTITLE_EXTENSIONS.has(extension)) {
    return "subtitle";
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  return "sidecar";
}

function isHiddenFile(fileName) {
  return HIDDEN_FILE_NAMES.has(fileName.toLowerCase());
}

function walkFiles(rootDirectory) {
  const files = [];

  function visit(currentDirectory) {
    const entries = readdirSync(currentDirectory, { withFileTypes: true })
      .filter((entry) => !isHiddenFile(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  visit(rootDirectory);
  return files;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function removeBracketNoise(value) {
  let result = value;
  result = result.replace(/[【】\[\]()]/g, " ");
  for (const tag of GENERIC_TAGS) {
    result = result.replace(new RegExp(tag, "gi"), " ");
  }
  return result;
}

function stripTechnicalNoise(value) {
  let result = value
    .replace(/\bH\s*265\b/gi, " H265 ")
    .replace(/\bH\s*264\b/gi, " H264 ")
    .replace(/\bDDP5\s*1\b/gi, " DDP5.1 ");
  for (const token of TECH_TOKENS) {
    result = result.replace(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), " ");
  }

  result = result.replace(/全\s*\d+\s*集/gi, " ");
  result = result.replace(/\b(?:s\d{1,2}e\d{1,3}|s\d{1,2})\b/gi, " ");
  result = result.replace(/\b(?:ep|e)?\d{1,3}\b/gi, " ");
  result = result.replace(/\b(?:19|20)\d{2}\b/g, " ");
  return result;
}

function inferTitleFromName(rawName) {
  const withoutExtension = rawName.replace(path.extname(rawName), "");
  const dotted = withoutExtension.replace(/[._]+/g, " ");
  const withoutNoise = stripTechnicalNoise(removeBracketNoise(dotted));
  const cleaned = normalizeWhitespace(withoutNoise.replace(/[-–]+/g, " "));
  return cleaned || normalizeWhitespace(withoutExtension.replace(/[._]+/g, " "));
}

function detectYear(rawValues) {
  const matches = rawValues.flatMap((value) => [...value.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => Number(match[0])));
  if (matches.length === 0) {
    return null;
  }

  const counts = matches.reduce((map, year) => {
    map.set(year, (map.get(year) ?? 0) + 1);
    return map;
  }, new Map());

  return [...counts.entries()].sort((left, right) => right[1] - left[1] || right[0] - left[0])[0][0];
}

function parseSpecialTag(value) {
  const upper = value.toUpperCase();
  if (upper.includes("NCOP")) {
    return "NCOP";
  }

  if (upper.includes("NCED")) {
    return "NCED";
  }

  return null;
}

function parseSeasonEpisode(value) {
  const normalized = value.replace(path.extname(value), "");
  const seasonEpisodeMatch = normalized.match(/S(\d{1,2})E(\d{1,3})/i);
  if (seasonEpisodeMatch) {
    return {
      season: Number(seasonEpisodeMatch[1]),
      episode: Number(seasonEpisodeMatch[2]),
      confidence: "high",
    };
  }

  const episodeTitleMatch = normalized.match(/(?:^|[^\d])(\d{1,3})(?:[^\d]|$)/);
  if (/^\d{1,3}$/.test(normalized.trim()) && episodeTitleMatch) {
    return {
      season: null,
      episode: Number(episodeTitleMatch[1]),
      confidence: "medium",
    };
  }

  const titleWithIndexMatch = normalized.match(/(?:^|[^\d])(\d{2,3})(?:\s|$)/);
  if (titleWithIndexMatch && !normalized.match(/\b(?:19|20)\d{2}\b/)) {
    return {
      season: null,
      episode: Number(titleWithIndexMatch[1]),
      confidence: "low",
    };
  }

  return null;
}

function inferTypeFromDirectory(rawDirectoryName, files) {
  const normalizedName = rawDirectoryName.toLowerCase();
  const mainVideos = files.filter((file) => file.category === "video" && file.kind !== "special");
  const episodicVideos = mainVideos.filter((file) => file.clues.episode !== null);
  const hasAnimeExtras = files.some((file) => file.specialTag === "NCOP" || file.specialTag === "NCED");

  if (normalizedName.includes("动画") || normalizedName.includes("anime") || hasAnimeExtras) {
    return "anime";
  }

  if (normalizedName.includes("剧") || normalizedName.includes("season") || episodicVideos.length > 1) {
    return "series";
  }

  if (mainVideos.length === 1) {
    return "movie";
  }

  return "unknown";
}

function probeVideo(absolutePath) {
  if (!FFPROBE_AVAILABLE) {
    return {
      ok: false,
      error: "ffprobe unavailable",
    };
  }

  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-print_format", "json", absolutePath],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    return {
      ok: false,
      error: normalizeWhitespace(result.stderr || result.stdout || "ffprobe failed"),
    };
  }

  const parsed = JSON.parse(result.stdout || "{}");
  const videoStream = (parsed.streams || []).find((stream) => stream.codec_type === "video");
  const audioStreams = (parsed.streams || []).filter((stream) => stream.codec_type === "audio");
  const subtitleStreams = (parsed.streams || []).filter((stream) => stream.codec_type === "subtitle");

  return {
    ok: true,
    formatName: parsed.format?.format_name ?? null,
    durationSeconds: parsed.format?.duration ? Number(parsed.format.duration) : null,
    bitRate: parsed.format?.bit_rate ? Number(parsed.format.bit_rate) : null,
    sizeBytes: parsed.format?.size ? Number(parsed.format.size) : null,
    video: videoStream
      ? {
          codec: videoStream.codec_name ?? null,
          profile: videoStream.profile ?? null,
          width: videoStream.width ?? null,
          height: videoStream.height ?? null,
          pixelFormat: videoStream.pix_fmt ?? null,
        }
      : null,
    audio: audioStreams.map((stream) => ({
      codec: stream.codec_name ?? null,
      channels: stream.channels ?? null,
      language: stream.tags?.language ?? null,
    })),
    subtitleStreamCount: subtitleStreams.length,
  };
}

function buildFileRecord(rootDirectory, absolutePath) {
  const relativePath = toPosix(path.relative(rootDirectory, absolutePath));
  const baseName = path.basename(absolutePath);
  const category = classifyExtension(baseName);
  const specialTag = parseSpecialTag(baseName);
  const seasonEpisode = parseSeasonEpisode(baseName);
  const stats = statSync(absolutePath);

  const fileRecord = {
    relativePath,
    baseName,
    extension: path.extname(baseName).toLowerCase(),
    category,
    sizeBytes: stats.size,
    inferredTitle: inferTitleFromName(baseName),
    kind:
      category === "video"
        ? specialTag
          ? "special"
          : typeof seasonEpisode?.episode === "number"
            ? "episode"
            : "feature"
        : category,
    specialTag,
    clues: {
      season: seasonEpisode?.season ?? null,
      episode: seasonEpisode?.episode ?? null,
      confidence: seasonEpisode?.confidence ?? null,
    },
  };

  if (category === "video") {
    return {
      ...fileRecord,
      ffprobe: probeVideo(absolutePath),
    };
  }

  return fileRecord;
}

function buildEntry(rootDirectory, relativeDirectory, files) {
  const rawDirectoryName = path.basename(relativeDirectory);
  const directoryName = relativeDirectory === "." ? path.basename(rootDirectory) : rawDirectoryName;
  const inferredTitle = inferTitleFromName(directoryName);
  const year = detectYear([directoryName, ...files.map((file) => file.baseName)]);
  const inferredType = inferTypeFromDirectory(directoryName, files);
  const episodeFiles = files
    .filter((file) => file.category === "video" && file.kind === "episode")
    .sort(
      (left, right) =>
        (left.clues.season ?? 0) - (right.clues.season ?? 0) ||
        (left.clues.episode ?? 0) - (right.clues.episode ?? 0) ||
        left.relativePath.localeCompare(right.relativePath, "en"),
    );
  const specialFiles = files.filter((file) => file.category === "video" && file.kind === "special");
  const videoFiles = files.filter((file) => file.category === "video");
  const subtitleFiles = files.filter((file) => file.category === "subtitle");
  const imageFiles = files.filter((file) => file.category === "image");
  const sidecarFiles = files.filter((file) => file.category === "sidecar");

  return {
    relativeDirectory: toPosix(relativeDirectory),
    directoryName,
    inferredTitle,
    inferredYear: year,
    inferredType,
    counts: {
      totalFiles: files.length,
      videoFiles: videoFiles.length,
      subtitleFiles: subtitleFiles.length,
      imageFiles: imageFiles.length,
      sidecarFiles: sidecarFiles.length,
      episodeVideos: episodeFiles.length,
      specialVideos: specialFiles.length,
    },
    parserNotes: [
      year === null ? "year-not-found" : null,
      inferredType === "unknown" ? "type-uncertain" : null,
      episodeFiles.length === 0 && videoFiles.length > 1 ? "multi-video-no-episode-pattern" : null,
    ].filter(Boolean),
    episodes: episodeFiles.map((file) => ({
      relativePath: file.relativePath,
      season: file.clues.season,
      episode: file.clues.episode,
      titleCandidate: file.inferredTitle,
      ffprobe: file.ffprobe,
    })),
    specials: specialFiles.map((file) => ({
      relativePath: file.relativePath,
      tag: file.specialTag,
      titleCandidate: file.inferredTitle,
      ffprobe: file.ffprobe,
    })),
    files: {
      videos: videoFiles,
      subtitles: subtitleFiles,
      images: imageFiles,
      sidecars: sidecarFiles,
    },
  };
}

function buildManifest(sourceRoot) {
  const files = walkFiles(sourceRoot).sort((left, right) => left.localeCompare(right, "en"));
  const groups = new Map();

  for (const absolutePath of files) {
    const relativeDirectory = toPosix(path.relative(sourceRoot, path.dirname(absolutePath))) || ".";
    const record = buildFileRecord(sourceRoot, absolutePath);
    if (!groups.has(relativeDirectory)) {
      groups.set(relativeDirectory, []);
    }

    groups.get(relativeDirectory).push(record);
  }

  const entries = [...groups.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], "en"))
    .map(([relativeDirectory, records]) =>
      buildEntry(
        sourceRoot,
        relativeDirectory,
        records.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "en")),
      ),
    );

  return {
    manifestVersion: 1,
    sourceRoot: toPosix(path.relative(repoRoot, sourceRoot)),
    ffprobeAvailable: FFPROBE_AVAILABLE,
    entryCount: entries.length,
    entries,
  };
}

function main() {
  const sourceRoot = path.resolve(process.argv[2] ?? DEFAULT_SOURCE_ROOT);
  const outputPath = path.resolve(process.argv[3] ?? DEFAULT_OUTPUT_PATH);
  const outputDirectory = path.dirname(outputPath);

  mkdirSync(outputDirectory, { recursive: true });
  const manifest = buildManifest(sourceRoot);
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        sourceRoot: toPosix(path.relative(repoRoot, sourceRoot)),
        outputPath: toPosix(path.relative(repoRoot, outputPath)),
        entryCount: manifest.entryCount,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
