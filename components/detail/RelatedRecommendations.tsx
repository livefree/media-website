import Link from "next/link";

import type { BrowseMediaCard } from "../../types/media";
import styles from "./detail-page.module.css";

export function RelatedRecommendations({ items }: { items: BrowseMediaCard[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.contentCard} aria-labelledby="related-recommendations-title">
      <h2 id="related-recommendations-title" className={styles.sectionHeading}>
        相关推荐
      </h2>

      <div className={styles.relatedGrid}>
        {items.map((item) => (
          <article key={item.id} className={styles.relatedCard}>
            <Link href={item.href} className={styles.relatedPosterLink}>
              <img src={item.posterUrl} alt={`${item.title} poster`} className={styles.relatedPoster} />
              <span className={styles.relatedRating}>{item.ratingValue.toFixed(1)}</span>
            </Link>
            <div className={styles.relatedCopy}>
              <h3 className={styles.relatedTitle}>
                <Link href={item.href}>{item.title}</Link>
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
