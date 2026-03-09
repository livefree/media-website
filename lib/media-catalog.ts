import { catalogCategories, catalogFilterGroups, hotSearchSuggestions, quickFilterChips } from "../data/categories";
import { mediaCatalog } from "../data/media";
import { browseEvents, platformUsers, recentSearches, resourceActivities } from "../data/platform";
import type {
  BrowseMediaCard,
  CatalogCoverageSummary,
  CatalogFacetSummary,
  CatalogFeed,
  CatalogFilterOption,
  CatalogQueryState,
  CatalogScope,
  CatalogSortValue,
  MediaDetailRecord,
  MediaItem,
  MediaType,
  SearchSuggestion,
} from "../types/media";
import {
  buildBrowseMediaCard,
  buildDetailMetadata,
  buildMediaSearchText,
  compareFeaturedMedia,
  getDownloadResources,
  getEpisodeCount,
  getEpisodeOptions,
  getMediaHref,
  getPlaybackSources,
  getResourceCounts,
} from "./media-utils";

function sortMedia(items: MediaItem[], sort: CatalogSortValue): MediaItem[] {
  const sorted = [...items];

  if (sort === "rating") {
    return sorted.sort((left, right) => right.rating.value - left.rating.value);
  }

  if (sort === "popular") {
    return sorted.sort(
      (left, right) =>
        right.metrics.weeklyViews +
        right.metrics.weeklySearches -
        (left.metrics.weeklyViews + left.metrics.weeklySearches),
    );
  }

  return sorted.sort((left, right) => right.year - left.year || compareFeaturedMedia(left, right));
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(pageSize, 1);
  const offset = (safePage - 1) * safePageSize;
  return items.slice(offset, offset + safePageSize);
}

function countFacetOptions(values: string[]): CatalogFilterOption[] {
  const counts = values.reduce<Map<string, number>>((map, value) => {
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map());

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .map(([value, count]) => ({ value, label: value, count }));
}

export function getAllMedia(): MediaItem[] {
  return mediaCatalog;
}

export function getMediaBySlug(slug: string): MediaItem | undefined {
  return mediaCatalog.find((media) => media.slug === slug);
}

export function getMediaByType(type: MediaType): MediaItem[] {
  return mediaCatalog.filter((media) => media.type === type);
}

export function searchMedia(query: string, type?: MediaType): MediaItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return type ? getMediaByType(type) : getAllMedia();
  }

  return mediaCatalog.filter((media) => {
    if (type && media.type !== type) {
      return false;
    }

    return buildMediaSearchText(media).includes(normalizedQuery);
  });
}

export function getFeaturedMedia(limit = 12): MediaItem[] {
  return [...mediaCatalog].sort(compareFeaturedMedia).slice(0, limit);
}

export function getHotSearches(limit = 5): SearchSuggestion[] {
  return hotSearchSuggestions.slice(0, limit);
}

export function getBrowseCards(scope: CatalogScope = "all", limit?: number): BrowseMediaCard[] {
  const items = scope === "all" ? mediaCatalog : getMediaByType(scope);
  const cards = sortMedia(items, "popular").map(buildBrowseMediaCard);
  return typeof limit === "number" ? cards.slice(0, limit) : cards;
}

export function getCatalogFacets(items: MediaItem[] = mediaCatalog): CatalogFacetSummary {
  return {
    genres: countFacetOptions(items.flatMap((media) => media.genres)),
    years: countFacetOptions(items.map((media) => String(media.year))),
    regions: countFacetOptions(items.map((media) => media.originCountry)),
  };
}

export function getCatalogCoverageSummary(pageSize = 18): CatalogCoverageSummary {
  const safePageSize = Math.max(1, pageSize);
  const typeGenrePairs = new Set<string>();
  const typeRegionPairs = new Set<string>();
  const typeYearPairs = new Set<string>();
  const genres = new Set<string>();
  const regions = new Set<string>();
  const years = new Set<number>();

  const byType = mediaCatalog.reduce(
    (summary, media) => {
      summary[media.type] += 1;
      years.add(media.year);
      regions.add(media.originCountry);

      for (const genre of media.genres) {
        genres.add(genre);
        typeGenrePairs.add(`${media.type}::${genre}`);
      }

      typeRegionPairs.add(`${media.type}::${media.originCountry}`);
      typeYearPairs.add(`${media.type}::${media.year}`);

      return summary;
    },
    { movie: 0, series: 0, anime: 0 } as Record<MediaType, number>,
  );

  return {
    totalTitles: mediaCatalog.length,
    pageSize: safePageSize,
    totalPages: Math.ceil(mediaCatalog.length / safePageSize),
    byType,
    uniqueGenreCount: genres.size,
    uniqueRegionCount: regions.size,
    uniqueYearCount: years.size,
    typeGenrePairCount: typeGenrePairs.size,
    typeRegionPairCount: typeRegionPairs.size,
    typeYearPairCount: typeYearPairs.size,
  };
}

