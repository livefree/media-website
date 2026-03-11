import "server-only";

import { z } from "zod";

import { defineProviderAdapter } from "./adapter";
import { BackendError } from "../errors";

import type {
  ProviderContentTypeHint,
  ProviderDetailResult,
  ProviderFetchByIdParams,
  ProviderFetchPageParams,
  ProviderPageResult,
  ProviderRawPayloadRecord,
  ProviderRequestMetadata,
  ProviderRuntimeContext,
  StagingFragmentKind,
  StagingProviderItem,
  StagingSourceFragment,
} from "./types";

const JSZYAPI_VOD_JSON_BASE_URL = "https://jszyapi.com/api.php/provide/vod/at/json";

const jszyapiListItemSchema = z
  .object({
    vod_id: z.union([z.string(), z.number()]),
    vod_name: z.string(),
    vod_sub: z.string().optional().default(""),
    vod_content: z.string().optional().default(""),
    vod_remarks: z.string().optional().default(""),
    vod_area: z.string().optional().default(""),
    vod_lang: z.string().optional().default(""),
    vod_year: z.union([z.string(), z.number()]).optional(),
    vod_time: z.string().optional().default(""),
    vod_class: z.string().optional().default(""),
    type_name: z.string().optional().default(""),
    vod_play_from: z.string().optional().default(""),
    vod_play_url: z.string().optional().default(""),
    vod_down_from: z.string().optional().default(""),
    vod_down_url: z.string().optional().default(""),
  })
  .passthrough();

const jszyapiPagePayloadSchema = z
  .object({
    code: z.union([z.string(), z.number()]).optional(),
    msg: z.string().optional(),
    page: z.union([z.string(), z.number()]).optional(),
    pagecount: z.union([z.string(), z.number()]).optional(),
    limit: z.union([z.string(), z.number()]).optional(),
    total: z.union([z.string(), z.number()]).optional(),
    list: z.array(jszyapiListItemSchema).default([]),
  })
  .passthrough();

type JszyapiListItem = z.infer<typeof jszyapiListItemSchema>;
type JszyapiPagePayload = z.infer<typeof jszyapiPagePayloadSchema>;

export interface JszyapiVodRequestParams {
  page?: number;
  providerItemId?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

function coercePositiveInteger(value?: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new BackendError("Provider page requests must use a positive integer page number.", {
      status: 400,
      code: "provider_invalid_page",
      details: {
        page: value,
      },
    });
  }

  return value;
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function parseReleaseYear(value?: string | number): number | undefined {
  const year = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return undefined;
  }

  return year;
}

function sanitizeSummary(value?: string): string | undefined {
  const normalized = normalizeText(
    value
      ?.replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&"),
  );

  return normalized;
}

function normalizeProviderTimestamp(value?: string): string | undefined {
  const normalized = normalizeText(value);

  if (!normalized) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return undefined;
  }

  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return new Date(parsed).toISOString();
}

function inferContentTypeHint(values: string[]): ProviderContentTypeHint | undefined {
  const haystack = values.join(" ").toLowerCase();

  if (!haystack) {
    return undefined;
  }

  if (/(动漫|動畫|anime|番剧|番劇)/i.test(haystack)) {
    return "anime";
  }

  if (/(综艺|綜藝|variety)/i.test(haystack)) {
    return "variety";
  }

  if (/(纪录|紀錄|documentary)/i.test(haystack)) {
    return "documentary";
  }

  if (/(特别篇|特別篇|\bsp\b|special)/i.test(haystack)) {
    return "special";
  }

  if (/(电视剧|電視劇|剧集|劇集|连续剧|連續劇|短剧|短劇|series|tv)/i.test(haystack)) {
    return "series";
  }

  if (/(电影|電影|movie|动作|動作|喜剧|喜劇|剧情|劇情|爱情|愛情|科幻|战争|戰爭|悬疑|懸疑|恐怖|犯罪)/i.test(haystack)) {
    return "movie";
  }

  return "unknown";
}

