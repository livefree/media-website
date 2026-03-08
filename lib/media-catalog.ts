import { catalogCategories, catalogFilterGroups, hotSearchSuggestions, quickFilterChips } from "../data/categories";
import { mediaCatalog } from "../data/media";
import { browseEvents, platformUsers, recentSearches, resourceActivities } from "../data/platform";
import type { MediaItem, MediaType, SearchSuggestion } from "../types/media";
import { buildMediaSearchText, compareFeaturedMedia, getEpisodeCount, getResourceCounts } from "./media-utils";

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

export function getCatalogConfig() {
  return {
    categories: catalogCategories,
    filterGroups: catalogFilterGroups,
    quickFilterChips,
    hotSearches: hotSearchSuggestions,
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
        episodeSlug: entry.episodeSlug,
        progressPercent: entry.progressPercent,
        currentTimeSeconds: entry.currentTimeSeconds,
        durationSeconds: entry.durationSeconds,
        updatedAt: entry.updatedAt,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
