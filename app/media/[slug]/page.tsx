import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getMediaDetail } from "../../../lib/media-catalog";
import { buildWatchHref } from "../../../lib/media-utils";
import type { DownloadResourceOption, MediaEpisodeOption, PlaybackSourceOption } from "../../../types/media";

type RouteProps = {
  params: {
    slug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

function getStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getLegacyEpisode(
  episodes: MediaEpisodeOption[],
  searchParams: Record<string, string | string[] | undefined> | undefined,
  defaultEpisodeSlug?: string,
) {
  const requestedEpisodeSlug = getStringParam(searchParams?.episode);
  return episodes.find((episode) => episode.slug === requestedEpisodeSlug) ?? episodes.find((episode) => episode.slug === defaultEpisodeSlug);
}

function getPlaybackOptionsForEpisode(sources: PlaybackSourceOption[], episodeSlug?: string) {
  if (!episodeSlug) {
    return sources.filter((source) => !source.episodeSlug);
  }

  const matching = sources.filter((source) => source.episodeSlug === episodeSlug || !source.episodeSlug);
  return matching.length > 0 ? matching : sources;
}

function getDownloadOptionsForEpisode(downloads: DownloadResourceOption[], episodeSlug?: string) {
  if (!episodeSlug) {
    return downloads;
  }

  const matching = downloads.filter((resource) => resource.episodeSlug === episodeSlug || !resource.episodeSlug);
  return matching.length > 0 ? matching : downloads;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const detail = getMediaDetail(params.slug);

  if (!detail) {
    return {
      title: "Media not found | Media Atlas",
    };
  }

  return {
    title: `${detail.media.title} | Media Atlas`,
    description: detail.media.synopsis,
  };
}

export default function MediaDetailCompatibilityPage({ params, searchParams }: RouteProps) {
  const detail = getMediaDetail(params.slug);
  if (!detail) {
    notFound();
  }

  const activeEpisode = getLegacyEpisode(detail.episodes, searchParams, detail.defaultEpisodeSlug);
  const activePlaybackOptions = getPlaybackOptionsForEpisode(detail.playbackSources, activeEpisode?.slug);
  const requestedSourceId = getStringParam(searchParams?.source);
  const requestedSource = activePlaybackOptions.find((source) => source.id === requestedSourceId);

  const visibleDownloads = getDownloadOptionsForEpisode(detail.downloads, activeEpisode?.slug);
  const requestedDownloadProvider = getStringParam(searchParams?.download);
  const requestedDownloadResource = requestedDownloadProvider
    ? visibleDownloads.find((resource) => resource.provider === requestedDownloadProvider)
    : undefined;

  redirect(
    buildWatchHref({
      mediaPublicId: detail.media.publicId,
      episodePublicId: activeEpisode?.publicId,
      resourcePublicId: requestedSource?.publicId ?? requestedDownloadResource?.publicId,
      listPublicId: getStringParam(searchParams?.list),
      listItemPublicRef: getStringParam(searchParams?.li),
      timeSeconds: (() => {
        const raw = getStringParam(searchParams?.t);
        if (!raw) {
          return undefined;
        }

        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      })(),
    }),
  );
}