function splitProviderGroups(value?: string): string[] {
  return String(value ?? "")
    .split("$$$")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseSourceFragments(
  kind: StagingFragmentKind,
  lineKeysValue?: string,
  linePayloadsValue?: string,
): { fragments: StagingSourceFragment[]; warnings: string[] } {
  const lineKeys = splitProviderGroups(lineKeysValue);
  const linePayloads = splitProviderGroups(linePayloadsValue);
  const warnings: string[] = [];

  if (lineKeys.length !== 0 && linePayloads.length !== 0 && lineKeys.length !== linePayloads.length) {
    warnings.push(`Provider ${kind} line metadata did not match URL groups exactly.`);
  }

  if (lineKeys.length > 0 && linePayloads.length === 0) {
    warnings.push(`Provider ${kind} metadata was present without URL payloads.`);
    return {
      fragments: [],
      warnings,
    };
  }

  const fragments: StagingSourceFragment[] = [];

  for (let lineIndex = 0; lineIndex < linePayloads.length; lineIndex += 1) {
    const linePayload = linePayloads[lineIndex];
    const lineKey = lineKeys[lineIndex] ?? `${kind}-${lineIndex + 1}`;

    for (const entry of linePayload.split("#").map((value) => value.trim()).filter(Boolean)) {
      const separatorIndex = entry.indexOf("$");
      const rawLabel = separatorIndex === -1 ? "" : entry.slice(0, separatorIndex);
      const rawUrl = separatorIndex === -1 ? entry : entry.slice(separatorIndex + 1);
      const label = normalizeText(rawLabel) ?? lineKey;
      const url = rawUrl.trim();

      if (!url) {
        warnings.push(`Provider ${kind} entry '${label}' did not include a usable URL.`);
        continue;
      }

      fragments.push({
        kind,
        providerLineKey: lineKey,
        label,
        rawEpisodeLabel: normalizeText(rawLabel),
        urls: [url],
      });
    }
  }

  return {
    fragments,
    warnings,
  };
}

function buildWarnings(item: JszyapiListItem, sourceFragments: StagingSourceFragment[]): string[] {
  const warnings: string[] = [];

  if (normalizeText(item.vod_play_from) && sourceFragments.every((fragment) => fragment.kind !== "stream")) {
    warnings.push("Provider page payload did not expose playable stream URLs.");
  }

  if (normalizeText(item.vod_down_from) && sourceFragments.every((fragment) => fragment.kind !== "download")) {
    warnings.push("Provider page payload did not expose download URLs.");
  }

  return warnings;
}

function parseItem(item: JszyapiListItem): StagingProviderItem {
  const streamSources = parseSourceFragments("stream", item.vod_play_from, item.vod_play_url);
  const downloadSources = parseSourceFragments("download", item.vod_down_from, item.vod_down_url);
  const sourceFragments = [...streamSources.fragments, ...downloadSources.fragments];
  const warnings = [
    ...streamSources.warnings,
    ...downloadSources.warnings,
    ...buildWarnings(item, sourceFragments),
  ];

  return {
    providerKey: "jszyapi_vod_json",
    providerItemId: String(item.vod_id),
    title: item.vod_name.trim(),
    summary: sanitizeSummary(item.vod_content),
    releaseYear: parseReleaseYear(item.vod_year),
    region: normalizeText(item.vod_area),
    language: normalizeText(item.vod_lang),
    rawCategory: normalizeText(item.type_name) ?? normalizeText(item.vod_class),
    rawEpisodeText: normalizeText(item.vod_remarks),
    typeHint: inferContentTypeHint([item.type_name, item.vod_class]),
    providerUpdatedAt: normalizeProviderTimestamp(item.vod_time),
    sourceFragments,
    warnings: [...new Set(warnings)],
  };
}

function parseSuccessCode(payload: JszyapiPagePayload): boolean {
  if (payload.code === undefined) {
    return true;
  }

  return String(payload.code) === "1";
}

function coercePageCount(payload: JszyapiPagePayload): number | undefined {
  if (payload.pagecount === undefined) {
    return undefined;
  }

  const value = Number.parseInt(String(payload.pagecount), 10);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function buildRequestMetadata(url: string, params: JszyapiVodRequestParams): ProviderRequestMetadata {
  return {
    requestUrl: url,
    method: "GET",
    page: params.page ?? 1,
  };
}

function createRawPayloadRecord(
  fetchedAt: string,
  request: ProviderRequestMetadata,
  scope: ProviderRawPayloadRecord["scope"],
  payload: JszyapiPagePayload,
  providerItemId?: string,
): ProviderRawPayloadRecord {
  return {
    providerKey: "jszyapi_vod_json",
    providerItemId,
    payloadFormat: "json",
    scope,
    body: payload as Record<string, unknown>,
    fetchedAt,
    request,
  };
}

function resolveHoursSince(updatedAfter: string, now: Date): number {
  const timestamp = Date.parse(updatedAfter);

  if (Number.isNaN(timestamp)) {
    throw new BackendError("updatedAfter must be a valid ISO timestamp for jszyapi page fetches.", {
      status: 400,
      code: "provider_invalid_updated_after",
      details: {
        updatedAfter,
      },
    });
  }

  const diffMs = now.getTime() - timestamp;

  if (diffMs < 0) {
    throw new BackendError("updatedAfter cannot be in the future for jszyapi page fetches.", {
      status: 400,
      code: "provider_invalid_updated_after",
      details: {
        updatedAfter,
      },
    });
  }

  return Math.max(1, Math.ceil(diffMs / 3_600_000));
}

export function buildJszyapiVodUrl(params: JszyapiVodRequestParams, now: Date = new Date()): string {
  const page = coercePositiveInteger(params.page) ?? 1;

  if (params.updatedBefore) {
    throw new BackendError("jszyapi base VOD ingestion does not support updatedBefore filtering.", {
      status: 400,
      code: "provider_updated_before_not_supported",
      details: {
        updatedBefore: params.updatedBefore,
      },
    });
  }

  const url = new URL(JSZYAPI_VOD_JSON_BASE_URL);
  url.searchParams.set("ac", "videolist");
  url.searchParams.set("pg", String(page));

  if (params.providerItemId) {
    url.searchParams.set("ids", params.providerItemId);
  }

  if (params.updatedAfter) {
    url.searchParams.set("h", String(resolveHoursSince(params.updatedAfter, now)));
  }

  return url.toString();
}

function parsePageResult(
  payload: unknown,
  request: ProviderRequestMetadata,
  fetchedAt: string,
  page: number,
): ProviderPageResult {
  const parsed = jszyapiPagePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    throw new BackendError("jszyapi page payload did not match the expected JSON structure.", {
      status: 502,
      code: "provider_payload_invalid",
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  const body = parsed.data;

  if (!parseSuccessCode(body)) {
    throw new BackendError("jszyapi returned a non-success response for the page request.", {
      status: 502,
      code: "provider_payload_invalid",
      details: {
        code: body.code,
        message: body.msg,
      },
    });
  }

  const pageCount = coercePageCount(body);

  return {
    providerKey: "jszyapi_vod_json",
    fetchedAt,
    request,
    nextCheckpoint: pageCount && page < pageCount ? { page: page + 1 } : undefined,
    items: body.list.map((item) => parseItem(item)),
    rawPayloads: [createRawPayloadRecord(fetchedAt, request, "page", body)],
  };
}

function parseDetailResult(
  payload: unknown,
  request: ProviderRequestMetadata,
  fetchedAt: string,
  providerItemId: string,
): ProviderDetailResult {
  const parsed = parsePageResult(payload, request, fetchedAt, 1);
  const item = parsed.items.find((candidate) => candidate.providerItemId === providerItemId) ?? parsed.items[0];

  if (!item) {
    throw new BackendError("jszyapi detail request returned no items.", {
      status: 404,
      code: "provider_item_not_found",
      details: {
        providerItemId,
      },
    });
  }

  return {
    providerKey: parsed.providerKey,
    fetchedAt: parsed.fetchedAt,
    request: parsed.request,
    item,
    rawPayloads: [createRawPayloadRecord(fetchedAt, request, "detail", parsed.rawPayloads[0].body as JszyapiPagePayload, providerItemId)],
  };
}

async function fetchJszyapiPayload(
  runtime: ProviderRuntimeContext,
  params: JszyapiVodRequestParams,
): Promise<{ url: string; payload: unknown }> {
  const url = buildJszyapiVodUrl(params, runtime.now());
  const payload = await runtime.http.fetchJson<unknown>(url);

  return {
    url,
    payload,
  };
}

export const jszyapiVodJsonProviderAdapter = defineProviderAdapter({
  metadata: {
    key: "jszyapi_vod_json",
    displayName: "jszyapi Base VOD JSON",
    capabilities: ["catalog", "playback", "download"],
    baseUrl: JSZYAPI_VOD_JSON_BASE_URL,
    enabledByDefault: true,
  },
  async fetchPage(params: ProviderFetchPageParams, context) {
    const page = coercePositiveInteger(params.page) ?? 1;
    const fetchedAt = context.now().toISOString();
    const { url, payload } = await fetchJszyapiPayload(context, {
      page,
      updatedAfter: params.updatedAfter,
      updatedBefore: params.updatedBefore,
    });

    return parsePageResult(payload, buildRequestMetadata(url, { page }), fetchedAt, page);
  },
  async fetchById(params: ProviderFetchByIdParams, context) {
    const fetchedAt = context.now().toISOString();
    const { url, payload } = await fetchJszyapiPayload(context, {
      providerItemId: params.providerItemId,
    });

    return parseDetailResult(
      payload,
      {
        requestUrl: url,
        method: "GET",
      },
      fetchedAt,
      params.providerItemId,
    );
  },
});
