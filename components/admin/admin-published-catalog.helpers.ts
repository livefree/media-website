import type { AdminPublishedCatalogQuery, AdminPublishedCatalogSort } from "../../lib/server/admin";
import type { PublishedMediaStatus, PublishedMediaType } from "../../lib/server/catalog";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export interface AdminPublishedCatalogSearchState {
  q: string;
  type: string;
  status: string;
  year: string;
  region: string;
  sort: AdminPublishedCatalogSort;
  page: number;
}

const catalogTypeOptions = ["all", "movie", "series", "anime", "variety", "documentary", "special"] as const satisfies Array<
  PublishedMediaType | "all"
>;
const catalogStatusOptions = ["draft", "upcoming", "ongoing", "completed", "hiatus", "archived"] as const satisfies PublishedMediaStatus[];
const catalogSortOptions = ["published_at", "updated_at", "title", "release_year"] as const satisfies AdminPublishedCatalogSort[];

function getStringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0].trim() : "";
  }

  return "";
}

function getPositiveInteger(value: string | string[] | undefined): number | undefined {
  const raw = getStringParam(value);

  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseAdminPublishedCatalogSearch(searchParams?: RouteSearchParams): {
  query: AdminPublishedCatalogQuery;
  searchState: AdminPublishedCatalogSearchState;
  returnTo: string;
} {
  const q = getStringParam(searchParams?.q);
  const type = getStringParam(searchParams?.type);
  const status = getStringParam(searchParams?.status);
  const year = getStringParam(searchParams?.year);
  const region = getStringParam(searchParams?.region);
  const sort = getStringParam(searchParams?.sort);
  const page = getPositiveInteger(searchParams?.page) ?? 1;

  const query: AdminPublishedCatalogQuery = {
    page,
  };

  if (q) {
    query.q = q;
  }

  if (catalogTypeOptions.includes(type as (typeof catalogTypeOptions)[number])) {
    query.type = type as PublishedMediaType | "all";
  }

  if (catalogStatusOptions.includes(status as PublishedMediaStatus)) {
    query.status = status as PublishedMediaStatus;
  }

  const parsedYear = Number.parseInt(year, 10);
  if (Number.isInteger(parsedYear) && parsedYear >= 1800 && parsedYear <= 3000) {
    query.year = parsedYear;
  }

  if (region) {
    query.region = region;
  }

  if (catalogSortOptions.includes(sort as AdminPublishedCatalogSort)) {
    query.sort = sort as AdminPublishedCatalogSort;
  }

  const searchState: AdminPublishedCatalogSearchState = {
    q,
    type: query.type ?? "",
    status: query.status ?? "",
    year: query.year ? String(query.year) : "",
    region,
    sort: query.sort ?? "published_at",
    page,
  };

  return {
    query,
    searchState,
    returnTo: buildAdminCatalogPath(searchState),
  };
}

export function buildAdminCatalogPath(state: Partial<AdminPublishedCatalogSearchState>): string {
  const params = new URLSearchParams();

  if (state.q) {
    params.set("q", state.q);
  }

  if (state.type && state.type !== "all") {
    params.set("type", state.type);
  }

  if (state.status) {
    params.set("status", state.status);
  }

  if (state.year) {
    params.set("year", state.year);
  }

  if (state.region) {
    params.set("region", state.region);
  }

  if (state.sort && state.sort !== "published_at") {
    params.set("sort", state.sort);
  }

  if (state.page && state.page > 1) {
    params.set("page", String(state.page));
  }

  const serialized = params.toString();
  return serialized ? `/admin/catalog?${serialized}` : "/admin/catalog";
}

export function normalizeAdminCatalogReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/admin/catalog")) {
    return "/admin/catalog";
  }

  return returnTo;
}

export function formatAdminCatalogLabel(value: string) {
  return value.replaceAll("_", " ");
}
