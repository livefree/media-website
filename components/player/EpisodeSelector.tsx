"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { MediaEpisodeOption } from "../../types/media";
import { setAutoplayIntentForHref } from "./autoplay-intent";
import styles from "../detail/detail-page.module.css";

type EpisodeSelection = MediaEpisodeOption & {
  href: string;
  isActive: boolean;
};

const MEDIA_PROGRESS_EVENT = "media-progress-updated";

function readWatchedEpisodeSlugs(mediaSlug: string) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  const watched = new Set<string>();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(`media-progress:${mediaSlug}:`)) {
      continue;
    }

    const parts = key.split(":");
    const episodeSlug = parts[2];
    if (!episodeSlug || episodeSlug === "feature") {
      continue;
    }

    try {
      const payload = JSON.parse(window.localStorage.getItem(key) ?? "{}") as {
        currentTime?: number;
        duration?: number;
        completed?: boolean;
      };

      const watchedEnough =
        Boolean(payload.completed) ||
        (typeof payload.currentTime === "number" &&
          (payload.currentTime >= 30 ||
            (typeof payload.duration === "number" && payload.duration > 0 && payload.currentTime / payload.duration >= 0.85)));

      if (watchedEnough) {
        watched.add(episodeSlug);
      }
    } catch {
      continue;
    }
  }

  return watched;
}

export function EpisodeSelector({
  mediaSlug,
  episodes,
}: {
  mediaSlug: string;
  episodes: EpisodeSelection[];
}) {
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => setWatchedEpisodes(readWatchedEpisodeSlugs(mediaSlug));
    refresh();

    const handleProgressUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ mediaSlug?: string }>;
      if (!customEvent.detail?.mediaSlug || customEvent.detail.mediaSlug === mediaSlug) {
        refresh();
      }
    };

    window.addEventListener(MEDIA_PROGRESS_EVENT, handleProgressUpdate as EventListener);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(MEDIA_PROGRESS_EVENT, handleProgressUpdate as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, [mediaSlug]);

  if (episodes.length === 0) {
    return null;
  }

  return (
    <section className={styles.selectorBlock} aria-labelledby="episode-selector-title">
      <div className={styles.selectorLabelRow}>
        <span id="episode-selector-title" className={styles.selectorLabel}>
          选集：
        </span>
      </div>

      <div className={styles.selectorTabs}>
        {episodes.map((episode) => (
          <div key={episode.id} className={styles.selectorButtonShell}>
            <Link
              href={episode.href}
              scroll={false}
              onClick={() => setAutoplayIntentForHref(episode.href)}
              className={`${styles.selectorButton} ${styles.selectorButtonNumeric} ${
                episode.isActive ? styles.selectorButtonActive : ""
              } ${watchedEpisodes.has(episode.slug) && !episode.isActive ? styles.selectorButtonWatched : ""}`}
              aria-current={episode.isActive ? "page" : undefined}
              aria-label={episode.title || `第 ${episode.episodeNumber} 集`}
            >
              {episode.episodeNumber}
            </Link>
            <span role="tooltip" className={styles.selectorTooltip}>
              {episode.title || `第 ${episode.episodeNumber} 集`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
