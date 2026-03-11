import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailActions } from "../../components/detail/DetailActions";
import { DetailHero } from "../../components/detail/DetailHero";
import { ListQueuePanel } from "../../components/detail/ListQueuePanel";
import { DetailSynopsis } from "../../components/detail/DetailSynopsis";
import { DownloadResources } from "../../components/detail/DownloadResources";
import { RelatedRecommendations } from "../../components/detail/RelatedRecommendations";
import {
  getStringParam,
  getTimeSeconds,
  mapPublishedDetailRecord,
  mapPublishedList,
  mapPublishedQueue,
} from "../../components/detail/publishedCatalogAdapters";
import styles from "../../components/detail/detail-page.module.css";
import { Navbar } from "../../components/Navbar";
import { EpisodeSelector } from "../../components/player/EpisodeSelector";
import { PlayerShell } from "../../components/player/PlayerShell";
import { buildPublishedWatchHref } from "../../lib/server/catalog/identity";
import { getPublishedCatalogDetailByPublicId, resolvePublishedCatalogWatch } from "../../lib/server/catalog/service";
import type { DownloadResourceOption, MediaEpisodeOption, PlaybackSourceOption, PublicMediaListItem } from "../../types/media";

type SourceNavigationOption = PlaybackSourceOption & {
  href: string;
  isActive: boolean;
};

type RouteProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildCanonicalWatchStateHref(
  baseState: {
    mediaPublicId: string;
    listPublicId?: string;
    listItemPublicRef?: string;
    timeSeconds?: number;
  },
  updates: {
    episodePublicId?: string | null;
    resourcePublicId?: string | null;
  },
) {
  return buildPublishedWatchHref({
    mediaPublicId: baseState.mediaPublicId,
    episodePublicId: updates.episodePublicId ?? undefined,
    resourcePublicId: updates.resourcePublicId ?? undefined,
    listPublicId: baseState.listPublicId,
    listItemPublicRef: baseState.listItemPublicRef,
    timeSeconds: baseState.timeSeconds,
  });
}

function getActiveEpisodePublicId(
  episodes: MediaEpisodeOption[],
  searchParams: Record<string, string | string[] | undefined> | undefined,
  defaultEpisodePublicId?: string,
) {
  const requestedEpisodePublicId = getStringParam(searchParams?.e);
  return episodes.find((episode) => episode.publicId === requestedEpisodePublicId)?.publicId ?? defaultEpisodePublicId;
}

function getPlaybackOptionsForEpisode(sources: PlaybackSourceOption[], episodePublicId?: string) {
  if (!episodePublicId) {
    return sources.filter((source) => !source.episodePublicId);
  }

  const matching = sources.filter((source) => source.episodePublicId === episodePublicId || !source.episodePublicId);
  return matching.length > 0 ? matching : sources;
}

function isPlayableSource(source: PlaybackSourceOption) {
  return source.url.trim().length > 0 && source.status !== "offline" && source.status !== "reported";
}

function resolveActiveSource(sources: PlaybackSourceOption[], requestedResourcePublicId?: string) {
  const playableSources = sources.filter(isPlayableSource);

  return (
    playableSources.find((source) => source.publicId === requestedResourcePublicId) ??
    playableSources[0] ??
    sources.find((source) => source.publicId === requestedResourcePublicId) ??
    sources[0] ??
    null
  );
}

function resolveSourcePreferenceForEpisode(
  sources: PlaybackSourceOption[],
  episodePublicId: string | undefined,
  preferredSource: PlaybackSourceOption | null,
) {
  const episodeSources = getPlaybackOptionsForEpisode(sources, episodePublicId);
  if (!preferredSource) {
    return resolveActiveSource(episodeSources);
  }

  return (
    episodeSources.find(
      (option) =>
        isPlayableSource(option) &&
        option.provider === preferredSource.provider &&
        option.format === preferredSource.format &&
        option.label === preferredSource.label,
    ) ?? resolveActiveSource(episodeSources)
  );
}

function buildEpisodeWatchHref(
  baseState: {
    mediaPublicId: string;
    listPublicId?: string;
    listItemPublicRef?: string;
    timeSeconds?: number;
  },
  sources: PlaybackSourceOption[],
  episodePublicId: string | undefined,
  preferredSource: PlaybackSourceOption | null,
) {
  const matchedSource = resolveSourcePreferenceForEpisode(sources, episodePublicId, preferredSource);
  return buildCanonicalWatchStateHref(baseState, {
    episodePublicId: episodePublicId ?? null,
    resourcePublicId: matchedSource?.publicId ?? null,
  });
}

