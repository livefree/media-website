import { getBrowseCards, getCatalogConfig, getSearchSeed } from "./media-catalog";
import { buildSearchHref, parseSearchParams, type SearchRouteParams } from "./search-params";

import type { BrowseMediaCard, CatalogQueryState, CatalogScope, CatalogSortValue } from "../types/media";

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

type SearchQuickChip = {
  label: string;
  href: string;
  active: boolean;
};

function findOptionLabel(options: SearchOption[], value: string): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

function buildActiveScope(type: CatalogScope): CatalogScope {
  return type === "all" ? "all" : type;
}

function buildQuickChips(params: SearchRouteParams): SearchQuickChip[] {
  const definitions = [
    { label: "Latest", overrides: { sort: "latest" as CatalogSortValue, type: "all" as CatalogScope } },
    { label: "Popular", overrides: { sort: "popular" as CatalogSortValue } },
    { label: "Movies", overrides: { type: "movie" as CatalogScope } },
    { label: "Series", overrides: { type: "series" as CatalogScope } },
    { label: "Anime", overrides: { type: "anime" as CatalogScope } },
    { label: "Top rated", overrides: { sort: "rating" as CatalogSortValue } },
  ];

  return definitions.map((definition) => {
    const nextParams = {
      ...params,
      ...definition.overrides,
      page: 1,
    };

    const isActive =
      (definition.label === "Latest" && params.sort === "latest" && params.type === "all") ||
      (definition.label === "Popular" && params.sort === "popular") ||
      (definition.label === "Movies" && params.type === "movie") ||
      (definition.label === "Series" && params.type === "series") ||
      (definition.label === "Anime" && params.type === "anime") ||
      (definition.label === "Top rated" && params.sort === "rating");

    return {
      label: definition.label,
      href: buildSearchHref(nextParams, {}, "/search"),
      active: isActive,
    };
  });
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
      : `This route keeps the compact \`web-to-colon\` browsing language while letting search state live in the address bar instead of page-local placeholders.`;

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
    quickChips: buildQuickChips({ ...params, page: currentPage }),
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
