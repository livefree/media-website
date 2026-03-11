import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getStringParam, getTimeSeconds, mapPublishedDetailRecord } from "../../../components/detail/publishedCatalogAdapters";
import { buildPublishedWatchHref } from "../../../lib/server/catalog/identity";
import { getPublishedCatalogDetailBySlug } from "../../../lib/server/catalog/service";
import type { DownloadResourceOption, MediaEpisodeOption, PlaybackSourceOption } from "../../../types/media";

type RouteProps = {
  params: {
    slug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

function getLegacyEpisode(
  episodes: MediaEpisodeOption[],
  searchParams: Record<string, string | string[] | undefined> | undefined,
  defaultEpisodePublicId?: string,
) {
  const requestedEpisodeSlug = getStringParam(searchParams?.episode);
  return episodes.find((episode) => episode.slug === requestedEpisodeSlug) ?? episodes.find((episode) => episode.publicId === defaultEpisodePublicId);
}

function getPlaybackOptionsForEpisode(sources: PlaybackSourceOption[], episodePublicId?: string) {
  if (!episodePublicId) {
    return sources.filter((source) => !source.episodePublicId);
  }

  const matching = sources.filter((source) => source.episodePublicId === episodePublicId || !source.episodePublicId);
  return matching.length > 0 ? matching : sources;
}

function getDownloadOptionsForEpisode(downloads: DownloadResourceOption[], episodePublicId?: string) {
  if (!episodePublicId) {
    return downloads;
  }

  const matching = downloads.filter((resource) => resource.episodePublicId === episodePublicId || !resource.episodePublicId);
  return matching.length > 0 ? matching : downloads;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const publishedDetail = await getPublishedCatalogDetailBySlug(params.slug);

  if (!publishedDetail) {
    return {
      title: "Media not found | Media Atlas",
    };
  }

  return {
    title: `${publishedDetail.media.title} | Media Atlas`,
    description: publishedDetail.media.description ?? publishedDetail.media.summary,
  };
}

export default async function MediaDetailCompatibilityPage({ params, searchParams }: RouteProps) {
  const publishedDetail = await getPublishedCatalogDetailBySlug(params.slug);
  if (!publishedDetail) {
    notFound();
  }

  const detail = mapPublishedDetailRecord(publishedDetail);
  const activeEpisode = getLegacyEpisode(detail.episodes, searchParams, detail.defaultEpisodePublicId);
  const activePlaybackOptions = getPlaybackOptionsForEpisode(detail.playbackSources, activeEpisode?.publicId);
  const requestedSourceId = getStringParam(searchParams?.source);
  const requestedSource = requestedSourceId
    ? activePlaybackOptions.find((source) => source.id === requestedSourceId || source.publicId === requestedSourceId)
    : undefined;

  const visibleDownloads = getDownloadOptionsForEpisode(detail.downloads, activeEpisode?.publicId);
  const requestedDownloadProvider = getStringParam(searchParams?.download);
  const requestedDownloadResource = requestedDownloadProvider
    ? visibleDownloads.find((resource) => resource.provider === requestedDownloadProvider)
    : undefined;

  redirect(
    buildPublishedWatchHref({
      mediaPublicId: detail.media.publicId,
      episodePublicId: activeEpisode?.publicId,
      resourcePublicId: requestedSource?.publicId ?? requestedDownloadResource?.publicId,
      listPublicId: getStringParam(searchParams?.list),
      listItemPublicRef: getStringParam(searchParams?.li),
      timeSeconds: getTimeSeconds(searchParams),
    }),
  );
}