function getDownloadOptionsForEpisode(downloads: DownloadResourceOption[], episodePublicId?: string) {
  if (!episodePublicId) {
    return downloads;
  }

  const matching = downloads.filter((resource) => resource.episodePublicId === episodePublicId || !resource.episodePublicId);
  return matching.length > 0 ? matching : downloads;
}

function getResolvedListItem(
  items: PublicMediaListItem[] | undefined,
  mediaPublicId: string,
  activeEpisodePublicId?: string,
  listItemPublicRef?: string,
) {
  if (!items || items.length === 0) {
    return undefined;
  }

  if (listItemPublicRef) {
    const explicitItem = items.find((item) => item.publicRef === listItemPublicRef);
    if (explicitItem) {
      return explicitItem;
    }
  }

  if (activeEpisodePublicId) {
    const exactEpisodeItem = items.find(
      (item) => item.mediaPublicId === mediaPublicId && item.episodePublicId === activeEpisodePublicId,
    );
    if (exactEpisodeItem) {
      return exactEpisodeItem;
    }
  }

  return items.find((item) => item.mediaPublicId === mediaPublicId && !item.episodePublicId) ?? items.find((item) => item.mediaPublicId === mediaPublicId);
}

function getPlaybackTitle(title: string, episodeNumber?: number) {
  if (!episodeNumber) {
    return title;
  }

  return `${title}【第${episodeNumber}集】`;
}

