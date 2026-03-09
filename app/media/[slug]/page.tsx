import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailActions } from "../../../components/detail/DetailActions";
import { DetailHero } from "../../../components/detail/DetailHero";
import { DetailSynopsis } from "../../../components/detail/DetailSynopsis";
import { DownloadResources } from "../../../components/detail/DownloadResources";
import { RelatedRecommendations } from "../../../components/detail/RelatedRecommendations";
import styles from "../../../components/detail/detail-page.module.css";
import { Navbar } from "../../../components/Navbar";
import { EpisodeSelector } from "../../../components/player/EpisodeSelector";
import { PlayerShell } from "../../../components/player/PlayerShell";
import { SourceTabs } from "../../../components/player/SourceTabs";
import { getMediaDetail } from "../../../lib/media-catalog";
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

function buildDetailHref(
  slug: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  updates: Record<string, string | null | undefined>,
) {
  const nextParams = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      const normalizedValue = getStringParam(value);
      if (normalizedValue) {
        nextParams.set(key, normalizedValue);
      }
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      nextParams.delete(key);
      continue;
    }

    nextParams.set(key, value);
  }

  const query = nextParams.toString();
  return query ? `/media/${slug}?${query}` : `/media/${slug}`;
}

function getActiveEpisode(
  episodes: MediaEpisodeOption[],
  searchParams: Record<string, string | string[] | undefined> | undefined,
  defaultEpisodeSlug?: string,
) {
  const requestedEpisode = getStringParam(searchParams?.episode);
  return episodes.find((episode) => episode.slug === requestedEpisode)?.slug ?? defaultEpisodeSlug;
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

export default function MediaDetailPage({ params, searchParams }: RouteProps) {
  const detail = getMediaDetail(params.slug);

  if (!detail) {
    notFound();
  }

  const activeEpisodeSlug = getActiveEpisode(detail.episodes, searchParams, detail.defaultEpisodeSlug);
  const activePlaybackOptions = getPlaybackOptionsForEpisode(detail.playbackSources, activeEpisodeSlug);
  const activeSourceId = getStringParam(searchParams?.source);
  const activeSource =
    activePlaybackOptions.find((source) => source.id === activeSourceId) ?? activePlaybackOptions[0] ?? null;

  const visibleDownloads = getDownloadOptionsForEpisode(detail.downloads, activeEpisodeSlug);
  const downloadProviders = [...new Map(visibleDownloads.map((item) => [item.provider, item.providerLabel])).entries()];
  const requestedDownloadProvider = getStringParam(searchParams?.download);
  const activeDownloadProvider =
    downloadProviders.find(([provider]) => provider === requestedDownloadProvider)?.[0] ?? downloadProviders[0]?.[0];
  const activeDownloads = activeDownloadProvider
    ? visibleDownloads.filter((resource) => resource.provider === activeDownloadProvider)
    : visibleDownloads;

  const sourceTabs = activePlaybackOptions.map((source) => ({
    id: source.id,
    label: source.label,
    providerLabel: source.providerLabel,
    quality: source.quality,
    format: source.format,
    status: source.status,
    href: buildDetailHref(params.slug, searchParams, {
      source: source.id,
      episode: activeEpisodeSlug,
      download: activeDownloadProvider ?? null,
    }),
    isActive: source.id === activeSource?.id,
  }));

  const episodeOptions = detail.episodes.map((episode) => ({
    ...episode,
    href: buildDetailHref(params.slug, searchParams, {
      episode: episode.slug,
      source: null,
      download: activeDownloadProvider ?? null,
    }),
    isActive: episode.slug === activeEpisodeSlug,
  }));

  const providerTabs = downloadProviders.map(([provider, providerLabel]) => ({
    id: provider,
    label: providerLabel,
    href: buildDetailHref(params.slug, searchParams, {
      episode: activeEpisodeSlug,
      source: activeSource?.id ?? null,
      download: provider,
    }),
    isActive: provider === activeDownloadProvider,
  }));

  const activeEpisode = detail.episodes.find((episode) => episode.slug === activeEpisodeSlug);
  const nextEpisodeIndex = activeEpisode ? detail.episodes.findIndex((episode) => episode.slug === activeEpisode.slug) + 1 : -1;
  const nextEpisode = nextEpisodeIndex > 0 ? detail.episodes[nextEpisodeIndex] : undefined;
  const nextEpisodePlaybackOptions = nextEpisode
    ? getPlaybackOptionsForEpisode(detail.playbackSources, nextEpisode.slug)
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
    ? buildDetailHref(params.slug, searchParams, {
        episode: nextEpisode.slug,
        source: nextEpisodeSource?.id ?? null,
        download: activeDownloadProvider ?? null,
      })
    : undefined;

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={detail.media.type} />

      <div className={styles.detailShell}>
        <DetailHero media={detail.media} metadata={detail.metadata}>
          <DetailActions
            shareHref={detail.href}
            copyHref={activeSource?.url ?? detail.href}
            availabilityLabel={detail.media.resourceSummary.availabilityLabel}
          />
        </DetailHero>

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
