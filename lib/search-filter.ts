import "server-only";

import { buildBrowseHref, getBrowsePathForType, parseSearchParams, type SearchRouteParams } from "./search-params";
import { getPublishedCatalogFeaturedListDiscovery, getPublishedCatalogPage } from "./server/catalog/service";
import { isBackendError } from "./server/errors";

import type { PublishedCatalogCard, PublishedFacetOption } from "./server/catalog/types";
import type { BrowseMediaCard, CatalogScope, MediaStatus, MediaType, PublicMediaList, SearchSuggestion } from "../types/media";

const SEARCH_PAGE_SIZE = 18;
const HOT_SEARCH_LIMIT = 5;

type SearchOption = {
  value: string;
  label: string;
};

type SearchFilterGroup = {
  label: string;
  name: string;
  value: string;
  options: SearchOption[];
};

const sortOptions: SearchOption[] = [
  { value: "latest", label: "Latest updates" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
];

const typeOptions: SearchOption[] = [
  { value: "all", label: "All categories" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
];

const statusLabels: Record<MediaStatus, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  archived: "Archived",
};

function mapPublishedType(type: PublishedCatalogCard["type"]): MediaType {
  if (type === "anime") {
    return "anime";
  }

  if (type === "series" || type === "variety") {
    return "series";
  }

  return "movie";
}

function mapPublishedStatus(status: PublishedCatalogCard["status"]): MediaStatus {
  if (status === "upcoming") {
    return "upcoming";
  }

  if (status === "ongoing" || status === "hiatus") {
    return "ongoing";
  }

  if (status === "archived") {
    return "archived";
  }

  if (status === "draft") {
    return "draft";
  }

  return "completed";
}

function buildCardBadge(card: PublishedCatalogCard): BrowseMediaCard["badge"] {
  if (card.status === "ongoing" || card.status === "hiatus") {
    return { label: "Updated", tone: "updated" };
  }

  if (card.year >= new Date().getFullYear()) {
    return { label: "New", tone: "new" };
  }

  if ((card.ratingValue ?? 0) >= 8) {
    return { label: "Hot", tone: "hot" };
  }

  return { label: "Library", tone: "classic" };
}

function mapPublishedCard(card: PublishedCatalogCard): BrowseMediaCard {
  const type = mapPublishedType(card.type);
  const status = mapPublishedStatus(card.status);

  return {
    id: card.id,
    publicId: card.publicId,
    slug: card.slug,
    href: card.canonicalWatchHref,
    canonicalWatchHref: card.canonicalWatchHref,
    compatibilityHref: card.compatibilityHref,
    watchContext: {
      mediaPublicId: card.publicId,
    },
    title: card.title,
    originalTitle: card.originalTitle ?? undefined,
    year: card.year,
    yearLabel: card.endYear ? `${card.year}-${card.endYear}` : String(card.year),
    type,
    typeLabel: type === "movie" ? "Movie" : type === "series" ? "Series" : "Anime",
    posterUrl: card.posterUrl ?? "",
    ratingValue: card.ratingValue ?? 0,
    ratingLabel: card.ratingValue ? `${card.ratingValue.toFixed(1)} rating` : "Unrated",
    badge: buildCardBadge(card),
    status,
    statusLabel: statusLabels[status],
    genres: card.genreLabels,
    availabilityLabel: card.availabilityLabel,
    episodeCountLabel: card.episodeCountLabel,
    stats: [],
  };
}

function mapSearchSuggestion(card: PublishedCatalogCard): SearchSuggestion {
  return {
    slug: card.slug,
    href: card.canonicalWatchHref,
    publicId: card.publicId,
    canonicalWatchHref: card.canonicalWatchHref,
    compatibilityHref: card.compatibilityHref,
    watchContext: {
      mediaPublicId: card.publicId,
    },
    title: card.title,
    type: mapPublishedType(card.type),
    year: card.year,
    rating: card.ratingValue ?? undefined,
  };
}

function buildFacetOptions(
  facets: PublishedFacetOption[],
  currentValue: string,
  fallbackLabel: string,
): SearchOption[] {
  const options = [{ value: "", label: fallbackLabel }, ...facets.map((facet) => ({ value: facet.value, label: facet.label }))];

  if (!currentValue || options.some((option) => option.value === currentValue)) {
    return options;
  }

  return [{ value: currentValue, label: currentValue }, ...options];
}

async function queryPublishedCatalogSafe(input: {
  q?: string;
  scope?: CatalogScope;
  genre?: string;
  year?: number;
  region?: string;
  sort?: "latest" | "popular" | "rating";
  page?: number;
  pageSize?: number;
}) {
  try {
    return await getPublishedCatalogPage(input);
  } catch (error) {
    if (isBackendError(error) && error.code === "database_not_configured") {
      return {
        scope: input.scope ?? "all",
        q: input.q?.trim() ?? "",
        page: Math.max(1, input.page ?? 1),
        pageSize: Math.max(1, input.pageSize ?? SEARCH_PAGE_SIZE),
        totalItems: 0,
        totalPages: 1,
        items: [],
        facets: {
          genres: [],
          years: [],
          regions: [],
        },
      };
    }

    throw error;
  }
}

async function getHotSearches(scope: CatalogScope): Promise<SearchSuggestion[]> {
  const hotSearchPage = await queryPublishedCatalogSafe({
    scope,
    sort: "popular",
    page: 1,
    pageSize: HOT_SEARCH_LIMIT,
  });

  return hotSearchPage.items.map(mapSearchSuggestion);
}

function mapPublishedFeaturedList(list: {
  id: string;
  publicId: string;
  title: string;
  description?: string | null;
  canonicalListHref: string;
  shareHref: string;
  shareTitle: string;
  shareDescription: string;
  itemCount: number;
  itemCountLabel: string;
  coverPosterUrl?: string | null;
  coverBackdropUrl?: string | null;
}): PublicMediaList {
  return {
    id: list.id,
    publicId: list.publicId,
    slug: list.publicId,
    title: list.title,
    description: list.description ?? "",
    visibility: "public",
    canonicalListHref: list.canonicalListHref,
    shareHref: list.shareHref,
    shareTitle: list.shareTitle,
    shareDescription: list.shareDescription,
    visibilityLabel: "Public",
    itemCount: list.itemCount,
    itemCountLabel: list.itemCountLabel,
    coverPosterUrl: list.coverPosterUrl ?? undefined,
    coverBackdropUrl: list.coverBackdropUrl ?? undefined,
  };
}

async function getFeaturedListsSafe(limit = 3): Promise<PublicMediaList[]> {
  try {
    const discovery = await getPublishedCatalogFeaturedListDiscovery(limit);
    return discovery.items.map(mapPublishedFeaturedList);
  } catch (error) {
    if (isBackendError(error) && error.code === "database_not_configured") {
      return [];
    }

    throw error;
  }
}

function buildActiveScope(type: CatalogScope): CatalogScope {
  return type === "all" ? "all" : type;
}

export async function buildSearchPageData(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const parsedParams = parseSearchParams(searchParams, SEARCH_PAGE_SIZE);
  const requestedPage = await queryPublishedCatalogSafe({
    q: parsedParams.q,
    scope: parsedParams.type,
    genre: parsedParams.genre || undefined,
    region: parsedParams.region || undefined,
    year: parsedParams.year ? Number.parseInt(parsedParams.year, 10) : undefined,
    sort: parsedParams.sort,
    page: parsedParams.page,
    pageSize: parsedParams.pageSize,
  });
  const hotSearches = await getHotSearches(parsedParams.type);
  const currentPage = Math.min(parsedParams.page, requestedPage.totalPages);
  const pageRecord =
    currentPage === requestedPage.page
      ? requestedPage
      : await queryPublishedCatalogSafe({
          q: parsedParams.q,
          scope: parsedParams.type,
          genre: parsedParams.genre || undefined,
          region: parsedParams.region || undefined,
          year: parsedParams.year ? Number.parseInt(parsedParams.year, 10) : undefined,
          sort: parsedParams.sort,
          page: currentPage,
          pageSize: parsedParams.pageSize,
        });
  const params: SearchRouteParams = {
    ...parsedParams,
    page: currentPage,
  };

  const selectedFilterCount = [params.type !== "all", params.genre, params.region, params.year].filter(Boolean).length;
  const resultTitle =
    params.q.length > 0 ? `Search results for “${params.q}”.` : "Search the catalog with URL-backed facets and pagination.";
  const resultSummary =
    selectedFilterCount > 0
      ? `The shared browsing shell now reflects query text, type, sort, optional genre, region, year facets, and page state directly in the URL.`
      : `This route keeps the compact \`reference-assets\` browsing language while letting search state live in the address bar instead of page-local placeholders.`;

  const filters: SearchFilterGroup[] = [
    {
      label: "Sort",
      name: "sort",
      value: params.sort,
      options: sortOptions,
    },
    {
      label: "Type",
      name: "type",
      value: params.type,
      options: typeOptions,
    },
    {
      label: "Genre",
      name: "genre",
      value: params.genre,
      options: buildFacetOptions(pageRecord.facets.genres, params.genre, "All genres"),
    },
    {
      label: "Region",
      name: "region",
      value: params.region,
      options: buildFacetOptions(pageRecord.facets.regions, params.region, "All regions"),
    },
    {
      label: "Year",
      name: "year",
      value: params.year,
      options: buildFacetOptions(pageRecord.facets.years, params.year, "All years"),
    },
  ];

  return {
    activeScope: buildActiveScope(params.type),
    params,
    results: pageRecord.items.map(mapPublishedCard),
    totalResults: pageRecord.totalItems,
    totalPages: pageRecord.totalPages,
    currentPage,
    filters,
    hotSearches,
    searchTitle: resultTitle,
    searchSummary: resultSummary,
    sectionKicker: "Search results",
    sectionTitle:
      pageRecord.totalItems > 0
        ? "Shared browse cards now reflect real URL state instead of placeholder-only controls."
        : "No titles matched the current search state.",
    sectionMeta:
      pageRecord.totalItems > 0
        ? `${pageRecord.totalItems} titles · page ${currentPage} of ${pageRecord.totalPages}`
        : "Try a looser query or clear one of the optional facets.",
  };
}

export async function buildBrowsePageData(
  scope: CatalogScope,
  searchParams: Record<string, string | string[] | undefined> | undefined,
) {
  const parsedParams = parseSearchParams(searchParams, SEARCH_PAGE_SIZE);
  const params: SearchRouteParams = {
    ...parsedParams,
    type: scope,
  };
  const requestedPage = await queryPublishedCatalogSafe({
    q: params.q,
    scope,
    genre: params.genre || undefined,
    region: params.region || undefined,
    year: params.year ? Number.parseInt(params.year, 10) : undefined,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  });
  const hotSearches = await getHotSearches(scope);
  const featuredLists = scope === "all" ? await getFeaturedListsSafe(3) : [];
  const currentPage = Math.min(params.page, requestedPage.totalPages);
  const pageRecord =
    currentPage === requestedPage.page
      ? requestedPage
      : await queryPublishedCatalogSafe({
          q: params.q,
          scope,
          genre: params.genre || undefined,
          region: params.region || undefined,
          year: params.year ? Number.parseInt(params.year, 10) : undefined,
          sort: params.sort,
          page: currentPage,
          pageSize: params.pageSize,
        });
  const currentParams = {
    ...params,
    page: currentPage,
  };

  const filters: SearchFilterGroup[] = [
    {
      label: "Sort",
      name: "sort",
      value: currentParams.sort,
      options: sortOptions,
    },
    {
      label: "Type",
      name: "type",
      value: currentParams.type,
      options: typeOptions,
    },
    {
      label: "Genre",
      name: "genre",
      value: currentParams.genre,
      options: buildFacetOptions(pageRecord.facets.genres, currentParams.genre, "All genres"),
    },
    {
      label: "Region",
      name: "region",
      value: currentParams.region,
      options: buildFacetOptions(pageRecord.facets.regions, currentParams.region, "All regions"),
    },
    {
      label: "Year",
      name: "year",
      value: currentParams.year,
      options: buildFacetOptions(pageRecord.facets.years, currentParams.year, "All years"),
    },
  ];

  return {
    actionPath: getBrowsePathForType(scope),
    currentPath: getBrowsePathForType(scope),
    currentParams,
    filters,
    results: pageRecord.items.map(mapPublishedCard),
    totalResults: pageRecord.totalItems,
    totalPages: pageRecord.totalPages,
    currentPage,
    hotSearches,
    buildHref(page: number) {
      return buildBrowseHref(currentParams, { page });
    },
    featuredLists,
  };
}
