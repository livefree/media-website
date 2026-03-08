import type { ReactNode } from "react";

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
          <img
            src={media.posterUrl}
            alt={`${media.title} poster`}
            className={styles.posterImage}
          />
          <div className={styles.posterBadge}>
            <span>{media.badge.label}</span>
            <span>{metadata.ratingLabel}</span>
          </div>
        </div>

        <div className={styles.heroContent}>
          <div>
            <p className={styles.eyebrow}>{media.type} detail</p>
            <h1 className={styles.heroTitle}>{metadata.title}</h1>
            {metadata.originalTitle ? <p className={styles.alternateTitle}>{metadata.originalTitle}</p> : null}
          </div>

          <p className={styles.tagline}>{media.tagline}</p>
          <DetailMeta metadata={metadata} availabilityLabel={media.resourceSummary.availabilityLabel} />
          {children}
        </div>
      </div>
    </section>
  );
}