export function getCategoryFeed(scope: CatalogScope = "all", limit = 24): CatalogFeed {
  const category = catalogCategories.find((entry) => entry.mediaType === scope);
  const items = getBrowseCards(scope, limit);

  if (!category) {
    return {
      scope,
      title: "Browse all",
      description: "Shared catalog feed spanning movie, series, and anime records.",
      href: "/",
      items,
    };
  }

  return {
    scope,
    title: category.label,
    description: category.description,
    href: category.href,
    items,
  };
}

export function getCatalogConfig() {
  const facets = getCatalogFacets();

  return {
    categories: catalogCategories,
    filterGroups: catalogFilterGroups.map((group) => {
      if (group.id === "genre") {
        return { ...group, options: facets.genres };
      }

      if (group.id === "year") {
        return { ...group, options: facets.years };
      }

      if (group.id === "region") {
        return { ...group, options: facets.regions };
      }

      return group;
    }),
    quickFilterChips,
    hotSearches: hotSearchSuggestions,
  };
}

export function getSearchSeed(query: CatalogQueryState) {
  const genre = query.genre;
  const year = query.year;
  const region = query.region;
  const scoped = query.type === "all" ? getAllMedia() : getMediaByType(query.type);
  const byQuery = query.q ? searchMedia(query.q, query.type === "all" ? undefined : query.type) : scoped;
  const byGenre = genre ? byQuery.filter((media) => media.genres.includes(genre)) : byQuery;
  const byYear = year ? byGenre.filter((media) => media.year === year) : byGenre;
  const byRegion = region ? byYear.filter((media) => media.originCountry === region) : byYear;
  const sorted = sortMedia(byRegion, query.sort);
  const pageItems = paginate(sorted, query.page, query.pageSize);

  return {
    query,
    total: sorted.length,
    items: pageItems,
    cards: pageItems.map(buildBrowseMediaCard),
    facets: getCatalogFacets(byRegion),
  };
}

export function getRelatedMedia(slug: string, limit = 6): BrowseMediaCard[] {
  const media = getMediaBySlug(slug);
  if (!media) {
    return [];
  }

  return mediaCatalog
    .filter((candidate) => candidate.slug !== slug)
    .sort((left, right) => {
      const leftShared = left.type === media.type || left.genres.some((genre) => media.genres.includes(genre));
      const rightShared = right.type === media.type || right.genres.some((genre) => media.genres.includes(genre));

      if (leftShared !== rightShared) {
        return Number(rightShared) - Number(leftShared);
      }

      return compareFeaturedMedia(left, right);
    })
    .slice(0, limit)
    .map(buildBrowseMediaCard);
}

export function getMediaDetail(slug: string): MediaDetailRecord | undefined {
  const media = getMediaBySlug(slug);
  if (!media) {
    return undefined;
  }

  const episodes = getEpisodeOptions(media);

  return {
    media,
    href: getMediaHref(media),
    metadata: buildDetailMetadata(media),
    playbackSources: getPlaybackSources(media),
    downloads: getDownloadResources(media),
    episodes,
    defaultEpisodeSlug: episodes.find((episode) => episode.isDefault)?.slug,
    relatedCards: getRelatedMedia(slug),
  };
}

export function getCatalogSnapshot() {
  const totals = mediaCatalog.reduce(
    (summary, media) => {
      const counts = getResourceCounts(media);
      summary.mediaCount += 1;
      summary.episodeCount += getEpisodeCount(media);
      summary.streamCount += counts.streamCount;
      summary.downloadCount += counts.downloadCount;
      summary.byType[media.type] += 1;
      return summary;
    },
    {
      mediaCount: 0,
      episodeCount: 0,
      streamCount: 0,
      downloadCount: 0,
      byType: {
        movie: 0,
        series: 0,
        anime: 0,
      } as Record<MediaType, number>,
    },
  );

  return {
    ...totals,
    userCount: platformUsers.length,
    searchCount: recentSearches.length,
    browseEventCount: browseEvents.length,
    resourceEventCount: resourceActivities.length,
  };
}

export function getContinueWatching(userId: string) {
  const user = platformUsers.find((entry) => entry.id === userId);
  if (!user) {
    return [];
  }

  return user.continueWatching
    .map((entry) => {
      const media = getMediaBySlug(entry.mediaSlug);
      if (!media) {
        return null;
      }

      return {
        media,
        card: buildBrowseMediaCard(media),
        detail: getMediaDetail(media.slug),
        episodeSlug: entry.episodeSlug,
        progressPercent: entry.progressPercent,
        currentTimeSeconds: entry.currentTimeSeconds,
        durationSeconds: entry.durationSeconds,
        updatedAt: entry.updatedAt,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
