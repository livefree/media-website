import "server-only";

import type { PublishedCatalogCard, PublishedListItemRecord, PublishedMediaIdentityRecord, PublishedPlaybackResourceRecord, PublishedWatchQuery } from "./types";

export function buildPublishedWatchHref({
  mediaPublicId,
  episodePublicId,
  resourcePublicId,
  listPublicId,
  listItemPublicRef,
  timeSeconds,
}: PublishedWatchQuery): string {
  const params = new URLSearchParams();
  params.set("v", mediaPublicId);

  if (episodePublicId) {
    params.set("e", episodePublicId);
  }

  if (resourcePublicId) {
    params.set("r", resourcePublicId);
  }

  if (listPublicId) {
    params.set("list", listPublicId);
  }

  if (listItemPublicRef) {
    params.set("li", listItemPublicRef);
  }

  if (typeof timeSeconds === "number" && Number.isFinite(timeSeconds) && timeSeconds > 0) {
    params.set("t", String(Math.floor(timeSeconds)));
  }

  return `/watch?${params.toString()}`;
}

export function buildPublishedListHref(publicId: string): string {
  return `/list/${publicId}`;
}

export function buildPublishedListDirectoryHref(): string {
  return "/lists";
}

export function buildPublishedCompatibilityHref(slug: string, episodeSlug?: string): string {
  if (!episodeSlug) {
    return `/media/${slug}`;
  }

  const params = new URLSearchParams();
  params.set("episode", episodeSlug);
  return `/media/${slug}?${params.toString()}`;
}

export function buildPublishedWatchQuery(
  media: Pick<PublishedMediaIdentityRecord | PublishedCatalogCard, "publicId">,
  options?: Omit<PublishedWatchQuery, "mediaPublicId">,
): PublishedWatchQuery {
  return {
    mediaPublicId: media.publicId,
    episodePublicId: options?.episodePublicId,
    resourcePublicId: options?.resourcePublicId,
    listPublicId: options?.listPublicId,
    listItemPublicRef: options?.listItemPublicRef,
    timeSeconds: options?.timeSeconds,
  };
}

export function buildPublishedListCountLabel(count: number): string {
  return `${count} titles`;
}

export function buildPublishedListItemSubtitle(
  media: Pick<PublishedMediaIdentityRecord, "releaseYear" | "originalTitle" | "type">,
  episode?: { episodeNumber?: number | null; title: string },
): string {
  if (episode) {
    const episodeLabel = episode.episodeNumber ? `E${String(episode.episodeNumber).padStart(2, "0")}` : "Episode";
    return [String(media.releaseYear), episodeLabel, episode.title].filter(Boolean).join(" · ");
  }

  return [media.originalTitle, String(media.releaseYear), media.type].filter(Boolean).join(" · ");
}

export function buildListItemNavigationReference(item: PublishedListItemRecord) {
  return {
    publicRef: item.publicRef,
    position: item.position,
    title: item.mediaTitle,
    canonicalWatchHref: item.canonicalWatchHref,
  };
}

export function attachListContext(href: string, listPublicId?: string, listItemPublicRef?: string): string {
  if (!listPublicId) {
    return href;
  }

  const url = new URL(href, "https://catalog.local");
  url.searchParams.set("list", listPublicId);

  if (listItemPublicRef) {
    url.searchParams.set("li", listItemPublicRef);
  }

  return `${url.pathname}${url.search}`;
}
