import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailActions } from "../../components/detail/DetailActions";
import { DetailHero } from "../../components/detail/DetailHero";
import { ListContextPanel } from "../../components/detail/ListContextPanel";
import { DetailSynopsis } from "../../components/detail/DetailSynopsis";
import { DownloadResources } from "../../components/detail/DownloadResources";
import { RelatedRecommendations } from "../../components/detail/RelatedRecommendations";
import styles from "../../components/detail/detail-page.module.css";
import { Navbar } from "../../components/Navbar";
import { EpisodeSelector } from "../../components/player/EpisodeSelector";
import { PlayerShell } from "../../components/player/PlayerShell";
import { SourceTabs } from "../../components/player/SourceTabs";
import { getMediaDetailByPublicId, resolvePublicPlayback } from "../../lib/media-catalog";
import { buildWatchHref } from "../../lib/media-utils";
import type { DownloadResourceOption, MediaEpisodeOption, PlaybackSourceOption, PublicMediaListItem } from "../../types/media";

type RouteProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

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
  return buildWatchHref({
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

function getDownloadOptionsForEpisode(downloads: DownloadResourceOption[], episodePublicId?: string) {
  if (!episodePublicId) {
    return downloads;
  }

  const matching = downloads.filter((resource) => resource.episodePublicId === episodePublicId || !resource.episodePublicId);
  return matching.length > 0 ? matching : downloads;
}

function getTimeSeconds(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const raw = getStringParam(searchParams?.t);
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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

export async function generateMetadata({ searchParams }: RouteProps): Promise<Metadata> {
  const mediaPublicId = getStringParam(searchParams?.v);
  if (!mediaPublicId) {
    return {
      title: "Media not found | Media Atlas",
    };
  }

  const detail = getMediaDetailByPublicId(mediaPublicId);
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

export default function WatchPage({ searchParams }: RouteProps) {
  const mediaPublicId = getStringParam(searchParams?.v);
  if (!mediaPublicId) {
    notFound();
  }

  const detail = getMediaDetailByPublicId(mediaPublicId);
  if (!detail) {
    notFound();
  }

  const activeEpisodePublicId = getActiveEpisodePublicId(detail.episodes, searchParams, detail.defaultEpisodePublicId);
  const requestedListPublicId = getStringParam(searchParams?.list);
  const requestedListItemPublicRef = getStringParam(searchParams?.li);
  const timeSeconds = getTimeSeconds(searchParams);
  const resolvedPlayback = resolvePublicPlayback({
    mediaPublicId,
    episodePublicId: activeEpisodePublicId,
    resourcePublicId: getStringParam(searchParams?.r),
    listPublicId: requestedListPublicId,
    listItemPublicRef: requestedListItemPublicRef,
  });
  const resolvedList = resolvedPlayback?.list;
  const resolvedListItem = getResolvedListItem(resolvedList?.items, detail.media.publicId, activeEpisodePublicId, requestedListItemPublicRef);
  const baseWatchState = {
    mediaPublicId: detail.media.publicId,
    listPublicId: resolvedList?.publicId,
    listItemPublicRef: resolvedListItem?.publicRef,
    timeSeconds,
  };
  const activePlaybackOptions = getPlaybackOptionsForEpisode(detail.playbackSources, activeEpisodePublicId);
  const requestedResourcePublicId = getStringParam(searchParams?.r);
  const activeSource =
    activePlaybackOptions.find((source) => source.publicId === requestedResourcePublicId) ?? activePlaybackOptions[0] ?? null;

  const visibleDownloads = getDownloadOptionsForEpisode(detail.downloads, activeEpisodePublicId);
  const requestedDownloadResource = visibleDownloads.find((resource) => resource.publicId === requestedResourcePublicId);
  const hasRequestedPlaybackResource = activePlaybackOptions.some((source) => source.publicId === requestedResourcePublicId);
  const resolvedResourcePublicId =
    requestedResourcePublicId && (hasRequestedPlaybackResource || requestedDownloadResource)
      ? requestedResourcePublicId
      : undefined;
  const activeDownloadProvider = requestedDownloadResource?.provider ?? visibleDownloads[0]?.provider;
  const activeDownloads = activeDownloadProvider
    ? visibleDownloads.filter((resource) => resource.provider === activeDownloadProvider)
    : visibleDownloads;

  const sourceTabs = activePlaybackOptions.map((source) => ({
    id: source.publicId,
    label: source.label,
    providerLabel: source.providerLabel,
    quality: source.quality,
    format: source.format,
    status: source.status,
    href: buildCanonicalWatchStateHref(baseWatchState, {
      episodePublicId: activeEpisodePublicId ?? null,
      resourcePublicId: source.publicId,
    }),
    isActive: source.publicId === activeSource?.publicId,
  }));

  const episodeOptions = detail.episodes.map((episode) => ({
    ...episode,
    href: buildCanonicalWatchStateHref(baseWatchState, {
      episodePublicId: episode.publicId,
      resourcePublicId: null,
    }),
    isActive: episode.publicId === activeEpisodePublicId,
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

  const activeEpisode = detail.episodes.find((episode) => episode.publicId === activeEpisodePublicId);
  const nextEpisodeIndex = activeEpisode ? detail.episodes.findIndex((episode) => episode.publicId === activeEpisode.publicId) + 1 : -1;
  const nextEpisode = nextEpisodeIndex > 0 ? detail.episodes[nextEpisodeIndex] : undefined;
  const nextEpisodePlaybackOptions = nextEpisode
    ? getPlaybackOptionsForEpisode(detail.playbackSources, nextEpisode.publicId)
    : [];
  const nextEpisodeSource = nextEpisode
    ? nextEpisodePlaybackOptions.find(
        (option) =>
          option.provider === activeSource?.provider &&
          option.format === activeSource?.format &&
          option.label === activeSource?.label,
      ) ?? nextEpisodePlaybackOptions[0]
    : undefined;
  const nextEpisodeHref = nextEpisode
    ? buildCanonicalWatchStateHref(baseWatchState, {
        episodePublicId: nextEpisode.publicId,
        resourcePublicId: nextEpisodeSource?.publicId ?? null,
      })
    : undefined;
  const canonicalWatchHref = buildCanonicalWatchStateHref(baseWatchState, {
    episodePublicId: activeEpisodePublicId ?? null,
    resourcePublicId: resolvedResourcePublicId ?? null,
  });

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
          <ListContextPanel
            list={resolvedList}
            activeItem={resolvedListItem}
            canonicalWatchHref={canonicalWatchHref}
          />
        ) : null}

        <DetailSynopsis synopsis={detail.media.synopsis} />

        <section className={styles.playerSection} aria-labelledby="player-shell-title">
          <div className={styles.sectionBlockHeader}>
            <h2 id="player-shell-title" className={styles.sectionHeading}>
              在线播放
            </h2>
          </div>

          <SourceTabs tabs={sourceTabs} />
          {detail.episodes.length > 0 ? <EpisodeSelector mediaSlug={detail.media.slug} episodes={episodeOptions} /> : null}
          <PlayerShell
            media={detail.media}
            source={activeSource}
            availableSources={activePlaybackOptions}
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
