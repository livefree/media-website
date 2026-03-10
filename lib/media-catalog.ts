import { catalogCategories, catalogFilterGroups, hotSearchSuggestionSlugs, quickFilterChips } from "../data/categories";
import { mediaCatalog } from "../data/media";
import { browseEvents, platformUsers, publicLists, recentSearches, resourceActivities } from "../data/platform";
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
  PublicListDirectoryRecord,
  PublicListQueueItem,
  PublicListQueueRecord,
  PublicMediaList,
  PublicMediaListItem,
  PublicMediaListPageRecord,
  MediaResourceLink,
  MediaItem,
  MediaType,
  PublicWatchQuery,
  ResolvedPublicPlayback,
  SearchSuggestion,
} from "../types/media";
import {
  buildListCountLabel,
  buildCompatibilityWatchHref,
  buildBrowseMediaCard,
  buildDetailMetadata,
  buildListItemSubtitle,
  buildPublicListDirectoryHref,
  buildPublicListHref,
  buildWatchHref,
  buildMediaWatchContext,
  buildMediaSearchText,
  getPublicListVisibilityLabel,
  compareFeaturedMedia,
  getCompatibilityMediaHref,
  getDownloadResources,
  getEpisodeCount,
  getEpisodeOptions,
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

function buildSearchSuggestion(media: MediaItem): SearchSuggestion {
  const watchContext = buildMediaWatchContext(media);

  return {
    slug: media.slug,
    href: media.canonicalWatchHref,
    publicId: media.publicId,
    canonicalWatchHref: media.canonicalWatchHref,
    compatibilityHref: media.compatibilityHref,
    watchContext,
    title: media.title,
    type: media.type,
    year: media.year,
    rating: media.rating.value,
  };
}

function getEpisodeFromMedia(media: MediaItem, publicId: string) {
  return media.seasons.flatMap((season) => season.episodes).find((episode) => episode.publicId === publicId);
}

function getEpisodeBySlugFromMedia(media: MediaItem, slug: string) {
  return media.seasons.flatMap((season) => season.episodes).find((episode) => episode.slug === slug);
}

function getResourceFromMedia(media: MediaItem, publicId: string) {
  return (
    media.resources.find((resource) => resource.publicId === publicId) ??
    media.seasons
      .flatMap((season) => season.episodes.flatMap((episode) => [...episode.streamLinks, ...episode.downloadLinks]))
      .find((resource) => resource.publicId === publicId)
  );
}

function buildPublicMediaListItem(
  listPublicId: string,
  position: number,
  item: { publicRef: string; mediaSlug: string; episodeSlug?: string },
): PublicMediaListItem | null {
  const media = getMediaBySlug(item.mediaSlug);
  if (!media) {
    return null;
  }

  const episode = item.episodeSlug ? getEpisodeBySlugFromMedia(media, item.episodeSlug) : undefined;
  const watchContext = buildMediaWatchContext(media, {
    episodePublicId: episode?.publicId,
    listPublicId,
    listItemPublicRef: item.publicRef,
  });

  return {
    publicRef: item.publicRef,
    position,
    positionLabel: `${position}.`,
    mediaSlug: media.slug,
    mediaPublicId: media.publicId,
    posterUrl: media.posterUrl,
    mediaTitle: media.title,
    title: media.title,
    subtitle: buildListItemSubtitle(media, episode),
    episodeSlug: episode?.slug,
    episodePublicId: episode?.publicId,
    canonicalWatchHref: buildWatchHref(watchContext),
    compatibilityHref: buildCompatibilityWatchHref(media, { episodeSlug: episode?.slug }),
    watchContext,
  };
}

function getDiscoverablePublicListSeeds() {
  return [...publicLists]
    .filter((list) => list.visibility === "public")
    .sort((left, right) => (left.discoveryRank ?? Number.MAX_SAFE_INTEGER) - (right.discoveryRank ?? Number.MAX_SAFE_INTEGER));
}

function buildPublicMediaListSummary(
  list: (typeof publicLists)[number],
  items: PublicMediaListItem[],
): PublicMediaList {
  const firstItem = items[0];
  const coverMedia = firstItem ? getMediaByPublicId(firstItem.mediaPublicId) : undefined;
  const shareHref = buildPublicListHref(list.publicId);
  const itemCount = items.length;

  return {
    id: list.id,
    publicId: list.publicId,
    slug: list.slug,
    title: list.title,
    description: list.description,
    visibility: list.visibility,
    canonicalListHref: shareHref,
    shareHref,
    shareTitle: list.shareTitle ?? list.title,
    shareDescription: list.shareDescription ?? list.description,
    visibilityLabel: getPublicListVisibilityLabel(list.visibility),
    itemCount,
    itemCountLabel: buildListCountLabel(itemCount),
    coverPosterUrl: firstItem?.posterUrl,
    coverBackdropUrl: coverMedia?.backdropUrl ?? firstItem?.posterUrl,
    firstItemPublicRef: firstItem?.publicRef,
    firstItemWatchHref: firstItem?.canonicalWatchHref,
  };
}

function buildPublicMediaListPageRecord(list: (typeof publicLists)[number]): PublicMediaListPageRecord {
  const baseItems = list.items
    .map((item, index) => buildPublicMediaListItem(list.publicId, index + 1, item))
    .filter((item): item is PublicMediaListItem => item !== null);
  const items = baseItems.map((item, index) => ({
    ...item,
    previousItem:
      index > 0
        ? {
            publicRef: baseItems[index - 1].publicRef,
            position: baseItems[index - 1].position,
            title: baseItems[index - 1].title,
            canonicalWatchHref: baseItems[index - 1].canonicalWatchHref,
          }
        : undefined,
    nextItem:
      index < baseItems.length - 1
        ? {
            publicRef: baseItems[index + 1].publicRef,
            position: baseItems[index + 1].position,
            title: baseItems[index + 1].title,
            canonicalWatchHref: baseItems[index + 1].canonicalWatchHref,
          }
        : undefined,
  }));
  const summary = buildPublicMediaListSummary(list, items);

  return {
    ...summary,
    items,
  };
}

function buildPublicListQueueItem(item: PublicMediaListItem, currentPublicRef?: string): PublicListQueueItem {
  const isCurrent = item.publicRef === currentPublicRef;

  return {
    publicRef: item.publicRef,
    position: item.position,
    positionLabel: item.positionLabel,
    title: item.title,
    subtitle: item.subtitle,
    posterUrl: item.posterUrl,
    canonicalWatchHref: item.canonicalWatchHref,
    isCurrent,
    isPlayed: false,
    isUpNext: false,
  };
}

function buildPublicListQueueRecord(list: PublicMediaListPageRecord, currentPublicRef?: string): PublicListQueueRecord {
  const currentIndex = currentPublicRef ? list.items.findIndex((item) => item.publicRef === currentPublicRef) : -1;
  const queueItems = list.items.map((item, index) => ({
    ...buildPublicListQueueItem(item, currentPublicRef),
    isPlayed: currentIndex >= 0 ? index < currentIndex : false,
    isUpNext: currentIndex >= 0 ? index > currentIndex : index > 0,
  }));
  const currentItem = currentIndex >= 0 ? queueItems[currentIndex] : undefined;
  const previousItem = currentIndex > 0 ? queueItems[currentIndex - 1] : undefined;
  const nextItem = currentIndex >= 0 && currentIndex < queueItems.length - 1 ? queueItems[currentIndex + 1] : queueItems[1];

  return {
    listPublicId: list.publicId,
    listTitle: list.title,
    canonicalListHref: list.canonicalListHref,
    totalItems: list.itemCount,
    totalItemsLabel: list.itemCountLabel,
    currentItem,
    previousItem,
    nextItem,
    items: queueItems,
    upcomingItems: currentIndex >= 0 ? queueItems.slice(currentIndex + 1, currentIndex + 4) : queueItems.slice(1, 4),
  };
}

export function getAllMedia(): MediaItem[] {
  return mediaCatalog;
}

export function getMediaBySlug(slug: string): MediaItem | undefined {
  return mediaCatalog.find((media) => media.slug === slug);
}

export function getMediaByPublicId(publicId: string): MediaItem | undefined {
  return mediaCatalog.find((media) => media.publicId === publicId);
}

export function getMediaByType(type: MediaType): MediaItem[] {
  return mediaCatalog.filter((media) => media.type === type);
}

export function getEpisodeByPublicId(publicId: string) {
  for (const media of mediaCatalog) {
    const episode = getEpisodeFromMedia(media, publicId);
    if (episode) {
      return episode;
    }
  }

  return undefined;
}

export function getResourceByPublicId(publicId: string): MediaResourceLink | undefined {
  for (const media of mediaCatalog) {
    const resource = getResourceFromMedia(media, publicId);
    if (resource) {
      return resource;
    }
  }

  return undefined;
}

export function getPublicLists(): PublicMediaList[] {
  return getDiscoverablePublicListSeeds().map((list) => {
    const page = buildPublicMediaListPageRecord(list);
    const { items: _items, ...summary } = page;
    return summary;
  });
}

export function getPublicListDirectory(): PublicListDirectoryRecord {
  const items = getPublicLists();

  return {
    title: "Public Lists",
    description: "Discover queue-ready public watchlists built on opaque list identity and canonical watch URLs.",
    canonicalDirectoryHref: buildPublicListDirectoryHref(),
    listCount: items.length,
    listCountLabel: `${items.length} public lists`,
    items,
  };
}

export function getPublicListPageRecord(publicId: string): PublicMediaListPageRecord | undefined {
  const list = publicLists.find((entry) => entry.publicId === publicId);
  return list ? buildPublicMediaListPageRecord(list) : undefined;
}

export function getPublicListByPublicId(publicId: string): PublicMediaListPageRecord | undefined {
  return getPublicListPageRecord(publicId);
}

export function getPublicListQueue(publicId: string, currentPublicRef?: string): PublicListQueueRecord | undefined {
  const list = getPublicListPageRecord(publicId);
  return list ? buildPublicListQueueRecord(list, currentPublicRef) : undefined;
}

export function resolvePublicPlayback({
  mediaPublicId,
  episodePublicId,
  resourcePublicId,
  listPublicId,
  listItemPublicRef,
}: Pick<PublicWatchQuery, "mediaPublicId" | "episodePublicId" | "resourcePublicId" | "listPublicId" | "listItemPublicRef">): ResolvedPublicPlayback | undefined {
  const media = getMediaByPublicId(mediaPublicId);
  if (!media) {
    return undefined;
  }

  const episode = episodePublicId ? getEpisodeFromMedia(media, episodePublicId) : undefined;
  const resource = resourcePublicId ? getResourceFromMedia(media, resourcePublicId) : undefined;
  const list = listPublicId ? getPublicListPageRecord(listPublicId) : undefined;
  const listItem = list && listItemPublicRef ? list.items.find((item) => item.publicRef === listItemPublicRef) : undefined;
  const queue = list ? buildPublicListQueueRecord(list, listItem?.publicRef) : undefined;

  return {
    media,
    episode,
    resource,
    list,
    listItem,
    queue,
  };
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
  return hotSearchSuggestionSlugs
    .map((slug) => getMediaBySlug(slug))
    .filter((media): media is MediaItem => Boolean(media))
    .slice(0, limit)
    .map(buildSearchSuggestion);
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
    hotSearches: getHotSearches(),
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
  const compatibilityHref = getCompatibilityMediaHref(media);
  const watchContext = buildMediaWatchContext(media);

  return {
    media,
    href: media.canonicalWatchHref,
    canonicalWatchHref: media.canonicalWatchHref,
    compatibilityHref,
    watchContext,
    metadata: buildDetailMetadata(media),
    playbackSources: getPlaybackSources(media),
    downloads: getDownloadResources(media),
    episodes,
    defaultEpisodeSlug: episodes.find((episode) => episode.isDefault)?.slug,
    defaultEpisodePublicId: episodes.find((episode) => episode.isDefault)?.publicId,
    relatedCards: getRelatedMedia(slug),
  };
}

export function getMediaDetailByPublicId(publicId: string): MediaDetailRecord | undefined {
  const media = getMediaByPublicId(publicId);
  return media ? getMediaDetail(media.slug) : undefined;
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

      const episode =
        entry.episodeSlug !== undefined ? media.seasons.flatMap((season) => season.episodes).find((item) => item.slug === entry.episodeSlug) : undefined;
      const watchContext = buildMediaWatchContext(media, {
        episodePublicId: episode?.publicId,
        timeSeconds: entry.currentTimeSeconds,
      });

      return {
        media,
        card: buildBrowseMediaCard(media),
        detail: getMediaDetail(media.slug),
        episodeSlug: entry.episodeSlug,
        episodePublicId: episode?.publicId,
        canonicalWatchHref: buildWatchHref(watchContext),
        watchContext,
        progressPercent: entry.progressPercent,
        currentTimeSeconds: entry.currentTimeSeconds,
        durationSeconds: entry.durationSeconds,
        updatedAt: entry.updatedAt,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
