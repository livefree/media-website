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
    <>
      <div className={styles.playerViewport}>
        <div className={styles.playerBrand}>ddys.io</div>
        {media.backdropUrl ? (
          <div className={styles.playerBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
        ) : null}

        <div className={styles.playerChrome}>
          <div className={styles.playerControlRail}>
            <span className={styles.playerControlDot}>▶</span>
            <span className={styles.playerControlDot}>🔊</span>
            <span className={styles.playerTime}>00:00 / 0:00</span>
            <span className={styles.playerControlSpacer} />
            <span className={styles.playerControlDot}>⚙</span>
            <span className={styles.playerControlDot}>⛶</span>
          </div>
        </div>
      </div>

      <div className={styles.playerStatusRow}>
        <div className={styles.playerStatusLeft}>
          <span>播放源广告与低端影视（DDYS.IO）无关，请勿相信</span>
        </div>

        <div className={styles.playerStatusRight}>
          {activeEpisode ? <span>{activeEpisode.title}</span> : null}
          {source ? <span>{source.providerLabel}</span> : null}
          <span>{media.status}</span>
        </div>
      </div>
    </>
  );
}
