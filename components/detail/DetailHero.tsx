import type { ReactNode } from "react";

import { PosterArtwork } from "../../components/PosterArtwork";
import type { MediaDetailMetadata, MediaItem } from "../../types/media";
import { DetailMeta } from "./DetailMeta";
import styles from "./detail-page.module.css";

export function DetailHero({
  media,
  metadata,
  children,
}: {
  media: MediaItem;
  metadata: MediaDetailMetadata;
  children: ReactNode;
}) {
  return (
    <section className={styles.heroCard}>
      {media.backdropUrl ? (
        <div className={styles.heroBackdrop} style={{ backgroundImage: `url(${media.backdropUrl})` }} aria-hidden="true" />
      ) : null}

      <div className={styles.heroInner}>
        <div className={styles.posterWrap}>
          <PosterArtwork
            src={media.posterUrl}
            alt={`${media.title} poster`}
            title={media.title}
            variant={media.type}
            className={styles.posterImage}
            loading="eager"
          />
        </div>

        <div className={styles.heroContent}>
          <div>
            <h1 className={styles.heroTitle}>{metadata.title}</h1>
            {metadata.originalTitle ? <p className={styles.subtitleLine}>{metadata.originalTitle}</p> : null}
          </div>

          <DetailMeta metadata={metadata} availabilityLabel={media.resourceSummary.availabilityLabel} />
          {children}
        </div>
      </div>
    </section>
  );
}
