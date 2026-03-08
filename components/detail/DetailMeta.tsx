import type { MediaDetailMetadata } from "../../types/media";
import styles from "./detail-page.module.css";

function joinOrFallback(values: string[], fallback: string) {
  return values.length > 0 ? values.join(", ") : fallback;
}

export function DetailMeta({
  metadata,
  availabilityLabel,
}: {
  metadata: MediaDetailMetadata;
  availabilityLabel: string;
}) {
  const metadataItems = [
    { label: "Release", value: metadata.yearLabel },
    { label: "Country", value: metadata.countryLabel },
    { label: "Genres", value: metadata.genreLabel },
    { label: "Rating", value: metadata.ratingLabel },
    { label: "Directors", value: joinOrFallback(metadata.directors, "Not listed") },
    { label: "Cast", value: joinOrFallback(metadata.cast, "Not listed") },
  ];

  return (
    <>
      <div className={styles.metadataGrid}>
        {metadataItems.map((item) => (
          <div key={item.label} className={styles.metaCard}>
            <p className={styles.metaLabel}>{item.label}</p>
            <p className={styles.metaValue}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.creditStrip} aria-label="Metadata chips">
        <span className={styles.creditPill}>{availabilityLabel}</span>
        {metadata.credits.map((credit) => (
          <span key={`${credit.role}-${credit.name}`} className={styles.creditPill}>
            {credit.role}: {credit.name}
          </span>
        ))}
      </div>
    </>
  );
}
