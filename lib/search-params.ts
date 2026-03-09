import type { CatalogScope, CatalogSortValue } from "../types/media";

type SearchParamValue = string | string[] | undefined;

export type SearchRouteParams = {
  q: string;
  type: CatalogScope;
  sort: CatalogSortValue;
  genre: string;
  region: string;
  year: string;
  page: number;
  pageSize: number;
};

const validTypes: CatalogScope[] = ["all", "movie", "series", "anime"];
const validSorts: CatalogSortValue[] = ["latest", "popular", "rating"];

function getSingleValue(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseSearchParams(
  searchParams: Record<string, SearchParamValue> | undefined,
  pageSize = 18,
): SearchRouteParams {
  const q = getSingleValue(searchParams?.q).trim();
  const typeValue = getSingleValue(searchParams?.type);
  const sortValue = getSingleValue(searchParams?.sort);

  return {
    q,
    type: validTypes.includes(typeValue as CatalogScope) ? (typeValue as CatalogScope) : "all",
    sort: validSorts.includes(sortValue as CatalogSortValue) ? (sortValue as CatalogSortValue) : "latest",
    genre: getSingleValue(searchParams?.genre).trim(),
    region: getSingleValue(searchParams?.region).trim(),
    year: getSingleValue(searchParams?.year).trim(),
    page: parsePositiveInt(getSingleValue(searchParams?.page), 1),
    pageSize,
  };
}

export function buildSearchHref(
  current: SearchRouteParams,
  overrides: Partial<SearchRouteParams> = {},
  pathname = "/search",
): string {
  const next = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (next.q) {
    params.set("q", next.q);
  }

  if (next.type !== "all") {
    params.set("type", next.type);
  }

  if (next.sort !== "latest") {
    params.set("sort", next.sort);
  }

  if (next.genre) {
    params.set("genre", next.genre);
  }

  if (next.region) {
    params.set("region", next.region);
  }

  if (next.year) {
    params.set("year", next.year);
  }

  if (next.page > 1) {
    params.set("page", String(next.page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getHiddenSearchFields(
  params: SearchRouteParams,
  omittedKeys: Array<keyof SearchRouteParams> = [],
): Array<{ name: string; value: string }> {
  const omitted = new Set<keyof SearchRouteParams>(["pageSize", ...omittedKeys]);
  const hiddenFields: Array<{ name: string; value: string }> = [];

  const entries: Array<[keyof SearchRouteParams, string]> = [
    ["q", params.q],
    ["type", params.type === "all" ? "" : params.type],
    ["sort", params.sort === "latest" ? "" : params.sort],
    ["genre", params.genre],
    ["region", params.region],
    ["year", params.year],
    ["page", params.page > 1 ? String(params.page) : ""],
  ];

  for (const [name, value] of entries) {
    if (!omitted.has(name) && value) {
      hiddenFields.push({ name, value });
    }
  }

  return hiddenFields;
}
