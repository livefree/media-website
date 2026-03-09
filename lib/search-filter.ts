import { getBrowseCards, getCatalogConfig, getSearchSeed } from "./media-catalog";
import { buildBrowseHref, getBrowsePathForType, parseSearchParams, type SearchRouteParams } from "./search-params";

import type { BrowseMediaCard, CatalogQueryState, CatalogScope } from "../types/media";

const SEARCH_PAGE_SIZE = 18;

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

function findOptionLabel(options: SearchOption[], value: string): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

function buildActiveScope(type: CatalogScope): CatalogScope {
  return type === "all" ? "all" : type;
}

export function buildSearchPageData(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const parsedParams = parseSearchParams(searchParams, SEARCH_PAGE_SIZE);
  const config = getCatalogConfig();

  const typeOptions = config.filterGroups.find((group) => group.id === "type")?.options ?? [];
  const sortOptions = config.filterGroups.find((group) => group.id === "sort")?.options ?? [];
  const genreOptions = config.filterGroups.find((group) => group.id === "genre")?.options ?? [];
  const regionOptions = config.filterGroups.find((group) => group.id === "region")?.options ?? [];
  const yearOptions = config.filterGroups.find((group) => group.id === "year")?.options ?? [];
  const genreValue = parsedParams.genre && genreOptions.some((option) => option.value === parsedParams.genre) ? parsedParams.genre : "";
  const regionValue =
    parsedParams.region && regionOptions.some((option) => option.value === parsedParams.region) ? parsedParams.region : "";
  const yearValue = parsedParams.year && yearOptions.some((option) => option.value === parsedParams.year) ? parsedParams.year : "";
  const params: SearchRouteParams = {
    ...parsedParams,
    genre: genreValue,
    region: regionValue,
    year: yearValue,
  };

  const query: CatalogQueryState = {
    q: params.q,
    type: params.type,
    genre: params.genre ? findOptionLabel(genreOptions, params.genre) : undefined,
    region: params.region ? findOptionLabel(regionOptions, params.region) : undefined,
    year: yearValue ? Number.parseInt(yearValue, 10) : undefined,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  };

  const initialSeed = getSearchSeed(query);
  const totalPages = Math.max(1, Math.ceil(initialSeed.total / params.pageSize));
  const currentPage = Math.min(params.page, totalPages);
  const normalizedQuery = currentPage === params.page ? query : { ...query, page: currentPage };
  const seed = currentPage === params.page ? initialSeed : getSearchSeed(normalizedQuery);

  const selectedFilterCount = [params.type !== "all", params.genre, params.region, params.year].filter(Boolean).length;
  const resultTitle =
    params.q.length > 0 ? `Search results for “${params.q}”.` : "Search the catalog with URL-backed facets and pagination.";
  const resultSummary =
    selectedFilterCount > 0
      ? `The shared browsing shell now reflects query text, type, sort, optional genre, region, year facets, and page state directly in the URL.`
      : `This route keeps the compact \`reference-assets\` browsing language while letting search state live in the address bar instead of page-local placeholders.`;

  const trendingItems: BrowseMediaCard[] =
    seed.cards.length > 0 ? seed.cards.slice(0, 5) : getBrowseCards(params.type === "all" ? "all" : params.type, 5);

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
      options: [{ value: "", label: "All genres" }, ...genreOptions],
    },
    {
      label: "Region",
      name: "region",
      value: params.region,
      options: [{ value: "", label: "All regions" }, ...regionOptions],
    },
    {
      label: "Year",
      name: "year",
      value: params.year,
      options: [{ value: "", label: "All years" }, ...yearOptions],
    },
  ];

  return {
    activeScope: buildActiveScope(params.type),
    params: {
      ...params,
      page: currentPage,
    },
    results: seed.cards,
    totalResults: seed.total,
    totalPages,
    currentPage,
    filters,
    hotSearches: config.hotSearches,
    trendingItems,
    searchTitle: resultTitle,
    searchSummary: resultSummary,
    sectionKicker: "Search results",
    sectionTitle:
      seed.total > 0
        ? "Shared browse cards now reflect real URL state instead of placeholder-only controls."
        : "No titles matched the current search state.",
    sectionMeta:
      seed.total > 0
        ? `${seed.total} titles · page ${currentPage} of ${totalPages}`
        : "Try a looser query or clear one of the optional facets.",
  };
}

export function buildBrowsePageData(
  scope: CatalogScope,
  searchParams: Record<string, string | string[] | undefined> | undefined,
) {
  const parsedParams = parseSearchParams(searchParams, SEARCH_PAGE_SIZE);
  const config = getCatalogConfig();
  const params: SearchRouteParams = {
    ...parsedParams,
    type: scope,
  };

  const genreOptions = config.filterGroups.find((group) => group.id === "genre")?.options ?? [];
  const regionOptions = config.filterGroups.find((group) => group.id === "region")?.options ?? [];
  const yearOptions = config.filterGroups.find((group) => group.id === "year")?.options ?? [];
  const normalizedGenre = params.genre && genreOptions.some((option) => option.value === params.genre) ? params.genre : "";
  const normalizedRegion = params.region && regionOptions.some((option) => option.value === params.region) ? params.region : "";
  const normalizedYear = params.year && yearOptions.some((option) => option.value === params.year) ? params.year : "";
  const normalizedParams: SearchRouteParams = {
    ...params,
    genre: normalizedGenre,
    region: normalizedRegion,
    year: normalizedYear,
  };

  const query: CatalogQueryState = {
    q: normalizedParams.q,
    type: scope,
    genre: normalizedGenre ? findOptionLabel(genreOptions, normalizedGenre) : undefined,
    region: normalizedRegion ? findOptionLabel(regionOptions, normalizedRegion) : undefined,
    year: normalizedYear ? Number.parseInt(normalizedYear, 10) : undefined,
    sort: normalizedParams.sort,
    page: normalizedParams.page,
    pageSize: normalizedParams.pageSize,
  };

  const initialSeed = getSearchSeed(query);
  const totalPages = Math.max(1, Math.ceil(initialSeed.total / normalizedParams.pageSize));
  const currentPage = Math.min(normalizedParams.page, totalPages);
  const currentParams = currentPage === normalizedParams.page ? normalizedParams : { ...normalizedParams, page: currentPage };
  const seed = currentPage === normalizedParams.page ? initialSeed : getSearchSeed({ ...query, page: currentPage });

  const sortOptions = config.filterGroups.find((group) => group.id === "sort")?.options ?? [];
  const typeOptions = config.filterGroups.find((group) => group.id === "type")?.options ?? [];

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
      options: [{ value: "", label: "All genres" }, ...genreOptions],
    },
    {
      label: "Region",
      name: "region",
      value: currentParams.region,
      options: [{ value: "", label: "All regions" }, ...regionOptions],
    },
    {
      label: "Year",
      name: "year",
      value: currentParams.year,
      options: [{ value: "", label: "All years" }, ...yearOptions],
    },
  ];

  return {
    actionPath: getBrowsePathForType(scope),
    currentPath: getBrowsePathForType(scope),
    currentParams,
    filters,
    results: seed.cards,
    totalResults: seed.total,
    totalPages,
    currentPage,
    hotSearches: config.hotSearches,
    buildHref(page: number) {
      return buildBrowseHref(currentParams, { page });
    },
  };
}
