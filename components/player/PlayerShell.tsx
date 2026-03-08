import Link from "next/link";

import type { MediaEpisodeOption, MediaItem, PlaybackSourceOption } from "../../types/media";
import styles from "../detail/detail-page.module.css";

export function PlayerShell({
  media,
  source,
  activeEpisode,
}: {
  media: MediaItem;
  source: PlaybackSourceOption | null;
  activeEpisode?: MediaEpisodeOption;
}) {
  return (
    <div className={styles.playerSurface}>
      {media.backdropUrl ? (
        <div className={styles.playerBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
      ) : null}

      <div className={styles.playerInner}>
        <div className={styles.playerBadgeRow}>
          <span className={styles.statPill}>{media.resourceSummary.availabilityLabel}</span>
          {source ? <span className={styles.statPill}>{source.providerLabel}</span> : null}
          {activeEpisode ? (
            <span className={styles.statPill}>
              S{activeEpisode.seasonNumber} · E{activeEpisode.episodeNumber}
            </span>
          ) : null}
        </div>

        <h3 className={styles.playerHeadline}>
          {activeEpisode ? `${activeEpisode.title} is selected for playback.` : `Playback shell for ${media.title}.`}
        </h3>

        <p className={styles.playerCopy}>
          {source
            ? `Current source: ${source.label}${source.quality ? ` in ${source.quality}` : ""}. This shell stays presentational for now while still exposing the live resource URL and provider context.`
            : "No playback source is currently available for the active selection."}
        </p>

        {source ? <p className={styles.playerUrl}>{source.url}</p> : null}

        <div className={styles.resourceActions}>
          {source ? (
            <Link
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className={`${styles.resourceAction} ${styles.resourceActionPrimary}`}
            >
              Launch source
            </Link>
          ) : null}
          <span className={styles.resourceAction}>{media.type}</span>
          <span className={styles.resourceAction}>{media.status}</span>
        </div>
      </div>
    </div>
  );
}
