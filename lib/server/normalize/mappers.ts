import "server-only";

import type {
  NormalizedAliasValue,
  NormalizedMediaType,
  NormalizedSeasonEpisodeHints,
  NormalizedSourceSummary,
  NormalizedTextValue,
} from "./types";
import type { ProviderContentTypeHint, StagingSourceFragment } from "../provider";

function normalizeComparableText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/[·•|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactDisplayText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function normalizeTextValue(value: string): NormalizedTextValue {
  return {
    display: compactDisplayText(value),
    comparable: normalizeComparableText(value),
  };
}

function addAliasValue(aliases: NormalizedAliasValue[], value: string | null | undefined, source: NormalizedAliasValue["source"]) {
  if (!value) {
    return;
  }

  const normalized = normalizeTextValue(value);

  if (!normalized.display || aliases.some((alias) => alias.comparable === normalized.comparable)) {
    return;
  }

  aliases.push({
    ...normalized,
    source,
  });
}

export function extractAliasValues(title: string, originalTitle?: string | null): NormalizedAliasValue[] {
  const aliases: NormalizedAliasValue[] = [];

  addAliasValue(aliases, originalTitle, "original_title");

  for (const part of title.split(/[/|]|(?:\s+-\s+)/)) {
    addAliasValue(aliases, part, "title");
  }

  if (originalTitle) {
    for (const part of originalTitle.split(/[/|]|(?:\s+-\s+)/)) {
      addAliasValue(aliases, part, "original_title");
    }
  }

  return aliases;
}

export function mapNormalizedMediaType(typeHint: ProviderContentTypeHint, rawCategory?: string | null): NormalizedMediaType {
  if (typeHint !== "unknown") {
    return typeHint;
  }

  const category = normalizeComparableText(rawCategory ?? "");

  if (!category) {
    return "unknown";
  }

  if (/(anime|animation|动漫|番剧)/.test(category)) {
    return "anime";
  }

  if (/(series|tv|drama|剧|连续)/.test(category)) {
    return "series";
  }

  if (/(variety|综艺)/.test(category)) {
    return "variety";
  }

  if (/(documentary|纪录)/.test(category)) {
    return "documentary";
  }

  if (/(movie|film|电影)/.test(category)) {
    return "movie";
  }

  if (/(special|特别篇|sp)/.test(category)) {
    return "special";
  }

  return "unknown";
}

export function normalizeRegion(value?: string | null): string | undefined {
  const comparable = normalizeComparableText(value ?? "");

  if (!comparable) {
    return undefined;
  }

  const map: Record<string, string> = {
    cn: "CN",
    china: "CN",
    "中国": "CN",
    "中国大陆": "CN",
    mainland: "CN",
    hk: "HK",
    "hong kong": "HK",
    "香港": "HK",
    tw: "TW",
    taiwan: "TW",
    "台湾": "TW",
    jp: "JP",
    japan: "JP",
    "日本": "JP",
    kr: "KR",
    korea: "KR",
    "韩国": "KR",
    us: "US",
    usa: "US",
    "united states": "US",
    "美国": "US",
    uk: "GB",
    britain: "GB",
    england: "GB",
    "英国": "GB",
  };

  return map[comparable] ?? compactDisplayText(value ?? "");
}

export function normalizeLanguage(value?: string | null): string | undefined {
  const comparable = normalizeComparableText(value ?? "");

  if (!comparable) {
    return undefined;
  }

  const map: Record<string, string> = {
    chinese: "zh",
    "中文": "zh",
    "汉语": "zh",
    mandarin: "zh",
    english: "en",
    "英文": "en",
    japanese: "ja",
    "日语": "ja",
    korean: "ko",
    "韩语": "ko",
    cantonese: "yue",
    "粤语": "yue",
  };

  return map[comparable] ?? compactDisplayText(value ?? "");
}

function collectNumberHints(text: string): number[] {
  return Array.from(text.matchAll(/\d+/g)).map((match) => Number(match[0])).filter((value) => Number.isFinite(value));
}

export function normalizeSeasonEpisodeHints(
  rawEpisodeText?: string | null,
  sourceFragments: StagingSourceFragment[] = [],
): NormalizedSeasonEpisodeHints {
  const notes: string[] = [];
  const seasonNumbers = new Set<number>();
  const episodeNumbers = new Set<number>();
  let totalEpisodeCount: number | undefined;

  const textInputs = [
    rawEpisodeText,
    ...sourceFragments.map((fragment) => fragment.rawEpisodeLabel),
    ...sourceFragments.map((fragment) => fragment.label),
  ]
    .filter(Boolean)
    .map((value) => compactDisplayText(value as string));

  for (const input of textInputs) {
    const comparable = normalizeComparableText(input);

    for (const match of comparable.matchAll(/s(\d{1,2})e(\d{1,3})/g)) {
      seasonNumbers.add(Number(match[1]));
      episodeNumbers.add(Number(match[2]));
      notes.push(`Parsed season/episode from '${input}'.`);
    }

    for (const match of comparable.matchAll(/第\s*(\d+)\s*季/g)) {
      seasonNumbers.add(Number(match[1]));
      notes.push(`Parsed season number from '${input}'.`);
    }

    for (const match of comparable.matchAll(/第\s*(\d+)\s*[集话話]/g)) {
      episodeNumbers.add(Number(match[1]));
      notes.push(`Parsed episode number from '${input}'.`);
    }

    const fullSeriesMatch = comparable.match(/全\s*(\d+)\s*[集话話]/);
    if (fullSeriesMatch) {
      totalEpisodeCount = Number(fullSeriesMatch[1]);
      notes.push(`Parsed total episode count from '${input}'.`);
    }

    const fallbacks = collectNumberHints(comparable);
    if (!totalEpisodeCount && /集|话|episode|ep/.test(comparable) && fallbacks.length === 1) {
      totalEpisodeCount = fallbacks[0];
    }
  }

  const episodeList = [...episodeNumbers].sort((a, b) => a - b);

  return {
    isEpisodic: textInputs.length > 0 || sourceFragments.some((fragment) => fragment.kind === "stream" && Boolean(fragment.rawEpisodeLabel)),
    seasonNumbers: [...seasonNumbers].sort((a, b) => a - b),
    episodeNumbers: episodeList,
    totalEpisodeCount,
    latestEpisodeNumber: episodeList.length > 0 ? episodeList[episodeList.length - 1] : totalEpisodeCount,
    notes,
  };
}

export function summarizeSourceFragments(sourceFragments: StagingSourceFragment[]): NormalizedSourceSummary {
  const languages = new Set<string>();
  const qualities = new Set<string>();
  const providerLineKeys = new Set<string>();

  for (const fragment of sourceFragments) {
    if (fragment.language) {
      languages.add(normalizeLanguage(fragment.language) ?? compactDisplayText(fragment.language));
    }
    if (fragment.quality) {
      qualities.add(compactDisplayText(fragment.quality));
    }
    if (fragment.providerLineKey) {
      providerLineKeys.add(compactDisplayText(fragment.providerLineKey));
    }
  }

  return {
    fragmentCount: sourceFragments.length,
    streamCount: sourceFragments.filter((fragment) => fragment.kind === "stream").length,
    downloadCount: sourceFragments.filter((fragment) => fragment.kind === "download").length,
    subtitleCount: sourceFragments.filter((fragment) => fragment.kind === "subtitle").length,
    languages: [...languages],
    qualities: [...qualities],
    providerLineKeys: [...providerLineKeys],
  };
}
