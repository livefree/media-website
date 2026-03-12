import type {
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogQuery,
  AdminPublishedCatalogSort,
  AdminPublishedResourceRecord,
} from "../../lib/server/admin";
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
  flashMessage?: string;
}

export interface AdminPublishedCatalogDetailSearchState {
  backHref: string;
  flashMessage?: string;
}

export interface PublishedSourceReplacementOption {
  value: string;
  label: string;
}

export interface PublishedSourceReorderEntryPoint {
  mediaPublicId: string;
  resourceId: string;
  returnTo: string;
  defaultPriority: number;
  defaultMirrorOrder: number;
  defaultPreferred: boolean;
  submitLabel: string;
}

export interface PublishedSourceReplaceEntryPoint {
  mediaPublicId: string;
  sourcePublicId: string;
  returnTo: string;
  replacementOptions: PublishedSourceReplacementOption[];
  submitLabel: string;
  disabled: boolean;
}

export interface PublishedSourceLifecycleEntryPoint {
  resourceId: string;
  resourcePublicId: string;
  resourceLabel: string;
  reorder: PublishedSourceReorderEntryPoint;
  replace: PublishedSourceReplaceEntryPoint;
}

export interface PublishedCatalogUnpublishEntryPoint {
  mediaPublicId: string;
  returnTo: string;
  submitLabel: string;
  notesPlaceholder: string;
}

export interface PublishedCatalogLifecycleMutationViewModel {
  unpublish: PublishedCatalogUnpublishEntryPoint;
  sources: PublishedSourceLifecycleEntryPoint[];
}

export interface AdminPublishedCatalogDetailFeedback {
  flashMessage?: string;
  errorMessage?: string;
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
  const flashMessage = getStringParam(searchParams?.flash) || undefined;

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
    flashMessage,
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

export function parseAdminPublishedCatalogDetailSearch(searchParams?: RouteSearchParams): AdminPublishedCatalogDetailSearchState {
  return {
    backHref: normalizeAdminCatalogReturnTo(getStringParam(searchParams?.from)),
    flashMessage: getStringParam(searchParams?.flash) || undefined,
  };
}

export function buildAdminCatalogDetailPath(
  publicId: string,
  options?: {
    returnTo?: string;
    flashMessage?: string;
  },
) {
  const params = new URLSearchParams();
  const returnTo = normalizeAdminCatalogReturnTo(options?.returnTo);

  if (returnTo !== "/admin/catalog") {
    params.set("from", returnTo);
  }

  if (options?.flashMessage) {
    params.set("flash", options.flashMessage);
  }

  const serialized = params.toString();
  return serialized ? `/admin/catalog/${publicId}?${serialized}` : `/admin/catalog/${publicId}`;
}

export function buildPublishedSourceReplacementOptions(
  resources: AdminPublishedResourceRecord[],
  currentPublicId: string,
): PublishedSourceReplacementOption[] {
  return resources
    .filter((resource) => resource.publicId !== currentPublicId)
    .map((resource) => ({
      value: resource.publicId,
      label: [
        resource.label,
        resource.providerDisplayName ?? resource.provider,
        resource.quality ?? resource.format,
      ]
        .filter(Boolean)
        .join(" · "),
    }));
}

export function buildPublishedCatalogLifecycleMutationViewModel(
  detail: Pick<AdminPublishedCatalogDetailRecord, "media" | "streamResources">,
  backHref: string,
): PublishedCatalogLifecycleMutationViewModel {
  return {
    unpublish: {
      mediaPublicId: detail.media.publicId,
      returnTo: backHref,
      submitLabel: "Unpublish record",
      notesPlaceholder: "Withdraw until source integrity review completes.",
    },
    sources: detail.streamResources.map((resource) => {
      const replacementOptions = buildPublishedSourceReplacementOptions(detail.streamResources, resource.publicId);

      return {
        resourceId: resource.id,
        resourcePublicId: resource.publicId,
        resourceLabel: resource.label,
        reorder: {
          mediaPublicId: detail.media.publicId,
          resourceId: resource.id,
          returnTo: backHref,
          defaultPriority: resource.priority,
          defaultMirrorOrder: resource.mirrorOrder,
          defaultPreferred: resource.isPreferred,
          submitLabel: "Save ordering",
        },
        replace: {
          mediaPublicId: detail.media.publicId,
          sourcePublicId: resource.publicId,
          returnTo: backHref,
          replacementOptions,
          submitLabel: "Replace source",
          disabled: replacementOptions.length === 0,
        },
      };
    }),
  };
}

export function buildAdminPublishedCatalogDetailFeedback(input: {
  publicId?: string;
  detail?: AdminPublishedCatalogDetailRecord;
  flashMessage?: string;
  errorMessage?: string;
}): AdminPublishedCatalogDetailFeedback {
  return {
    flashMessage: input.flashMessage,
    errorMessage: input.detail ? input.errorMessage : input.errorMessage ?? `Published catalog record '${input.publicId ?? "unknown"}' is unavailable.`,
  };
}

export function formatAdminCatalogLabel(value: string) {
  return value.replaceAll("_", " ");
}
