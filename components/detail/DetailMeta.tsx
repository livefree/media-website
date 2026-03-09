import type { MediaDetailMetadata } from "../../types/media";
import styles from "./detail-page.module.css";

function joinOrFallback(values: string[], fallback: string) {
  return values.length > 0 ? values.join(" / ") : fallback;
}

function toChineseRating(label: string) {
  return label.replace("Douban", "豆瓣");
}

export function DetailMeta({
  metadata,
  availabilityLabel,
}: {
  metadata: MediaDetailMetadata;
  availabilityLabel: string;
}) {
  return (
    <div className={styles.heroMetaBlock}>
      <p className={styles.metaLine}>
        {metadata.yearLabel} · {metadata.countryLabel} · {metadata.genreLabel}
      </p>
      <p className={styles.metaLine}>{toChineseRating(metadata.ratingLabel)}</p>
      <p className={styles.metaLine}>
        <span className={styles.metaKey}>导演：</span>
        <span>{joinOrFallback(metadata.directors, "未提供")}</span>
      </p>
      <p className={styles.metaLine}>
        <span className={styles.metaKey}>主演：</span>
        <span>{joinOrFallback(metadata.cast, "未提供")}</span>
      </p>
      <p className={styles.metaLineMuted}>{availabilityLabel}</p>
    </div>
  );
}
