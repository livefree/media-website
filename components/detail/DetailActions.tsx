import Link from "next/link";

import styles from "./detail-page.module.css";

export function DetailActions({
  primaryHref,
  secondaryHref,
  availabilityLabel,
  weeklyViews,
  saves,
}: {
  primaryHref?: string;
  secondaryHref?: string;
  availabilityLabel: string;
  weeklyViews: number;
  saves: number;
}) {
  return (
    <div className={styles.actionCluster}>
      <div className={styles.actionRow}>
        {primaryHref ? (
          <Link href={primaryHref} target="_blank" rel="noreferrer" className={styles.actionPrimary}>
            Watch active source
          </Link>
        ) : null}
        {secondaryHref ? (
          <Link href={secondaryHref} target="_blank" rel="noreferrer" className={styles.actionSecondary}>
            Open top mirror
          </Link>
        ) : null}
        <button type="button" className={styles.actionSecondary}>
          Add to watchlist
        </button>
        <button type="button" className={styles.actionSecondary}>
          Share entry
        </button>
      </div>

      <div className={styles.statsRow}>
        <span className={styles.statPill}>{availabilityLabel}</span>
        <span className={styles.statPill}>{weeklyViews.toLocaleString()} weekly views</span>
        <span className={styles.statPill}>{saves.toLocaleString()} saves</span>
      </div>
    </div>
  );
}
