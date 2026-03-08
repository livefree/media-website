import type { CatalogBadgeTone, MediaItem, MediaResourceLink } from "../types/media";

const badgePriority: Record<CatalogBadgeTone, number> = {
  hot: 5,
  new: 4,
  updated: 3,
  "staff-pick": 2,
  classic: 1,
};

export function flattenMediaResources(media: MediaItem): MediaResourceLink[] {
  const episodeResources = media.seasons.flatMap((season) =>
    season.episodes.flatMap((episode) => [...episode.streamLinks, ...episode.downloadLinks]),
  );

  return [...media.resources, ...episodeResources];
}

export function getEpisodeCount(media: MediaItem): number {
  return media.seasons.reduce((total, season) => total + season.episodes.length, 0);
}

export function getResourceCounts(media: MediaItem) {
  return flattenMediaResources(media).reduce(
    (totals, resource) => {
      if (resource.mode === "stream") {
        totals.streamCount += 1;
      } else {
        totals.downloadCount += 1;
      }

      return totals;
    },
    { streamCount: 0, downloadCount: 0 },
  );
}

export function buildMediaSearchText(media: MediaItem): string {
  return [
    media.title,
    media.originalTitle,
    media.tagline,
    media.synopsis,
    media.originCountry,
    ...media.genres,
    ...media.tags,
    ...media.credits.map((credit) => credit.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function compareFeaturedMedia(left: MediaItem, right: MediaItem): number {
  const featuredDelta = Number(right.isFeatured) - Number(left.isFeatured);
  if (featuredDelta !== 0) {
    return featuredDelta;
  }

  const badgeDelta = badgePriority[right.badge.tone] - badgePriority[left.badge.tone];
  if (badgeDelta !== 0) {
    return badgeDelta;
  }

  const demandDelta =
    right.metrics.weeklyViews +
    right.metrics.weeklySearches -
    (left.metrics.weeklyViews + left.metrics.weeklySearches);

  if (demandDelta !== 0) {
    return demandDelta;
  }

  return right.rating.value - left.rating.value;
}