export async function generateMetadata({ searchParams }: RouteProps): Promise<Metadata> {
  const mediaPublicId = getStringParam(searchParams?.v);
  if (!mediaPublicId) {
    return {
      title: "Media not found | Media Atlas",
    };
  }

  const publishedDetail = await getPublishedCatalogDetailByPublicId(mediaPublicId);
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

export default async function WatchPage({ searchParams }: RouteProps) {
  const mediaPublicId = getStringParam(searchParams?.v);
  if (!mediaPublicId) {
    notFound();
  }

  const requestedListPublicId = getStringParam(searchParams?.list);
  const requestedListItemPublicRef = getStringParam(searchParams?.li);
  const requestedEpisodePublicId = getStringParam(searchParams?.e);
  const requestedResourcePublicId = getStringParam(searchParams?.r);
  const timeSeconds = getTimeSeconds(searchParams);

  const [publishedDetail, publishedWatch] = await Promise.all([
    getPublishedCatalogDetailByPublicId(mediaPublicId),
    resolvePublishedCatalogWatch({
      mediaPublicId,
      episodePublicId: requestedEpisodePublicId,
      resourcePublicId: requestedResourcePublicId,
      listPublicId: requestedListPublicId,
      listItemPublicRef: requestedListItemPublicRef,
      timeSeconds,
    }),
  ]);

  if (!publishedDetail || !publishedWatch) {
    notFound();
  }

  const detail = mapPublishedDetailRecord(publishedDetail);
  const resolvedList = publishedWatch.list ? mapPublishedList(publishedWatch.list) : undefined;
  const resolvedQueue = publishedWatch.queue ? mapPublishedQueue(publishedWatch.queue) : undefined;
  const activeEpisodePublicId =
    publishedWatch.selectedEpisode?.publicId ??
    getActiveEpisodePublicId(detail.episodes, searchParams, detail.defaultEpisodePublicId);
  const resolvedListItem = getResolvedListItem(
    resolvedList?.items,
    detail.media.publicId,
    activeEpisodePublicId,
    publishedWatch.listItem?.publicRef ?? requestedListItemPublicRef,
  );
  const baseWatchState = {
    mediaPublicId: detail.media.publicId,
    listPublicId: resolvedList?.publicId,
    listItemPublicRef: resolvedListItem?.publicRef,
    timeSeconds,
  };
  const activePlaybackOptions = getPlaybackOptionsForEpisode(detail.playbackSources, activeEpisodePublicId);
  const activeSource = resolveActiveSource(
    activePlaybackOptions,
    requestedResourcePublicId ?? publishedWatch.selectedResource?.publicId,
  );

  const visibleDownloads = getDownloadOptionsForEpisode(detail.downloads, activeEpisodePublicId);
  const requestedDownloadResource = visibleDownloads.find((resource) => resource.publicId === requestedResourcePublicId);
  const hasRequestedPlaybackResource = activePlaybackOptions.some((source) => source.publicId === requestedResourcePublicId);
  const resolvedResourcePublicId =
    requestedResourcePublicId && (hasRequestedPlaybackResource || requestedDownloadResource)
      ? requestedResourcePublicId
      : activeSource?.publicId;
  const activeDownloadProvider = requestedDownloadResource?.provider ?? visibleDownloads[0]?.provider;
  const activeDownloads = activeDownloadProvider
    ? visibleDownloads.filter((resource) => resource.provider === activeDownloadProvider)
    : visibleDownloads;
  const activeEpisode = detail.episodes.find((episode) => episode.publicId === activeEpisodePublicId);

  const episodeOptions = detail.episodes.map((episode) => ({
    ...episode,
    href: buildEpisodeWatchHref(baseWatchState, detail.playbackSources, episode.publicId, activeSource),
    isActive: episode.publicId === activeEpisodePublicId,
  }));

  const sourceOptions: SourceNavigationOption[] = activePlaybackOptions
    .filter(isPlayableSource)
    .map((playbackSource) => ({
      ...playbackSource,
      href: buildCanonicalWatchStateHref(baseWatchState, {
        episodePublicId: activeEpisodePublicId ?? null,
        resourcePublicId: playbackSource.publicId,
      }),
      isActive: playbackSource.publicId === activeSource?.publicId,
    }));

  const providerTabs = [...new Map(visibleDownloads.map((item) => [item.provider, item.providerLabel])).entries()].map(
    ([provider, providerLabel]) => {
      const providerResource = visibleDownloads.find((resource) => resource.provider === provider);
      return {
        id: provider,
        label: providerLabel,
        href: buildCanonicalWatchStateHref(baseWatchState, {
          episodePublicId: activeEpisodePublicId ?? null,
          resourcePublicId: providerResource?.publicId ?? null,
        }),
        isActive: provider === activeDownloadProvider,
      };
    },
  );

  const nextEpisodeIndex = activeEpisode ? detail.episodes.findIndex((episode) => episode.publicId === activeEpisode.publicId) + 1 : -1;
  const nextEpisode = nextEpisodeIndex > 0 ? detail.episodes[nextEpisodeIndex] : undefined;
  const nextEpisodeHref = nextEpisode
    ? buildEpisodeWatchHref(baseWatchState, detail.playbackSources, nextEpisode.publicId, activeSource)
    : undefined;
  const canonicalWatchHref = buildCanonicalWatchStateHref(baseWatchState, {
    episodePublicId: activeEpisodePublicId ?? null,
    resourcePublicId: resolvedResourcePublicId ?? null,
  });
  const playbackTitle = getPlaybackTitle(detail.media.title, activeEpisode?.episodeNumber);

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={detail.media.type} />

      <div className={styles.detailShell}>
        <DetailHero media={detail.media} metadata={detail.metadata}>
          <DetailActions
            shareHref={canonicalWatchHref}
            copyHref={canonicalWatchHref}
            availabilityLabel={detail.media.resourceSummary.availabilityLabel}
          />
        </DetailHero>

        {resolvedList ? (
          <ListQueuePanel
            list={resolvedList}
            activeItem={resolvedListItem}
            queue={resolvedQueue}
            canonicalWatchHref={canonicalWatchHref}
          />
        ) : null}

        <DetailSynopsis synopsis={detail.media.synopsis} />

        <section className={styles.playerSection} aria-labelledby="player-shell-title">
          <div className={styles.sectionBlockHeader}>
            <h2 id="player-shell-title" className={styles.sectionHeading}>
              {playbackTitle}
            </h2>
          </div>

          {detail.episodes.length > 0 ? <EpisodeSelector mediaSlug={detail.media.slug} episodes={episodeOptions} /> : null}
          <PlayerShell
            media={detail.media}
            playbackTitle={playbackTitle}
            source={activeSource}
            availableSources={activePlaybackOptions}
            sourceOptions={sourceOptions}
            episodes={episodeOptions}
            activeEpisode={activeEpisode}
            nextEpisodeHref={nextEpisodeHref}
            nextEpisodeLabel={nextEpisode?.title}
          />
        </section>

        <DownloadResources activeEpisode={activeEpisode} providerTabs={providerTabs} resources={activeDownloads} />
        <RelatedRecommendations items={detail.relatedCards.slice(0, 4)} />
      </div>
    </main>
  );
}
